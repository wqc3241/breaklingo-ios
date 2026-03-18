# BreakLingo iOS

A native iOS language learning app built with React Native. Learn from real YouTube videos through AI-powered vocabulary analysis, grammar extraction, interactive quizzes, and voice conversation practice.

## Features

- **YouTube Video Learning** — Paste any YouTube URL to extract transcripts and generate vocabulary/grammar lessons
- **AI Content Analysis** — Chunked transcript processing extracts comprehensive vocabulary (with readings and part of speech) and grammar patterns from full-length videos
- **Interactive Quizzes** — 8 question types (multiple choice, translation, fill-in-blank, listening, word arrange, match pairs, pronunciation, multi-select) with animated completion
- **Voice Conversation** — Practice speaking with AI in the target language. Auto-listens with native silence detection, auto-stops when you finish speaking
- **Learning Path** — Paginated unit progression with sequential unlock, star ratings, and streak/XP tracking
- **Personalized Recommendations** — Video suggestions based on your study history, persisted per user account
- **Streak & XP System** — Daily streak tracking, XP leveling system, visible in header across all tabs

## Tech Stack

- **React Native 0.84** (bare workflow, TypeScript)
- **React Navigation 7** (bottom tabs + native stack)
- **Supabase** (auth, PostgreSQL, edge functions)
- **Native ObjC Modules** — AudioPlayerModule (TTS), AudioRecorderModule (STT with silence detection), StoreReviewModule (App Store ratings)
- **Gemini AI** — Content analysis via Lovable AI Gateway

## Getting Started

### Prerequisites

- Node.js 18+
- Xcode 16+
- CocoaPods
- iOS 15.1+ device or simulator

### Setup

```bash
git clone https://github.com/your-repo/breaklingo-ios.git
cd breaklingo-ios
npm install
cd ios && pod install && cd ..
npx react-native run-ios
```

### Running on Device

```bash
# Debug (auto-login with test account)
npx react-native run-ios --simulator "iPhone 17 Pro Max"

# Release (real auth, for physical device)
npx react-native run-ios --device "Your iPhone" --mode Release
```

### Testing

```bash
npm test          # 364 tests across 39 suites
npm run lint      # ESLint
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  React Native App                                │
│  ├── 4 Tabs: Search, Learn, Talk, More          │
│  ├── Contexts: ProjectContext, StatsContext       │
│  ├── 15 Custom Hooks                             │
│  └── 3 Native ObjC Modules                       │
├─────────────────────────────────────────────────┤
│  Supabase Backend                                │
│  ├── Auth (email/password + Google OAuth)        │
│  ├── PostgreSQL (projects table with RLS)        │
│  └── 8 Edge Functions (AI analysis, TTS, STT)   │
├─────────────────────────────────────────────────┤
│  AI Services                                     │
│  ├── Gemini Flash — content analysis + conversation│
│  ├── Whisper — speech-to-text transcription       │
│  └── TTS — AI voice generation                    │
└─────────────────────────────────────────────────┘
```

## App Structure

| Tab | Screen | Description |
|-----|--------|-------------|
| Search | InputScreen | YouTube URL/search, video processing, personalized recommendations |
| Learn | LearnScreen → QuizScreen | Paginated learning path, 8 quiz types with animated completion |
| Talk | TalkScreen | Voice-first AI conversation with silence detection |
| More | StudyScreen, PracticeScreen, ProjectsScreen | Vocabulary/grammar study, practice sentences, project management |

## Key Features Deep Dive

### Voice Conversation (Talk Tab)
- Native silence detection via AVAudioRecorder metering (polls every 150ms)
- Speech threshold: -30dB, silence threshold: -40dB, auto-stop after 1.5s silence
- Whisper STT for transcription, Gemini for conversation
- Auto-listen after AI speaks (600ms delay to avoid echo)
- Conversation summary with score, feedback, vocabulary/grammar analysis

### Content Analysis Pipeline
- Transcripts >10k chars are chunked at sentence boundaries (~6k per chunk)
- Each chunk analyzed by Gemini separately, results deduplicated and merged
- Output sanitized to filter AI hallucinations (word >30 chars, meta-language)
- Vocabulary includes readings (hiragana/pinyin) and part of speech

### Streak & XP System
- Shared via StatsContext (single source of truth across all tabs)
- XP: Quiz score percentage + 50 per conversation
- Levels: N*(N+1)/2 * 100 total XP (Level 1=100, Level 2=300, Level 3=600)
- Streak: +1 per day of activity, resets on missed day

## Design System

See [DESIGN.md](./DESIGN.md) for the complete design system: typography, colors, spacing, motion, and component patterns.

## Environment Variables

Create a `.env` file (gitignored):

```
SUPABASE_ACCESS_TOKEN=your_token_here
```

## License

Private — All rights reserved.
