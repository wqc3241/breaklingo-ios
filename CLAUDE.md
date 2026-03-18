# CLAUDE.md — BreakLingo iOS

## Project Overview

BreakLingo iOS is a native React Native rebuild of the BreakLingo language learning app. It helps users learn from real YouTube videos by extracting transcripts, analyzing vocabulary/grammar with AI, and generating practice exercises. This app connects to the same Supabase backend as the original web app.

## Tech Stack

- **Framework:** React Native 0.84 (bare workflow) + TypeScript
- **Navigation:** React Navigation 7 (bottom tabs + native stack)
- **Backend:** Supabase (auth, PostgreSQL, edge functions)
- **Auth:** Supabase Auth (email/password + Google OAuth via InAppBrowser)
- **Storage:** AsyncStorage for Supabase session persistence
- **Audio:** Native ObjC modules (`AudioPlayerModule`, `AudioRecorderModule`, `StoreReviewModule`) via local CocoaPod at `ios/AudioModules/`
- **Icons:** lucide-react-native (SVG icons via react-native-svg)
- **Styling:** React Native StyleSheet (orange theme matching web app, no Tailwind)
- **Package Manager:** npm
- **Min iOS:** 15.1 (React Native default)

## Commands

```bash
npm start              # Start Metro dev server
npm run ios            # Build & run on iOS simulator
npx react-native run-ios --device "iPhone Name"  # Run on physical device
npm run lint           # Run ESLint
npm test               # Run Jest tests
```

### First-time setup

```bash
npm install
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
```

### Building

The first build takes several minutes (compiling React Native framework). Subsequent builds are much faster. You can also open `ios/BreakLingoIOS.xcworkspace` in Xcode and build with Cmd+R.

### Deploying Edge Functions

```bash
SUPABASE_ACCESS_TOKEN=$(cat .env | grep SUPABASE_ACCESS_TOKEN | cut -d= -f2) npx supabase functions deploy <function-name> --project-ref evmamwdmwogmlezndueg
```

## Project Structure

```
src/
├── screens/               # Full-screen views
│   ├── AuthScreen.tsx         # Login / signup / forgot password
│   ├── InputScreen.tsx        # YouTube URL/search input + processing + recommendations
│   ├── StudyScreen.tsx        # Vocabulary, grammar, script tabs (read-only)
│   ├── PracticeScreen.tsx     # Practice sentences with TTS audio
│   ├── ProjectsScreen.tsx     # Saved projects list + search (paginated)
│   ├── QuizScreen.tsx         # Quiz dispatcher with animated completion
│   ├── LearnScreen.tsx        # Learning path with paginated unit list
│   ├── TalkScreen.tsx         # Thin orchestrator for talk views
│   └── talk/                  # Talk screen split into views
│       ├── TalkProjectSelect.tsx  # Project selection (paginated) + recent session
│       ├── TalkConversation.tsx   # Voice-first conversation (auto-listen + silence detection)
│       ├── TalkHistory.tsx        # Past conversation sessions (expandable)
│       └── TalkSummary.tsx        # Conversation complete with score + feedback
├── components/            # Reusable UI components
│   ├── quiz/                  # Quiz question type components
│   │   ├── QuizQuestionShell.tsx  # Shared wrapper: type banner + tappable TTS script
│   │   ├── MultipleChoiceQ.tsx
│   │   ├── TranslationQ.tsx
│   │   ├── FillBlankQ.tsx
│   │   ├── ListeningQ.tsx
│   │   ├── MultipleSelectQ.tsx
│   │   ├── WordArrangeQ.tsx
│   │   ├── MatchPairsQ.tsx
│   │   └── ReadAfterMeQ.tsx
│   ├── YouTubePlayer.tsx      # Embedded YouTube player (16:9 responsive)
│   └── common/
│       ├── EmptyState.tsx         # Reusable empty state (icon + title + subtitle)
│       ├── LoadingState.tsx       # Reusable loading spinner
│       ├── ErrorBoundary.tsx      # Crash protection wrapper
│       ├── OnboardingGuide.tsx    # First-launch walkthrough overlay
│       ├── FeedbackDialog.tsx     # In-app feedback form (centered modal)
│       ├── SearchBar.tsx          # Shared search bar component (white card style)
│       ├── NetworkErrorBanner.tsx # Reusable network error banner with retry
│       └── AppRatingPrompt.tsx    # App rating prompt (uses SKStoreReviewController)
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts             # Auth state, sign in/up, Google OAuth, logout
│   ├── useVideoProcessing.ts  # YouTube transcript pipeline (5 edge functions)
│   ├── useQuizData.ts         # Quiz question generation from vocab (fallback)
│   ├── useTextToSpeech.ts     # TTS via generate-speech edge function + native AudioPlayerModule
│   ├── useConversation.ts     # AI conversation with auto-listen after TTS + silence detection
│   ├── useLearningUnits.ts    # Paginated unit list + on-demand question fetch
│   ├── useProjectList.ts      # Paginated project list with server-side search
│   ├── useSearchHistory.ts    # YouTube search history persistence
│   ├── useWhisperSTT.ts       # Speech-to-text via Whisper API + native silence detection
│   ├── useYouTubeSearch.ts    # YouTube video search
│   ├── useRecommendedVideos.ts # Personalized video recommendations (persisted per user)
│   ├── useStopAudioOnBlur.ts  # Stop TTS/recording on screen navigation
│   ├── useStreak.ts           # Daily streak tracking (delegates to StatsContext)
│   ├── useExperience.ts       # XP/level system (delegates to StatsContext)
│   └── useAppRating.ts        # App rating prompt timing and persistence
├── lib/                   # Core utilities
│   ├── supabase.ts            # Supabase client (AsyncStorage adapter)
│   ├── types.ts               # TypeScript interfaces + quiz sanitization + mapDbUnitToLearningUnit
│   ├── constants.ts           # URLs, test account, languages, app scheme
│   ├── theme.ts               # Centralized color theme + getDifficultyColor()
│   ├── dateUtils.ts           # Shared date formatting (formatRelativeDate)
│   ├── conversationStorage.ts # Local conversation persistence
│   ├── conversationUtils.ts   # Message format conversion (assistant→ai, content→text)
│   ├── languageUtils.ts       # Language name/code utilities
│   └── recommendedVideos.ts   # Curated video recommendations
├── context/
│   ├── ProjectContext.tsx     # Global project state provider
│   └── StatsContext.tsx       # Shared streak + XP state (single source of truth)
├── navigation/            # React Navigation setup
│   ├── AppNavigator.tsx       # Root: auth check → AuthStack or MainTabs (wraps StatsProvider)
│   ├── AuthStack.tsx          # Auth screen stack
│   └── MainTabs.tsx           # Bottom tabs: Search, Learn, Talk, More + ProfileMenu + AppRating
└── App.tsx                # Entry point (in project root)
```

