# Project Overview
You are an expert full-stack developer AI (Antigravity). You are tasked with building a fully automated sports prediction platform using Next.js. 

## Technology Stack
* Frontend: Next.js, Tailwind CSS
* Database: Supabase (PostgreSQL) paired with Drizzle ORM (to guarantee fast development speed, easy database management, and zero connection issues with Next.js Cron jobs).
* APIs: Telegram Bot API (for alerts), Sports Data API (for fixtures/stats).

## Global Rules
1. Execute the 25 steps below STRICTLY in order. 
2. Do not move to the backend phases until the frontend design system is fully implemented and visually polished.
3. The design must be human-centric, warm, and trustworthy. Avoid traditional neon sportsbook aesthetics.

## Approved Betting Markets
The prediction engine must strictly filter for these 13 markets only:
1. Home Win (1X2 - Home)
2. Away Win (1X2 - Away)
3. Home Double Chance (1X)
4. Away Double Chance (X2)
5. Handicap (Asian/European)
6. Over 1.5 Goals (FT)
7. Over 2.5 Goals (FT)
8. GG / Both Teams to Score (BTTS - Yes)
9. Home Team to Score (Over 0.5)
10. Away Team to Score (Over 0.5)
11. First Half Over 0.5 Goals
12. Under 3.5 Goals (FT)
13. Under 4.5 Goals (FT)

---

## 25-Step Development Workflow

### Phase 1: Foundation & "Human" Design System
1. **Initialize Project:** Create a Next.js repository with Tailwind CSS for a headless architecture.
2. **Establish the Design System:** Create a warm, trustworthy color palette (deep slate backgrounds, clean white panels, soft gold/electric green accents).
3. **Configure Typography:** Import a highly legible sans-serif font (Inter or DM Sans) with fluid responsive scaling.
4. **Create Global Layouts:** Build a responsive navbar ("Daily Pick", "Weekend 50", "Settings") and clean footer.
5. **Design Human Microcopy & States:** Build welcoming loading skeletons and empty states using conversational phrasing (e.g., "Crunching today's numbers...").

### Phase 2: Core Frontend Development
6. **Build the "Daily Pick" Hero Component:** Design a bold card for the single weekday prediction showing the match, market, and odds.
7. **Build the "Confidence Badge":** Implement a progress ring/badge to visually display the algorithm's certainty score (0-100%).
8. **Build the "Weekend 50" View:** Design a scannable table component optimized for reading 50 individual matches with sticky headers.
9. **Build the Settings Dashboard:** Create toggles to manage 54 allowed countries (Tier 1/Tier 2) and the 13 permitted markets.
10. **Finalize Mobile Responsiveness:** Audit touch targets and padding for native app-like feel on iOS/Android.

### Phase 3: Database Architecture (Supabase + Drizzle ORM)
11. **Initialize Database:** Set up Supabase PostgreSQL with Drizzle ORM.
12. **Create `Matches` Schema:** Define tables for upcoming fixtures and raw team data.
13. **Create `Predictions` Schema:** Define tables linking to Match ID, saving market, odds, confidence score, and `is_weekend_pick`.
14. **Create `Settings` Schema:** Set up a table for user configuration (whitelisted leagues/markets).

### Phase 4: API & Data Pipeline
15. **Set up API Client:** Integrate the Sports Data API with secure environment variables.
16. **Implement the League Filter:** Map the 54 approved countries (Tier 1 & Tier 2) + Int. Clubs to their exact API League IDs.
17. **Write Fixture Fetcher:** Create backend functions to pull Daily (Mon-Fri) or Weekend (Sat-Sun) slates, filtering out unapproved leagues.
18. **Write Odds & Stats Fetcher:** Retrieve pre-match odds and historical stats for the fetched fixtures.

### Phase 5: The Prediction Engine
19. **Build the Market Filter:** Discard odds outside target windows (1.30–1.50 for weekdays, 1.20–1.80 for weekends) across the 13 approved markets.
20. **Implement the Weighted Algorithm:** Calculate a 0-100% confidence score weighing Recent Form, H2H, and Goal Averages.
21. **Write Weekday Logic:** Sort Mon-Fri predictions and save ONLY the single #1 highest-confidence pick.
22. **Write Weekend Logic:** Sort Sat-Sun predictions, remove duplicate markets for the same match, and save exactly 50 independent single games.

### Phase 6: Automation & Deployment
23. **Configure Cron Jobs:** Set up automated schedulers to run the weekday script and publish the Daily Pick at exactly 8:00 AM every weekday. Run the weekend script Saturday mornings.
24. **Integrate Telegram Alerts:** Write the HTTP POST request to push a markdown alert to the user's phone at 8:00 AM when predictions are saved.
25. **End-to-End Test & Deploy:** Run simulated fetches, verify math constraints, trigger test alerts, and deploy to production.