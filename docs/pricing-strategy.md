# BreakLingo Pricing Strategy

## Executive Summary

BreakLingo occupies a unique niche: AI-powered language learning from real YouTube content. The closest competitors by feature set are FluentU ($30/mo) and LingQ ($12.99/mo), not Duolingo ($6.99/mo). However, BreakLingo's AI costs per user are materially higher than traditional language apps due to GPT analysis, TTS, and STT on every session. The recommended strategy is a **metered freemium model** with three tiers: Free (limited), Plus ($9.99/mo), and Pro ($19.99/mo), designed to keep free-tier AI costs under $0.50/user/month while converting 5-8% of users to paid.

---

## 1. Competitive Pricing Landscape

| App | Free Tier | Paid Tier(s) | Annual Price | Key Model |
|-----|-----------|-------------|-------------|-----------|
| **Duolingo** | Yes (energy-gated) | Super $6.99/mo, Max $14/mo | $60-168/yr | Freemium + ads |
| **Busuu** | Yes (limited) | Premium $5.25-10.50/mo | $63/yr | Freemium |
| **LingQ** | Yes (limited) | Premium $12.99/mo | $108/yr | Freemium + content library |
| **FluentU** | 14-day trial only | $30/mo | $240/yr | Subscription (no free tier) |
| **Yabla** | 15-day trial only | $12.95/mo | $100/yr | Subscription |
| **Babbel** | Trial only | $7-14/mo | $84-168/yr | Subscription |

### Key Observations

1. **Video-based apps command premium pricing.** FluentU at $30/mo and Yabla at $12.95/mo are both significantly above Duolingo/Busuu, justified by curated video content and interactive transcripts.

2. **Freemium dominates language learning.** 67% of language learners prefer apps with free access and optional upgrades. Apps without a free tier (FluentU, Babbel) attract committed learners but have smaller top-of-funnel.

3. **Annual discounts are standard.** Typically 40-50% off monthly price when paid annually. This improves retention and cash flow.

4. **AI features are the new premium.** Duolingo Max charges $14/mo specifically for AI conversation (Video Call, Roleplay). BreakLingo's Talk feature is directly comparable.

### BreakLingo's Positioning

BreakLingo sits between LingQ/FluentU (authentic content) and Duolingo Max (AI conversation). Unlike FluentU, BreakLingo works with *any* YouTube video rather than a curated library, which is both a strength (infinite content) and a challenge (no content licensing costs, but no content moat either). The AI analysis + conversation features are the core differentiator.

**Competitive price range: $8-20/month for paid tier(s).**

---

## 2. Cost Structure Analysis

### Per-User AI Costs (Estimated)

BreakLingo makes the following API calls during typical usage. Costs are based on current OpenAI pricing.

#### Video Processing Pipeline (one-time per video)

| Operation | API Used | Estimated Cost |
|-----------|----------|---------------|
| `extract-transcript` | YouTube captions API (free) or GPT Whisper fallback | $0.00-0.05 |
| `analyze-content` | GPT-4o-mini (~2K input tokens, ~2K output) | ~$0.005 |
| `generate-practice-sentences` | GPT-4o-mini (~1K input, ~1.5K output) | ~$0.004 |
| **Total per video processed** | | **~$0.01-0.06** |

#### Study Session (per session)

| Operation | API Used | Estimated Cost |
|-----------|----------|---------------|
| TTS per vocabulary word tap (~15 words, ~50 chars each) | OpenAI TTS ($15/1M chars) | ~$0.01 |
| TTS for practice sentences (~10 sentences, ~100 chars each) | OpenAI TTS | ~$0.015 |
| **Total per study session** | | **~$0.025** |

#### AI Conversation Session (Talk tab - per session)

| Operation | API Used | Estimated Cost |
|-----------|----------|---------------|
| `conversation-chat` start (GPT-4o-mini, ~500 tok in, ~200 out) | GPT-4o-mini | ~$0.001 |
| `conversation-chat` per exchange x 8 avg exchanges (~1K in, ~300 out growing) | GPT-4o-mini | ~$0.01 |
| TTS per AI response x 9 (~150 chars each) | OpenAI TTS | ~$0.02 |
| STT per user utterance x 8 (~15 sec each = 2 min total) | Whisper ($0.006/min) | ~$0.012 |
| `conversation-summary` (GPT-4o-mini, ~2K in, ~500 out) | GPT-4o-mini | ~$0.003 |
| **Total per conversation session** | | **~$0.05** |

