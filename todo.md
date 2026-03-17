# BreakLingo iOS - Todo

## Pending
- [x] **Talk tab edge function error**: Fixed payload format — edge function expects `projectContext: { vocabulary, grammar, detectedLanguage, title }` but app was sending flat fields. Updated both `startConversation` and `processUserInput` in `useConversation.ts`.

## Completed
- [x] **QuizFlow integration tests**: 6 end-to-end tests covering all 7 interactive question types (`__tests__/screens/QuizFlow.test.tsx`)
- [x] **QuizScreen stale state bug**: Added `key={currentIndex}` to force remount on question change
- [x] **Microphone crash fix**: Added `NSMicrophoneUsageDescription` to Info.plist
- [x] **AudioRecorderModule hardening**: Session error checks, existing recording cleanup, JS null guards
- [x] **handleVoiceInput crash**: Added missing try/catch in `useConversation.ts`
- [x] **Talk tab fallback greeting**: Conversation opens with fallback message when edge function fails
