# CLAUDE.md — BreakLingo iOS

## Project Overview

BreakLingo iOS is a native React Native rebuild of the BreakLingo language learning app. It helps users learn from real YouTube videos by extracting transcripts, analyzing vocabulary/grammar with AI, and generating practice exercises. This app connects to the same Supabase backend as the original web app.

## Tech Stack

- **Framework:** React Native 0.84 (bare workflow) + TypeScript
- **Navigation:** React Navigation 7 (bottom tabs + native stack)
- **Backend:** Supabase (auth, PostgreSQL, edge functions)
- **Auth:** Supabase Auth (email/password + Google OAuth via InAppBrowser)
- **Storage:** AsyncStorage for Supabase session persistence
- **Audio:** expo-av for TTS playback
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

The first build takes several minutes (compiling React Native framework). Subsequent builds are much faster. You can also open `ios/BreakLingoIOS.xcodeproj` in Xcode and build with Cmd+R.

## Project Structure

```
src/
├── screens/               # Full-screen views
│   ├── AuthScreen.tsx         # Login / signup / forgot password
│   ├── InputScreen.tsx        # YouTube URL/search input + processing
│   ├── StudyScreen.tsx        # Vocabulary, grammar, script tabs
│   ├── PracticeScreen.tsx     # Practice sentences with TTS audio
│   ├── ProjectsScreen.tsx     # Saved projects list + search
│   ├── QuizScreen.tsx         # Multiple-choice quiz from vocabulary
│   ├── LearnScreen.tsx        # Learning path with unit progression
│   └── TalkScreen.tsx         # AI conversation practice with STT
├── components/            # Reusable UI components
│   ├── quiz/                  # Quiz question type components
│   │   ├── MultipleChoiceQ.tsx
│   │   ├── TranslationQ.tsx
│   │   ├── FillBlankQ.tsx
│   │   ├── ListeningQ.tsx
│   │   ├── MultipleSelectQ.tsx
│   │   ├── WordArrangeQ.tsx
│   │   ├── MatchPairsQ.tsx
│   │   └── ReadAfterMeQ.tsx
│   └── common/
│       ├── OnboardingGuide.tsx    # First-launch walkthrough overlay
│       └── FeedbackDialog.tsx     # In-app feedback form
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts             # Auth state, sign in/up, Google OAuth, logout
│   ├── useVideoProcessing.ts  # YouTube transcript pipeline (5 edge functions)
│   ├── useProject.ts          # Project CRUD, auto-save, fetch, delete
│   ├── useQuizData.ts         # Quiz question generation from vocab
│   ├── useTextToSpeech.ts     # TTS via generate-speech edge function + expo-av
│   ├── useConversation.ts     # AI conversation management for Talk screen
│   ├── useLearningUnits.ts    # Learning unit fetching/generation
│   ├── useSearchHistory.ts    # YouTube search history persistence
│   ├── useWhisperSTT.ts       # Speech-to-text via Whisper API
│   └── useYouTubeSearch.ts    # YouTube video search
├── lib/                   # Core utilities
│   ├── supabase.ts            # Supabase client (AsyncStorage adapter)
│   ├── types.ts               # TypeScript interfaces (AppProject, VocabularyItem, etc.)
│   ├── constants.ts           # URLs, test account, languages, app scheme
│   ├── theme.ts               # Centralized color theme (matches web app)
│   ├── conversationStorage.ts # Local conversation persistence
│   ├── languageUtils.ts       # Language name/code utilities
│   └── recommendedVideos.ts   # Curated video recommendations
├── context/
│   └── ProjectContext.tsx     # Global project state provider
├── navigation/            # React Navigation setup
│   ├── AppNavigator.tsx       # Root: auth check → AuthStack or MainTabs
│   ├── AuthStack.tsx          # Auth screen stack
│   └── MainTabs.tsx           # Bottom tabs: Search, Learn, Talk, More
└── App.tsx                # Entry point (in project root)
```

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
| `analyze-content` | AI analysis → vocabulary, grammar, detectedLanguage |
| `generate-practice-sentences` | Generate practice sentences from vocab + grammar |
| `generate-speech` | TTS audio generation (returns audio blob) |

### Video Processing Pipeline

1. User pastes YouTube URL → extract video ID
2. User selects target language
3. `extract-transcript` → may return immediately or start async job
4. If async: `poll-transcript-job` every 60s until complete
5. `analyze-content` → vocabulary + grammar + detected language
6. `generate-practice-sentences` → practice content
7. Auto-save project to Supabase

## Navigation Structure

```
AppNavigator
├── AuthStack (when not authenticated)
│   └── AuthScreen
└── MainTabs (when authenticated)
    ├── SearchTab → InputStack
    │   └── InputScreen
    ├── LearnTab → LearnStack
    │   ├── LearnScreen
    │   └── QuizScreen (modal)
    ├── TalkTab → TalkScreen
    └── MoreTab → MoreStack (popover menu to select)
        ├── StudyScreen
        ├── PracticeScreen
        └── ProjectsScreen
```

The "More" tab shows a floating popover menu instead of navigating directly. Tapping a menu item (Study, Practice, Projects) navigates into the MoreStack. Navigation to Study from other screens uses `navigation.navigate('MoreTab', { screen: 'Study' })`.

## Code Conventions

- **Imports:** Relative paths from `src/` (e.g., `../lib/supabase`, `../hooks/useAuth`)
- **Components:** Functional components with hooks
- **Styling:** `StyleSheet.create()` with theme colors from `src/lib/theme.ts`
- **Icons:** Lucide SVG icons from `lucide-react-native` (no emoji icons)
- **Alerts:** `Alert.alert()` for user notifications (replacing web toast system)
- **TypeScript:** Lenient — uses `any` casts for Supabase JSONB fields
- **State:** useState for local state, hooks for data fetching; ProjectContext for global project state

## Theme / Colors

Colors are defined in `src/lib/theme.ts` and match the web app (speak-smart-clips). Key colors:

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
| `destructive` | `#DB2323` | Destructive actions |
| `primaryTinted` | `#FFF5EA` | Light primary background tint |
| `star` | `#EAB308` | Star / favorite yellow |
| `recording` | `#DC2626` | Recording / mic red |

Status colors (correct/wrong, difficulty levels) are also in theme.ts.

## Key Configuration

- **Bundle ID:** `org.reactjs.native.example.BreakLingoIOS` (default, change for production)
- **URL Scheme:** `com.breaklingo.app` (for OAuth deep linking, configured in Info.plist)
- **DEV_TEST_MODE:** `true` in `src/lib/constants.ts` — auto-logs in with test account. Set to `false` for manual auth testing.

## Dev Notes

- Metro dev server runs on port 8081
- 213+ Jest tests across 30 test suites — run with `npm test`
- Test mocks for `lucide-react-native` and `react-native-svg` are in `jest.setup.js`
- The `android/` directory exists but is untouched — this is iOS-focused
- TTS audio uses `expo-av` which requires the expo modules CocoaPod — this is handled automatically
- Google OAuth uses `react-native-inappbrowser-reborn` for ASWebAuthenticationSession on iOS
- **Build sandbox fix:** If Xcode build fails with `Sandbox: rsync deny` errors, pass `ENABLE_USER_SCRIPT_SANDBOXING=NO` to xcodebuild, or clean DerivedData
- After adding native dependencies (e.g., `react-native-svg`), must do a full native rebuild (`npx react-native run-ios`), not just a Metro JS reload
