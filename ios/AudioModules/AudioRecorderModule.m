#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@interface AudioRecorderModule : NSObject <RCTBridgeModule, AVAudioRecorderDelegate>
@property (nonatomic, strong) AVAudioRecorder *recorder;
@property (nonatomic, strong) NSString *recordingPath;
@end

@implementation AudioRecorderModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
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
      // Stop any existing recording first
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

      NSError *sessionError = nil;
      [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord
                                       withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
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
      [self.recorder record];
      resolve(@(YES));
    } @catch (NSException *exception) {
      reject(@"RECORD_ERROR", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
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
