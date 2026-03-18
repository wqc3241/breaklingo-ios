# Design System — BreakLingo iOS

## Product Context
- **What this is:** Language learning app that uses real YouTube videos + AI to teach vocabulary, grammar, and conversation
- **Who it's for:** Language learners who want real-world content, not textbook drills
- **Space/industry:** Edtech / language learning (peers: Duolingo, LingQ, Busuu, Babbel)
- **Project type:** Native iOS app (React Native)

## Aesthetic Direction
- **Direction:** Playful/Confident — warm and energetic, not childish
- **Decoration level:** Intentional — orange-tinted accent surfaces, subtle card shadows, no gradients or heavy textures
- **Mood:** The confidence of a good language tutor who makes learning feel natural. Friendly but not juvenile, serious about learning but not dry.
- **Reference sites:** [Duolingo Brand](https://design.duolingo.com/), [Busuu](https://www.busuu.com), [LingQ](https://www.lingq.com)

## Typography
- **Display/Hero:** SF Pro Rounded, weight 700 — rounded variant adds warmth without custom font loading
- **Body:** SF Pro Text, weights 400/500/600 — native performance, perfect iOS rendering
- **UI/Labels:** Same as body (SF Pro Text)
- **Data/Tables:** SF Pro Text with `fontVariant: ['tabular-nums']`
- **Code:** SF Mono (system monospace)
- **Loading:** System fonts — zero load time, native integration
- **Scale:**

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `display` | 28px | 700 | App name, hero headings |
| `heading` | 24px | 700 | Screen titles (quiz complete, talk summary) |
| `title` | 20px | 700 | Section headers (Learning Path, Practice Sentences) |
| `subtitle` | 18px | 600 | Card titles, quiz questions |
| `body` | 16px | 400 | Body text, message bubbles, form inputs |
| `secondary` | 14px | 400 | Metadata, descriptions, helper text |
| `caption` | 13px | 500 | Badges, timestamps, muted labels |
| `overline` | 11px | 600 | Section labels (uppercase), tiny metadata |

## Color
- **Approach:** Balanced — primary orange + warm neutrals + semantic colors
- **Uniqueness:** Orange is distinctive in the language learning space (no major competitor uses it)

### Core Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E8550C` | Buttons, active tabs, links, brand accent |
| `primaryForeground` | `#FFF5EA` | Text on primary backgrounds |
| `primaryTinted` | `#FFF5EA` | Light orange surfaces, empty state icon circles |
| `background` | `#F5F5F5` | Screen backgrounds |
| `card` | `#FAFAFA` | Card surfaces |
| `surface` | `#FFFFFF` | White surfaces (inputs, menus, bubbles) |
| `foreground` | `#171717` | Primary text, headings |
| `secondary` | `#525252` | Body text, descriptions |
| `muted` | `#A1A1A1` | Helper text, placeholders, disabled |
| `border` | `#D4D4D4` | Borders, dividers, inactive states |

### Semantic Colors
| Token | Background | Text | Border | Usage |
|-------|-----------|------|--------|-------|
| `correct` | `#D1FAE5` | `#065F46` | `#34D399` | Quiz correct, completed units |
| `wrong` | `#FEE2E2` | `#991B1B` | `#F87171` | Quiz wrong, error states |
| `warning` | `#FEF3C7` | `#92400E` | `#F59E0B` | Processing, transcript preview |
| `info` | `#DBEAFE` | `#1E40AF` | `#60A5FA` | Tips, informational banners |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `star` | `#EAB308` | Stars, favorites, achievements |
| `recording` | `#DC2626` | Mic listening state |
| `google` | `#4285F4` | Google OAuth button |
| `partOfSpeech` | `#7C3AED` on `#EDE9FE` | Grammar part-of-speech badges |

### Difficulty Colors
| Level | Background | Text |
|-------|-----------|------|
| Beginner / Easy | `#D1FAE5` | `#065F46` |
| Intermediate / Medium | `#FEF3C7` | `#92400E` |
| Advanced / Hard | `#FEE2E2` | `#991B1B` |
| Default | `#F3F4F6` | `#374151` |

### Dark Mode Strategy
- Redesign surfaces: background `#0A0A0A`, card `#171717`, surface `#1C1C1C`
- Reduce primary saturation ~10% for comfortable viewing
- Invert neutral scale (lightest becomes darkest)
- Keep semantic colors but reduce saturation

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — enough breathing room for touch targets without wasting screen space
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| `2xs` | 2px | Hairline gaps, icon alignment |
| `xs` | 4px | Tight inline spacing, badge padding V |
| `sm` | 8px | Between related items, badge padding H, gaps in rows |
| `md` | 16px | Card padding, section padding, standard gap |
| `lg` | 24px | Between sections, screen horizontal padding |
| `xl` | 32px | Major section separation, empty state padding |
| `2xl` | 48px | Screen-level top/bottom padding |

- **Card padding:** Always `md` (16px)
- **Section gaps:** Always `lg` (24px)
- **Screen horizontal padding:** Always `md` (16px)

## Layout
- **Approach:** Grid-disciplined — consistent card grids, clear hierarchy, predictable alignment
- **Grid:** Single-column primary, 2-column for video thumbnails
- **Max content width:** Full screen width (mobile-first, no max-width needed)
- **Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Buttons, inputs, badges, quiz options |
| `md` | 12px | Cards, modals, tab segment controls |
| `lg` | 16px | Bottom sheets, onboarding card |
| `full` | 9999px | Pills, filter chips, avatars, speaker buttons |

### Shadow Scale
| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 3px rgba(0,0,0,0.06)` | Cards, vocab items |
| `md` | `0 4px 12px rgba(0,0,0,0.08)` | Menus, elevated cards |
| `lg` | `0 4px 12px rgba(232,85,12,0.3)` | Mic button (colored shadow) |

## Motion
- **Approach:** Intentional — subtle animations that aid comprehension and celebrate achievement
- **Framework:** React Native `Animated` API

### Timing
| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `micro` | 100ms | ease-out | Button press feedback |
| `short` | 200ms | ease-out | State transitions, tab switches |
| `medium` | 400ms | ease-in-out | Screen transitions |
| `long` | 600ms | ease-in-out | Celebration animations |

### Specific Animations
- **Quiz answer feedback:** 200ms color transition on selected option
- **Quiz completion:** Trophy scale bounce (1.0 → 1.2 → 1.0), stars appear sequentially
- **Mic pulse:** Loop 1.0 → 1.15 scale, 800ms per cycle, ease-in-out
- **Score count-up:** Animate from 0 to final score over 600ms

### Haptics
- **Light impact:** Button presses, option selection
- **Success notification:** Quiz completion, conversation end
- **Warning:** Heart lost in quiz

## Component Patterns

### Cards
- White surface on `background` gray
- `md` border-radius (12px)
- `md` padding (16px)
- `sm` shadow
- 1px `border` color border (optional, used for message bubbles)

### Empty States
- 80x80 icon circle with `primaryTinted` background
- Centered layout with `xl` padding
- `subtitle` size title + `secondary` size description
- Optional primary action button below

### Buttons
- **Primary:** `primary` background, white text, `sm` radius
- **Secondary:** `surface` background, `border` border, `foreground` text
- **Ghost:** Transparent, `primary` text
- **Destructive:** `wrong` background, `wrong` text
- **Pill:** `full` radius, used for filter chips and tags

### Badges
- `sm` radius (8px)
- `xs` padding V (4px), `sm` padding H (8px)
- `overline` font size (11-12px), weight 600
- Color determined by semantic meaning (difficulty, language, part-of-speech)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | Initial design system created | Formalized existing brand into documented system via /design-consultation. Researched Duolingo, Busuu, LingQ for category conventions. |
| 2026-03-18 | SF Pro system fonts (no custom fonts) | Native performance, zero load time, perfect iOS rendering. Rounded variant adds warmth. |
| 2026-03-18 | Orange #E8550C as primary | Unique in language learning space. Warm, energetic, distinctive in App Store. |
| 2026-03-18 | 4px spacing base, comfortable density | Matches existing usage. Touch-friendly for mobile. |
| 2026-03-18 | Intentional motion (not minimal, not expressive) | Celebrate achievements (quiz completion) but don't add noise to studying. |
