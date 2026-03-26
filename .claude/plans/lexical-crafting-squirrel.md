# Plan: Fix Learn Tab + Move Feedback/SignOut to Profile Menu

## Context

Two issues to fix:

1. **Learn tab always shows "No lessons yet"** because `useLearningUnits.ts` queries a non-existent `learning_units` DB table and calls a non-existent `generate-learning-units` edge function. The web app uses hardcoded in-memory units and generates quiz questions on-the-fly from project data — no DB table needed.

2. **"Send Feedback" and "Sign Out" buttons** are stuck in the ProjectsScreen footer. The web app puts these in a profile icon dropdown in the navigation header. These should be moved to a profile avatar menu accessible from the tab bar header.

---

## Part 1: Fix Learn Tab

### Root Cause
- `useLearningUnits.ts` queries `learning_units` Supabase table (doesn't exist)
- Calls `generate-learning-units` edge function (doesn't exist)
- Silently fails after 120s polling timeout → empty units → "No lessons yet"

### Web App Behavior (target)
- 3 hardcoded units: "Mixed Review" (unlocked if user has projects), "Translation Challenge" (locked), "Speed Round" (locked)
- Quiz questions generated dynamically from completed projects' vocabulary/sentences by `useQuizData`
- No persistent unit storage

### Changes

#### 1. Rewrite `src/hooks/useLearningUnits.ts`
- Remove all Supabase queries, polling, edge function calls
- Import `useQuizData` internally to check `hasProjects` and `isLoading`
- Return 3 hardcoded in-memory `LearningUnit` objects when `hasProjects` is true, empty array otherwise
- Keep the same return shape `{ units, isLoading, isGenerating, fetchUnits, updateUnitProgress, cleanup }` for compatibility
- `isGenerating` always false; `fetchUnits`, `updateUnitProgress`, `cleanup` are no-ops

#### 2. Update `src/screens/LearnScreen.tsx`
- Change navigation: `navigate('Quiz', { unitId: unit.id })` → `navigate('Quiz')` (no unitId)
- Update empty state text to match web app
- Remove unreachable `isGenerating` block (optional cleanup)

#### 3. Simplify `src/screens/QuizScreen.tsx`
- Remove `useLearningUnits` import and usage
- Remove `unitId` route param handling
- Remove `useAuth` import (no longer needed)
- Always use `useQuizData` fallback path for question generation
- Remove `handleComplete` / `updateUnitProgress` call (no persistent progress)
- `restartQuiz` always calls `regenerate()`

#### 4. Clean up `src/lib/types.ts`
- Remove `mapDbUnitToLearningUnit` helper (dead code)
- Keep `LearningUnit` interface unchanged

#### 5. Update `src/navigation/MainTabs.tsx`
- Change `Quiz: { unitId?: string }` → `Quiz: undefined` in `LearnStackParamList`

#### 6. Update tests
- `__tests__/hooks/useLearningUnits.test.ts` — Rewrite: mock `useQuizData`, test hardcoded units
- `__tests__/screens/LearnScreen.test.tsx` — Remove "shows generating state" test
- `__tests__/screens/QuizScreen.test.tsx` — Remove `useLearningUnits` and `useAuth` mocks
- `__tests__/lib/types.test.ts` — Remove `mapDbUnitToLearningUnit` tests

---

## Part 2: Move Feedback/SignOut to Profile Menu

### Web App Behavior
- Header component has a profile avatar (user email first letter) with ChevronDown
- Clicking shows dropdown: "Account" label + email, separator, "Log out" with LogOut icon
- Visible on all pages

### Changes

#### 1. Create `src/components/common/ProfileMenu.tsx`
- Profile avatar button (circle with user email first letter, orange tint background)
- Tapping shows a popover/modal with:
  - User email display
  - "Send Feedback" option (with MessageSquare icon)
  - "Sign Out" option (with LogOut icon, red text)
- Uses `useAuth` for user email and `handleLogout`
- Includes `FeedbackDialog` integration

#### 2. Update `src/navigation/MainTabs.tsx`
- Add `ProfileMenu` as `headerRight` in the tab navigator's `screenOptions`
- This makes the profile icon appear in the header across all tabs

#### 3. Update `src/screens/ProjectsScreen.tsx`
- Remove the footer section containing "Send Feedback" and "Sign Out" buttons
- Remove `FeedbackDialog` component and related state
- Remove `useAuth` import (no longer needed here)
- Remove unused footer styles

---

## Verification

1. `npm test` — all tests pass
2. On device/simulator:
   - Learn tab shows "Mixed Review" unit (unlocked) + 2 locked units when user has completed projects
   - Learn tab shows empty state when no projects
   - Tapping "Mixed Review" opens quiz with dynamically generated questions
   - Profile icon visible in header across all tabs
   - Profile menu shows email, Send Feedback, Sign Out
   - Send Feedback opens feedback dialog
   - Sign Out logs the user out
   - ProjectsScreen no longer has footer buttons
