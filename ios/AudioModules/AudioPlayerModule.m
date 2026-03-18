#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@interface AudioPlayerModule : NSObject <RCTBridgeModule, AVAudioPlayerDelegate>
@property (nonatomic, strong) AVAudioPlayer *player;
@property (nonatomic, copy) RCTPromiseResolveBlock playResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock playReject;
@end

@implementation AudioPlayerModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(playBase64:(NSString *)base64
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      // Stop any currently playing audio
      if (self.player) {
        [self.player stop];
        self.player = nil;
      }
      // Resolve any pending promise
      if (self.playResolve) {
        self.playResolve(@(YES));
        self.playResolve = nil;
        self.playReject = nil;
      }

      NSData *audioData = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
      if (!audioData || audioData.length == 0) {
        reject(@"INVALID_DATA", @"Could not decode base64 audio data", nil);
        return;
      }

      NSError *sessionError = nil;
      [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                       withOptions:AVAudioSessionCategoryOptionDuckOthers
                                             error:&sessionError];
      [[AVAudioSession sharedInstance] setActive:YES error:nil];

      NSError *playerError = nil;
      self.player = [[AVAudioPlayer alloc] initWithData:audioData error:&playerError];
      if (playerError || !self.player) {
        reject(@"PLAYER_ERROR",
               playerError.localizedDescription ?: @"Could not create audio player",
               playerError);
        return;
      }

      self.playResolve = resolve;
      self.playReject = reject;
      self.player.delegate = self;
      [self.player play];
    } @catch (NSException *exception) {
      reject(@"PLAY_ERROR", exception.reason, nil);
    }
  });
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self.player) {
      [self.player stop];
      self.player = nil;
    }
    if (self.playResolve) {
      self.playResolve(@(YES));
      self.playResolve = nil;
      self.playReject = nil;
    }
    resolve(@(YES));
  });
}

RCT_EXPORT_METHOD(isPlaying:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@(self.player != nil && self.player.isPlaying));
}

#pragma mark - AVAudioPlayerDelegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
  // Deactivate audio session so recording can properly acquire the audio route
  [[AVAudioSession sharedInstance] setActive:NO
                                 withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                       error:nil];
  if (self.playResolve) {
    self.playResolve(@(flag));
    self.playResolve = nil;
    self.playReject = nil;
  }
  self.player = nil;
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error {
  if (self.playReject) {
    self.playReject(@"DECODE_ERROR", error.localizedDescription, error);
    self.playResolve = nil;
    self.playReject = nil;
  }
  self.player = nil;
}

@end