#### Quiz Session (per quiz)

| Operation | API Used | Estimated Cost |
|-----------|----------|---------------|
| Quiz generation (local, from cached vocab) | None (client-side) | $0.00 |
| ReadAfterMe TTS (~3 questions, ~80 chars each) | OpenAI TTS | ~$0.004 |
| ReadAfterMe STT (~3 recordings, ~10 sec each) | Whisper | ~$0.003 |
| **Total per quiz** | | **~$0.007** |

### Monthly Cost Per Active User (by usage pattern)

| User Profile | Videos/mo | Study Sessions | Conversations | Quizzes | Est. Monthly Cost |
|-------------|-----------|---------------|---------------|---------|------------------|
| **Casual** (free tier) | 2 | 4 | 1 | 2 | **$0.23** |
| **Regular** (paid) | 5 | 12 | 8 | 6 | **$0.95** |
| **Power** (paid) | 10 | 25 | 20 | 12 | **$2.05** |

### Fixed Infrastructure Costs

| Item | Estimated Monthly Cost |
|------|----------------------|
| Supabase Pro plan | $25/mo |
| Supabase edge function invocations (included in Pro) | $0 up to 500K |
| Apple Developer Program | $99/yr (~$8.25/mo) |
| Domain / misc | ~$5/mo |
| **Total fixed** | **~$38/mo** |

### Apple Tax

Apple takes 30% of in-app subscription revenue (15% for apps in the Small Business Program under $1M annual revenue). At BreakLingo's scale, assume **15% Apple commission** initially.

---

## 3. Pricing Model Analysis

### Option A: Pure Freemium (Duolingo model)

- Free tier with energy/hearts system
- Paid tier removes limits
- **Pros:** Maximum top-of-funnel, proven in language learning
- **Cons:** Free users generate real AI costs (unlike Duolingo where free content is pre-built)
- **Verdict:** Viable only with strict free-tier usage caps

### Option B: Free Trial + Subscription (FluentU model)

- 7-14 day free trial, then paywall
- **Pros:** No ongoing free-user costs, higher conversion from committed users
- **Cons:** Dramatically smaller user base, poor for word-of-mouth growth
- **Verdict:** Too aggressive for a new entrant without brand recognition

### Option C: Metered Freemium (Recommended)

- Free tier with hard usage limits (not energy/hearts, but actual feature limits)
- Paid tiers unlock volume and premium features
- **Pros:** Controls AI costs, gives users enough value to evaluate, clear upgrade triggers
- **Cons:** Requires careful limit tuning
- **Verdict:** Best fit for BreakLingo's cost structure and growth stage

---

## 4. Recommended Pricing Tiers

### Free Tier -- "Explorer"

**Goal:** Let users experience the core value loop (paste video, study vocab, try a quiz) without bleeding AI costs. Target: under $0.30/user/month.

| Feature | Limit |
|---------|-------|
| Video processing | 2 videos/month |
| Vocabulary & grammar study | Unlimited (on processed videos) |
| Practice sentences | Unlimited (on processed videos) |
| TTS (word/sentence tap-to-hear) | 20 plays/day |
| Quizzes | 2 quizzes/month |
| AI Conversation (Talk) | Not available |
| Saved projects | 3 max |
| YouTube player in Study | Yes |
| Ads | None (keep it clean) |

**Rationale:** The free tier showcases BreakLingo's unique video-to-study pipeline. Conversation is fully gated because it is the highest-cost and highest-value feature -- and it is the most compelling upgrade trigger. TTS is lightly gated to prevent abuse while still letting users hear pronunciations. No ads; the app is too niche for meaningful ad revenue and ads degrade the experience.

### Plus Tier -- $9.99/month ($59.99/year)

**Goal:** Core paid experience for regular learners. Covers AI costs with healthy margin.

| Feature | Limit |
|---------|-------|
| Video processing | 15 videos/month |
| All study features | Unlimited |
| TTS | Unlimited |
| Quizzes | Unlimited |
| AI Conversation (Talk) | 10 sessions/month |
| Saved projects | 25 |
| Priority processing | Yes |
| Export vocabulary lists | Yes |

