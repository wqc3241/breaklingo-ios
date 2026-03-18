# BreakLingo iOS - Todo

## Pending — Batch 2 (User Feedback)

### UI Fixes
- [ ] 9. Quiz exit button — add X/close button to QuizScreen so users can exit mid-quiz. Show confirmation dialog ("Are you sure? Progress will be lost") before navigating back
- [ ] 12. YouTube player not full height — video frame in StudyScreen is not tall enough (width is fine). Fix YouTubePlayer component to use proper 16:9 aspect ratio height based on screen width
- [ ] 13. Talk tab conversation header too close to status bar — add safe area top padding to TalkConversation header. Also remove the redundant "End" button (voice controls handle the flow)

### UX Improvements
- [ ] 10. Merge URL input + search into single field — auto-detect if input is a YouTube URL (youtube.com, youtu.be) or a search term. One input field instead of two separate ones

### Bug Fixes
- [ ] 11. Script still generated in wrong language — generated script appears in Arabic/other language instead of video's actual language. The targetLanguage fix (item 8) may not be reaching all edge functions. Verify language is passed to extract-transcript and analyze-content consistently

## Completed — Batch 1 (Session 7-8)
- [x] 1. Profile icon white container — switched to custom JS header, bypasses iOS 26 UIBarButtonItem styling
- [x] 2. Recommended videos — useRecommendedVideos hook, personalized based on search history
- [x] 3. Auto unit generation bug — project coverage check now queries ALL learning_units
- [x] 4. Total unit/project count — Learn tab shows counts from DB, not just loaded page
- [x] 5. Single latest quiz score — compact single-row card
- [x] 6. Days streak — useStreak hook, AsyncStorage, triggered by quiz + talk completion
- [x] 7. XP & level system — useExperience hook, progressive formula, universal StatsHeader
- [x] 8. Language detection — passes targetLanguage to analyze-content edge function

## Completed (Session 7)
- [x] Voice-first Talk tab redesign (auto-listen, floating mic, split into 4 views)
- [x] Quiz redesign with QuizQuestionShell (type banners, tappable TTS, prefix stripping)
- [x] Architecture refactor (EmptyState, LoadingState, ErrorBoundary, centralized utils)
- [x] Paginated Learn tab (lazy-load questions, non-blocking generation)
- [x] Quiz content sanitization (strip 肢, 操 artifacts)
- [x] WordArrangeQ stable word pool (gray out instead of remove)
- [x] Pricing strategy document
- [x] Custom JS header (fixes iOS 26 UIBarButtonItem circle)
- [x] SafeAreaView edges fix (removed bottom gap across all tabs)
- [x] Quiz full-screen push (removed modal presentation)

## Completed (Earlier Sessions)
- [x] Talk tab edge function error: Fixed payload format
- [x] QuizFlow integration tests: 6 end-to-end tests
- [x] QuizScreen stale state bug: Added key={currentIndex}
- [x] Microphone crash fix: Added NSMicrophoneUsageDescription
- [x] AudioRecorderModule hardening: Session error checks, JS null guards
- [x] handleVoiceInput crash: Added try/catch
- [x] Talk tab fallback greeting: Conversation opens with fallback when edge function fails
