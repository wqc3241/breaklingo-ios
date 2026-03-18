# TODOS — BreakLingo iOS

## Completed (Session 2026-03-18)

- [x] **TODO-1: Create DESIGN.md** — Formal design system with type scale, spacing, colors, motion
- [x] **TODO-3: Speaker button feedback** — Loading spinner + 44px touch targets on Study/Practice
- [x] **TODO-4: Shared NetworkErrorBanner** — Component created (integration deferred to per-screen)
- [x] **TODO-5: Wire streak + XP into StatsHeader** — Already implemented, verified with StatsContext
- [x] **TODO-6: Quiz completion animation** — Trophy bounce, stars fade, score fade-in (staggered)
- [x] **TODO-7: VoiceOver labels** — accessibilityLabel on all icon-only buttons across all screens
- [x] **TODO-8: Standardize search bars** — Shared SearchBar component on Projects + Talk
- [x] **Voice input fix** — FormData field `file` not `audio`, message role `ai` not `assistant`, field `text` not `content`
- [x] **Silence detection** — Native AVAudioRecorder metering, auto-stop after 1.5s silence
- [x] **Conversation summary** — Fixed payload format + response parsing for conversation-summary edge function
- [x] **Audio stop on navigation** — useStopAudioOnBlur hook + TTS stop in resetConversation/stopConversation
- [x] **StatsContext** — Shared streak/XP state across all tabs (replaces independent hook instances)
- [x] **Study screen simplified** — Removed language picker + regeneration button
- [x] **Chunked analysis** — Transcripts >10k chars split into chunks, analyzed separately, deduplicated
- [x] **Lazy loading** — Paginated project lists on Projects + Talk screens (useProjectList hook)
- [x] **Persistent recommendations** — Per-user recommended videos cached in AsyncStorage
- [x] **Feedback dialog redesign** — Centered modal popup with categories
- [x] **Talk header seamless** — Removed white background, no safe area double-padding
- [x] **History expand** — Session cards show full summary details (overallScore, feedback, vocab, grammar)
- [x] **History crash fix** — typeof guards prevent rendering objects in Text components
- [x] **Recent sessions limit** — Only show 1 most recent on Talk project select
- [x] **App rating** — SKStoreReviewController for positive, in-app FeedbackDialog for negative
- [x] **Thumbnail fallback** — Generate YouTube URLs from videoId, gray placeholder on load error
- [x] **Prompt improvement** — Comprehensive extraction prompt + output sanitization for AI hallucinations

## Open

- [ ] **TODO-2: Cross-navigation CTAs** — Add 'Review mistakes' on quiz completion, 'Quiz this lesson' on StudyScreen, 'Continue studying' on project cards. Requires tracking incorrect answers + cross-screen navigation params.
- [ ] **NetworkErrorBanner integration** — Component exists but not yet wired into LearnScreen, ProjectsScreen, PracticeScreen, TalkProjectSelect. Requires adding error state to hooks.
- [ ] **Dynamic Type support** — All font sizes hardcoded. iOS Dynamic Type (user-chosen text size) not supported.
- [ ] **Dark mode** — Specified in DESIGN.md but not implemented.
- [ ] **Haptic feedback** — Requires `react-native-haptic-feedback` native dependency.
- [ ] **App Store ID** — Replace placeholder in StoreReviewModule once app is published.