**Unit economics at $9.99/mo:**
- Revenue after Apple 15% cut: $8.49
- Estimated cost per "Regular" user: $0.95
- **Gross margin: ~89%**

### Pro Tier -- $19.99/month ($119.99/year)

**Goal:** Power users and serious learners. Unlimited everything.

| Feature | Limit |
|---------|-------|
| Video processing | Unlimited |
| All study features | Unlimited |
| TTS | Unlimited |
| Quizzes | Unlimited |
| AI Conversation (Talk) | Unlimited |
| Saved projects | Unlimited |
| Priority processing | Yes |
| Export vocabulary lists | Yes |
| Conversation history & analytics | Full history |
| Multiple learning languages | Unlimited |

**Unit economics at $19.99/mo:**
- Revenue after Apple 15% cut: $16.99
- Estimated cost per "Power" user: $2.05
- **Gross margin: ~88%**

### Price Comparison vs. Competitors

| | BreakLingo Free | BreakLingo Plus | BreakLingo Pro | Duolingo Super | FluentU | LingQ |
|---|---|---|---|---|---|---|
| Monthly | $0 | $9.99 | $19.99 | $12.99 | $30.00 | $12.99 |
| Annual/mo | $0 | $4.99 | $9.99 | $5.00 | $20.00 | $8.99 |
| AI Conversation | No | 10/mo | Unlimited | Unlimited (Max only, $14/mo) | No | No |
| Real YouTube videos | Yes (2/mo) | Yes (15/mo) | Unlimited | No | Curated only | User-imported |

BreakLingo Plus at $9.99/mo undercuts FluentU significantly while offering AI conversation (which FluentU lacks entirely). It sits at parity with LingQ but with a fundamentally different (and arguably more engaging) feature set.

---

## 5. Free Tier Strategy: Detailed Design

### What Must Be Free (Adoption Drivers)

1. **Video processing (2/month)** -- Users need to experience the "wow moment" of pasting a YouTube URL and getting structured vocabulary/grammar. This is the hook.
2. **Full study experience on processed videos** -- Once a video is processed, let users freely browse vocab, grammar, and the script. This builds habit.
3. **Limited TTS** -- Pronunciation is essential for language learning. 20 plays/day is enough to study but not enough to replace a paid TTS service.
4. **2 quizzes/month** -- Enough to demonstrate the quiz quality.

### What Must Be Gated (Conversion Triggers)

1. **AI Conversation (Talk)** -- Highest cost, highest perceived value. This is the #1 upgrade trigger. Users see the Talk tab, understand what it does, but need Plus to use it.
2. **Video volume** -- 2/month forces users to be selective. When they want to process their 3rd video, they hit the upgrade prompt.
3. **Project storage** -- 3 projects means old ones must be deleted. This creates natural friction.
4. **Quiz volume** -- After 2 quizzes, users who want more testing must upgrade.

### Upgrade Prompt Strategy

- When a user hits a limit, show a contextual upgrade screen (not a generic paywall). For example: "You've used both free conversations this month. Upgrade to Plus for 10 AI conversation sessions per month."
- Show a persistent but non-intrusive "Plus" badge on gated features.
- After 7 days of active use, offer a 3-day free trial of Plus.

### Free Tier Cost Control

At the recommended limits, a free user generates approximately:
- 2 video processings: ~$0.10
- 4 study sessions with TTS: ~$0.10
- 2 quizzes: ~$0.014
- **Total: ~$0.21/month per active free user**

With education app 30-day retention of ~2%, most free users will churn before generating significant cost. The true cost is concentrated in the ~20% of free users who are active weekly, yielding an effective blended cost of ~$0.05/free user/month.

---

## 6. Revenue Projections (Year 1)

### Assumptions

- Launch with Plus and Pro tiers after 2-month beta
- 500 downloads/month growing 15% monthly (organic + basic App Store Optimization)
- 30-day retention: 5% (above education average due to niche/motivated audience)
- Free-to-paid conversion: 5% of retained users
- Plus:Pro ratio: 75:25

### Month-by-Month Projection