## Native Modules (ios/AudioModules/)

| Module | Purpose |
|--------|---------|
| `AudioPlayerModule.m` | TTS playback via AVAudioPlayer (base64 audio). Deactivates session on finish. |
| `AudioRecorderModule.m` | Audio recording with silence detection. Emits `onSpeechStarted` and `onSilenceDetected` events. |
| `StoreReviewModule.m` | Triggers Apple's native `SKStoreReviewController` for in-app ratings. |

## Supabase Backend

- **Project ID:** evmamwdmwogmlezndueg
- **URL:** https://evmamwdmwogmlezndueg.supabase.co
- **Auth:** Email/password + Google OAuth
- **Database:** `projects` table (PostgreSQL with RLS, JSONB columns for vocabulary/grammar/sentences)

### Edge Functions Used

| Function | Purpose |
|----------|---------|
| `get-available-languages` | Get available caption languages for a YouTube video |
| `extract-transcript` | Extract transcript (may return `pending` + `jobId` for async) |
| `poll-transcript-job` | Poll async transcript generation status |
| `analyze-content` | AI analysis → vocabulary, grammar, detectedLanguage. Chunked for long transcripts (>10k chars). |
| `generate-practice-sentences` | Generate practice sentences from vocab + grammar |
| `generate-speech` | TTS audio generation (returns audio blob) |
| `conversation-chat` | AI conversation — expects `{ messages: [{role:'user'|'ai', text}], projectContext }` |
| `conversation-summary` | Conversation summary — returns `{ summary: { overallScore, overallComment, feedback, ... } }` |
| `transcribe-audio` | Speech-to-text via Whisper — expects FormData with field name `file` |

### Edge Function API Conventions

- **Message format:** Edge functions expect `{ role: 'user' | 'ai', text: '...' }` — NOT `{ role: 'assistant', content: '...' }`. Use `convertMessagesToEdgeFormat()` from `lib/conversationUtils.ts`.
- **Transcription upload:** FormData field must be named `file`, not `audio`.
- **analyze-content chunking:** Transcripts >10k chars are split into ~6k char chunks at sentence boundaries, analyzed sequentially, then deduplicated. Output is sanitized to remove AI hallucinations (items with word > 30 chars or meta-language patterns).

### Video Processing Pipeline

1. User pastes YouTube URL → extract video ID
2. `extract-transcript` → may return immediately or start async job
3. If async: `poll-transcript-job` every 60s until complete
4. `analyze-content` → vocabulary + grammar + detected language (chunked for long scripts)
5. `generate-practice-sentences` → practice content (15 sentences if vocab >= 20, else 10)
6. Auto-save project to Supabase

## Navigation Structure

