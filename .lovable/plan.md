
# Chat-First Candidate Thread System — Full Build Plan

## Architecture Overview
Build a new chat-first experience **alongside** existing pages. Existing users get the new Candidates View as their primary interface while old pages remain accessible.

---

## Phase 1: Candidate Thread Chat Page
**New page: `/candidate-thread/:candidateId`**

A unified single-screen experience per candidate with:
- **Header**: Candidate name, photo, compatibility score badge, status indicator (green/yellow/red), quick-action icons
- **Body** (scrollable, tabbed):
  - **Chat tab** (default): Full AI chat with D.E.V.I. scoped to this candidate. Conversation uploads, analysis results, progressive onboarding questions, and AI insights all appear inline as chat messages
  - **Analysis tab**: Compatibility breakdown, pros/cons, score history chart
  - **Red Flags tab**: Detected patterns, behavioral alerts, flag timeline
  - **Journal tab**: Existing journal entries for this candidate
- **Footer**: Message input (same as current D.E.V.I. chat) with upload button for screenshots/recordings

Key behavior: When a user uploads a conversation screenshot here, the analysis results appear as a rich chat message (score card, insights, flags) directly in the thread.

## Phase 2: Candidates View (New Dashboard)
**New page: `/candidates`**

Replaces the traditional dashboard as the primary landing screen:
- **Header**: "Your Candidates" + "Add New Candidate" prominent CTA button
- **Candidate list**: Cards showing name, photo, score, status dot (green/yellow/red), last interaction date, snippet of latest insight
- **Sorting/filtering**: By score, status, recent activity
- Tapping a candidate → navigates to `/candidate-thread/:id`

Existing dashboard remains at `/dashboard` for users who want it. Bottom nav updated to point to Candidates View as "Home."

## Phase 3: Add Candidate via Chat Flow
**"Add New Candidate" button flow:**

1. Opens upload sheet (existing ConversationUploadSheet) OR a quick-add name field
2. If screenshots uploaded → runs analysis → creates candidate → opens thread with results displayed as first AI message
3. If name-only → creates candidate → opens thread with D.E.V.I. greeting asking for more context
4. Accessible from Candidates View header AND from D.E.V.I. general chat

## Phase 4: Progressive Onboarding in Chat
**No separate onboarding screens for new users:**

- After first candidate is created, D.E.V.I. asks profile questions one-at-a-time inside the candidate thread
- Questions are contextual (e.g., after analyzing a conversation about commitment: "What's your relationship goal?")
- User can skip any question
- Each answered question refines the compatibility score in real-time
- Profile completion % shown subtly in thread header
- For **existing users**: If profile is already complete, this step is skipped entirely. They just get the new Candidates View + thread UI.

## Phase 5: Instant Analysis Display
**Rich chat message components for analysis results:**

- **Score Card**: Large compatibility % with breakdown bars
- **Insights Card**: Top 3 key observations
- **Red Flags Card**: Detected concerns with severity indicators
- **Pattern Card**: Behavioral patterns detected across interactions

These render inline in the chat thread as structured message types (not plain text).

## Phase 6: Navigation Updates
- Bottom nav: Replace "Home" (dashboard) with "Candidates" (new candidates view)
- D.E.V.I. general chat remains accessible for non-candidate-specific conversations
- Existing `/dashboard`, `/candidate/:id` pages remain functional but are secondary
- Settings, Community, etc. unchanged

---

## What stays the same
- All existing database tables and schemas (no migrations needed initially)
- Existing D.E.V.I. chat edge function and AI logic
- Existing candidate CRUD operations
- All other features (community, settings, quizzes, etc.)

## New files to create
- `src/pages/CandidateThread.tsx` — unified thread page
- `src/pages/CandidatesView.tsx` — new candidates list
- `src/components/thread/ThreadChat.tsx` — chat within thread
- `src/components/thread/ThreadHeader.tsx` — candidate header with score
- `src/components/thread/ThreadAnalysis.tsx` — analysis tab
- `src/components/thread/ThreadRedFlags.tsx` — flags tab
- `src/components/thread/AnalysisCard.tsx` — rich analysis chat message
- `src/components/thread/ScoreCard.tsx` — inline score display
- `src/components/thread/InsightCard.tsx` — inline insights
- `src/components/thread/OnboardingQuestion.tsx` — progressive question component

## Files to modify
- `src/App.tsx` — add new routes
- `src/components/navigation/BottomNavigation.tsx` — update nav items
- `src/contexts/OnboardingContext.tsx` — add chat-based onboarding logic
