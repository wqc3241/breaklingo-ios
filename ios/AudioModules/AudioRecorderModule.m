#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>

// Silence detection thresholds
static const float kSilenceThresholdDB = -40.0;  // dB below which is "silence"
static const float kSpeechThresholdDB = -30.0;    // dB above which is "speech"
static const NSTimeInterval kSilenceDuration = 1.5; // seconds of silence to auto-stop
static const NSTimeInterval kMaxRecordingDuration = 30.0; // max recording length
static const NSTimeInterval kMeteringInterval = 0.15; // how often to check levels

@interface AudioRecorderModule : RCTEventEmitter <RCTBridgeModule, AVAudioRecorderDelegate>
@property (nonatomic, strong) AVAudioRecorder *recorder;
@property (nonatomic, strong) NSString *recordingPath;
@property (nonatomic, strong) NSTimer *meteringTimer;
@property (nonatomic, assign) BOOL speechDetected;
@property (nonatomic, assign) NSTimeInterval silenceStart;
@property (nonatomic, assign) NSTimeInterval recordingStart;
@property (nonatomic, assign) BOOL hasListeners;
@end

@implementation AudioRecorderModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onSilenceDetected", @"onSpeechStarted"];
}

- (void)startObserving {
  self.hasListeners = YES;
}

- (void)stopObserving {
  self.hasListeners = NO;
}

RCT_EXPORT_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    resolve(@(granted));
  }];
}

RCT_EXPORT_METHOD(startRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      // Stop any existing recording and timer
      [self stopMeteringTimer];
      if (self.recorder && self.recorder.isRecording) {
        [self.recorder stop];
        self.recorder = nil;
      }

      NSString *fileName = [NSString stringWithFormat:@"recording_%@.m4a",
                            [[NSUUID UUID] UUIDString]];
      self.recordingPath = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
      NSURL *url = [NSURL fileURLWithPath:self.recordingPath];

      NSDictionary *settings = @{
        AVFormatIDKey: @(kAudioFormatMPEG4AAC),
        AVSampleRateKey: @44100.0,
        AVNumberOfChannelsKey: @1,
        AVEncoderAudioQualityKey: @(AVAudioQualityHigh),
      };

      // Deactivate first to cleanly transition from playback to recording
      [[AVAudioSession sharedInstance] setActive:NO
                                     withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                           error:nil];

      NSError *sessionError = nil;
      [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord
                                       withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker |
                                                   AVAudioSessionCategoryOptionAllowBluetooth
                                             error:&sessionError];
      if (sessionError) {
        reject(@"SESSION_ERROR",
               [NSString stringWithFormat:@"Could not configure audio session: %@", sessionError.localizedDescription],
               sessionError);
        return;
      }

      NSError *activateError = nil;
      [[AVAudioSession sharedInstance] setActive:YES error:&activateError];
      if (activateError) {
        reject(@"SESSION_ERROR",
               [NSString stringWithFormat:@"Could not activate audio session: %@", activateError.localizedDescription],
               activateError);
        return;
      }

      NSError *recorderError = nil;
      self.recorder = [[AVAudioRecorder alloc] initWithURL:url settings:settings error:&recorderError];
      if (recorderError || !self.recorder) {
        reject(@"RECORDER_ERROR",
               recorderError.localizedDescription ?: @"Could not create recorder",
               recorderError);
        return;
      }

      self.recorder.delegate = self;
      self.recorder.meteringEnabled = YES;
      [self.recorder record];

      // Reset silence detection state
      self.speechDetected = NO;
      self.silenceStart = 0;
      self.recordingStart = CACurrentMediaTime();

      // Start metering timer for silence detection
      self.meteringTimer = [NSTimer scheduledTimerWithTimeInterval:kMeteringInterval
                                                           target:self
                                                         selector:@selector(checkAudioLevels)
                                                         userInfo:nil
                                                          repeats:YES];

      resolve(@(YES));
    } @catch (NSException *exception) {
      reject(@"RECORD_ERROR", exception.reason, nil);
    }
  });
}

- (void)checkAudioLevels {
  if (!self.recorder || !self.recorder.isRecording) {
    [self stopMeteringTimer];
    return;
  }

  [self.recorder updateMeters];
  float avgPower = [self.recorder averagePowerForChannel:0];
  NSTimeInterval elapsed = CACurrentMediaTime() - self.recordingStart;

  // Max recording duration safety cap
  if (elapsed >= kMaxRecordingDuration) {
    NSLog(@"[AudioRecorder] Max recording duration reached (%.0fs)", kMaxRecordingDuration);
    [self stopMeteringTimer];
    if (self.hasListeners) {
      [self sendEventWithName:@"onSilenceDetected" body:@{@"reason": @"maxDuration"}];
    }
    return;
  }

  // Detect speech
  if (avgPower > kSpeechThresholdDB) {
    if (!self.speechDetected) {
      self.speechDetected = YES;
      if (self.hasListeners) {
        [self sendEventWithName:@"onSpeechStarted" body:@{@"avgPower": @(avgPower)}];
      }
    }
    self.silenceStart = 0; // Reset silence timer
  }

  // After speech detected, check for silence
  if (self.speechDetected && avgPower < kSilenceThresholdDB) {
    if (self.silenceStart == 0) {
      self.silenceStart = CACurrentMediaTime();
    } else {
      NSTimeInterval silenceDuration = CACurrentMediaTime() - self.silenceStart;
      if (silenceDuration >= kSilenceDuration) {
        NSLog(@"[AudioRecorder] Silence detected after speech (%.1fs silence)", silenceDuration);
        [self stopMeteringTimer];
        if (self.hasListeners) {
          [self sendEventWithName:@"onSilenceDetected" body:@{@"reason": @"silence"}];
        }
      }
    }
  }
}

- (void)stopMeteringTimer {
  if (self.meteringTimer) {
    [self.meteringTimer invalidate];
    self.meteringTimer = nil;
  }
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self stopMeteringTimer];

    if (self.recorder) {
      [self.recorder stop];
      self.recorder = nil;
    }

    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:&error];
    [[AVAudioSession sharedInstance] setActive:YES error:nil];

    resolve(self.recordingPath ?: @"");
  });
}

@end