```
AppNavigator (StatsProvider wraps everything)
├── AuthStack (when not authenticated)
│   └── AuthScreen
└── MainTabs (when authenticated)
    ├── SearchTab → InputStack
    │   └── InputScreen
    ├── LearnTab → LearnStack
    │   ├── LearnScreen
    │   └── QuizScreen (modal)
    ├── TalkTab → TalkScreen (voice-first: project select → auto-listen conversation → summary)
    └── MoreTab → MoreStack (popover menu to select)
        ├── StudyScreen (read-only, no language picker or regen)
        ├── PracticeScreen
        └── ProjectsScreen (paginated)
```

## Talk Tab Conversation Flow

```
Project Select → startConversation() → AI greeting via TTS
  → autoListenAfterSpeak (600ms delay) → mic opens
  → user speaks → silence detected (1.5s) → auto-stop
  → transcribe-audio → processUserInput → conversation-chat
  → AI reply via TTS → autoListenAfterSpeak → loop
  → user taps End → stopConversation → conversation-summary
  → TalkSummary shows score + feedback → Done → back to select
```

Audio stops immediately on: tab switch (useStopAudioOnBlur), back button (resetConversation), end button (stopConversation).

## Code Conventions

- **Imports:** Relative paths from `src/` (e.g., `../lib/supabase`, `../hooks/useAuth`)
- **Components:** Functional components with hooks
- **Styling:** `StyleSheet.create()` with theme colors from `src/lib/theme.ts`
- **Icons:** Lucide SVG icons from `lucide-react-native` (no emoji icons)
- **Alerts:** `Alert.alert()` for user notifications
- **TypeScript:** Lenient — uses `any` casts for Supabase JSONB fields
- **State:** useState for local, hooks for data fetching, StatsContext for streak/XP, ProjectContext for current project
- **Pagination:** Use Supabase `.range()` for server-side pagination (10 items per page)
- **Accessibility:** All icon-only buttons must have `accessibilityLabel`
- **Speaker buttons:** 44px minimum touch target, show ActivityIndicator while playing

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Theme / Colors

Colors are defined in `src/lib/theme.ts`. Key colors:

| Semantic | Hex | Usage |
|----------|-----|-------|
| `primary` | `#E8550C` | Buttons, active tabs, links (orange) |
| `primaryForeground` | `#FFF5EA` | Text on primary bg |
| `background` | `#F5F5F5` | Main screen backgrounds |
| `card` | `#FAFAFA` | Card surfaces |
| `foreground` | `#171717` | Primary text / headings |
| `border` | `#D4D4D4` | Borders and dividers |
| `muted` | `#A1A1A1` | Secondary / muted text |
| `secondary` | `#525252` | Body text |
| `star` | `#EAB308` | Star / favorite yellow |
| `recording` | `#DC2626` | Recording / mic red |

## Key Configuration

- **Bundle ID:** `com.qichaowang.breaklingo`
- **URL Scheme:** `com.breaklingo.app` (for OAuth deep linking, configured in Info.plist)
- **DEV_TEST_MODE:** `__DEV__` in `src/lib/constants.ts` — auto-login with test account in debug builds (simulator), real auth in release builds (device)

## Testing

- **364 Jest tests** across **39 test suites** — run with `npm test`
- Test mocks for native modules, navigation, and Supabase in `jest.setup.js`
- Tests include: unit tests for hooks, component rendering tests, E2E flow tests (auth, learning, content generation)
- When writing new functions, write a corresponding test
- When fixing a bug, write a regression test

## Dev Notes

- Metro dev server runs on port 8081
- The `android/` directory exists but is untouched — this is iOS-focused
- Simulator testing: debug build auto-logs in; release build on device uses real auth
- Physical device: `Qichao Wang 17 PM` — use `--mode Release` to avoid Metro issues
- **Build sandbox fix:** Pass `ENABLE_USER_SCRIPT_SANDBOXING=NO` to xcodebuild
- After adding native dependencies, must do a full native rebuild, not just Metro JS reload
- Available simulators: iPhone 16e, iPhone 17, 17 Pro, 17 Pro Max, iPhone Air (iOS 26.2)

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — Engineering plan review
- `/plan-design-review` — Design plan review
- `/design-consultation` — Design consultation
- `/review` — Code review
- `/ship` — Ship code
- `/browse` — Web browsing
- `/qa` — QA testing
- `/qa-only` — QA testing only
- `/design-review` — Visual QA design review
- `/setup-browser-cookies` — Set up browser cookies
- `/retro` — Retrospective
- `/document-release` — Document a release

## Prompt Queue Rule

When new requests arrive in the Prompt Queue while a task is in progress:
1. Add the pending prompt to `todo.md` (in the project root) so it is not forgotten
2. Continue working on the current task to completion
3. After completing the current task, check `todo.md` for the next prompt (in order)
4. Mark completed items as done in `todo.md`
