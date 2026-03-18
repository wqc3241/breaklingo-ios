#import <React/RCTBridgeModule.h>
#import <StoreKit/StoreKit.h>

@interface StoreReviewModule : NSObject <RCTBridgeModule>
@end

@implementation StoreReviewModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(requestReview) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (@available(iOS 18.0, *)) {
      // iOS 18+: Use the new AppStore overlay API via SwiftUI scene
      // Fall back to the older API for now since we're in UIKit
      if ([SKStoreReviewController respondsToSelector:@selector(requestReviewInScene:)]) {
        UIWindowScene *scene = (UIWindowScene *)[[[[UIApplication sharedApplication] connectedScenes] allObjects] firstObject];
        if (scene) {
          [SKStoreReviewController requestReviewInScene:scene];
          return;
        }
      }
    }
    // iOS 14-17 fallback
    [SKStoreReviewController requestReview];
  });
}

@end