| Month | Cumulative Downloads | Active Free Users | Paid Users (Plus) | Paid Users (Pro) | MRR |
|-------|---------------------|-------------------|-------------------|------------------|-----|
| 1 | 500 | 25 | 0 | 0 | $0 |
| 3 | 1,658 | 83 | 3 | 1 | $50 |
| 6 | 4,384 | 219 | 8 | 3 | $140 |
| 9 | 9,843 | 492 | 18 | 6 | $300 |
| 12 | 20,304 | 1,015 | 38 | 13 | $640 |

### Year 1 Summary

| Metric | Value |
|--------|-------|
| Total downloads | ~20,000 |
| Active free users (month 12) | ~1,015 |
| Paying subscribers (month 12) | ~51 |
| Monthly recurring revenue (month 12) | ~$640 |
| Annual revenue (cumulative) | ~$3,500 |
| Annual AI costs (cumulative) | ~$800 |
| Annual fixed costs | ~$460 |
| **Net position (Year 1)** | **~$2,200** |

These are conservative projections. The app is not yet profitable enough to sustain full-time development, but it covers infrastructure costs and validates the model. The key lever is download volume -- viral/content marketing around "learn from any YouTube video" could significantly accelerate growth.

---

## 7. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **AI costs spike** (OpenAI price increases, or power users abuse free tier) | High | Low | Hard usage limits on free tier; monitor per-user costs; switch to cheaper models (GPT-4o-mini is already cost-optimized) |
| **Low conversion rate** (<3%) | Medium | Medium | A/B test free tier limits; improve upgrade prompts; offer time-limited trials |
| **Apple rejects in-app purchase implementation** | High | Low | Follow StoreKit 2 guidelines exactly; no external purchase links |
| **Competitor launches same feature** (e.g., FluentU adds AI conversation) | Medium | Medium | Move fast on features; build community; the "any YouTube video" angle is hard to replicate at scale |
| **YouTube API/ToS changes** | High | Low | Diversify content sources (podcasts, uploaded audio); cache processed content |
| **Price sensitivity in target market** | Medium | Medium | Annual pricing at $4.99/mo equivalent; student discounts; regional pricing |

---

## 8. Implementation Roadmap

### Phase 1: Soft Launch (Weeks 1-4)
- Ship the app with all features unlocked (no paywall) to gather usage data
- Instrument analytics: videos processed/user, TTS plays/user, conversation sessions/user, quiz completions
- Establish baseline usage patterns and actual per-user costs

### Phase 2: Introduce Limits (Weeks 5-8)
- Implement free tier limits (2 videos, no Talk, 20 TTS/day, 2 quizzes)
- Add upgrade prompts at limit boundaries
- Integrate StoreKit 2 for in-app subscriptions
- Launch Plus tier only at $9.99/mo ($59.99/yr)

### Phase 3: Full Pricing (Weeks 9-12)
- Launch Pro tier at $19.99/mo ($119.99/yr)
- Add 3-day free trial of Plus after 7 days of active use
- Implement referral program (give a friend 1 month free, get 1 month free)

### Phase 4: Optimize (Ongoing)
- A/B test price points ($7.99 vs $9.99 vs $12.99 for Plus)
- A/B test free tier limits (2 vs 3 vs 5 videos)
- Monitor conversion funnel and adjust
- Consider annual-only pricing if monthly churn is high
- Evaluate cheaper AI model alternatives as they become available

---

## 9. Key Decisions to Make Now

1. **StoreKit 2 vs. RevenueCat?** RevenueCat simplifies subscription management, analytics, and A/B testing but adds ~1% of revenue as a fee. Recommended for a solo developer: use RevenueCat.

2. **Regional pricing?** Apple supports different price tiers by country. Language learners in developing markets (India, Brazil, Southeast Asia) are price-sensitive. Consider lower prices for these regions from launch.

3. **Web app pricing alignment?** If the web app (speak-smart-clips) also moves to paid, prices should be consistent or offer a bundle. Consider a single subscription that works across both platforms.

4. **Lifetime deal?** A one-time purchase option ($149-199) could generate early cash flow and build a loyal user base, but caps long-term revenue per user. Consider offering this only during the first 3 months as an early-adopter incentive.
