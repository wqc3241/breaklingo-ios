# BreakLingo iOS - Todo

## Pending

### UI Fixes
- [ ] 1. Profile icon has white container background on most tabs — remove the white container so it matches the clean style
- [ ] 5. Learn tab: recent quiz score card shows multiple records — change to show only the single latest record

### Features
- [ ] 2. Implement recommended videos on Search tab based on user's search/research history
- [ ] 4. Learn tab: add total learning unit count at the top of the page
- [ ] 6. Days streak feature — mark daily streak as completed when user completes a unit or finishes a talk session (needs thoughtful design: streak tracking, visual display, reset logic)
- [ ] 7. Experience & level system — new users start at level 0, earn XP from unit completion (score-based) and talk sessions. Each level requires progressively more XP (needs thoughtful design: XP formula, level thresholds, UI display, persistence)

### Bug Fixes
- [ ] 3. Auto learning unit generation not working — after loading a new YouTube video, new learning units are not generated and added to the Learn tab. Debug the generation trigger and polling flow
- [ ] 8. Script generation language detection — system doesn't properly detect video language. Review the script/transcript generation to ensure the generated script matches the video's actual language regardless of whether a transcript file exists

## Completed (Session 7)
- [x] Voice-first Talk tab redesign (auto-listen, floating mic, split into 4 views)
- [x] Quiz redesign with QuizQuestionShell (type banners, tappable TTS, prefix stripping)
- [x] Architecture refactor (EmptyState, LoadingState, ErrorBoundary, centralized utils)
- [x] Paginated Learn tab (lazy-load questions, non-blocking generation)
- [x] Quiz content sanitization (strip 肢, 操 artifacts)
- [x] WordArrangeQ stable word pool (gray out instead of remove)
- [x] Profile icon fix (hitSlop, smaller icon)
- [x] Pricing strategy document

## Completed (Earlier Sessions)
- [x] Talk tab edge function error: Fixed payload format
- [x] QuizFlow integration tests: 6 end-to-end tests
- [x] QuizScreen stale state bug: Added key={currentIndex}
- [x] Microphone crash fix: Added NSMicrophoneUsageDescription
- [x] AudioRecorderModule hardening: Session error checks, JS null guards
- [x] handleVoiceInput crash: Added try/catch
- [x] Talk tab fallback greeting: Conversation opens with fallback when edge function fails
