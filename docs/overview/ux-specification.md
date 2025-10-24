# Americano UX/UI Specification

_Generated on 2025-10-14 by Kevy_

## Executive Summary

Americano is an AI-powered personalized medical education platform designed as "The Medical Student's Cognitive Companion." The platform eliminates the "what to study" anxiety that medical students face by combining intelligent daily study missions, unified knowledge integration, personalized spaced repetition, and behavioral learning pattern analysis into a single cohesive experience.

The UX design challenge centers on creating an interface that minimizes cognitive overhead for users managing intensive medical education while providing sophisticated AI-powered learning capabilities. The platform must feel like an invisible cognitive prosthetic that enhances learning flow rather than demanding additional mental energy.

**Target Platform:** Responsive web application (desktop primary, mobile/tablet secondary) with Progressive Web App capabilities for offline access

**Primary Use Cases:**
- **Daily Study Sessions:** Guided, time-boxed study with clear missions (60-90 min sessions)
- **Exam Preparation:** Knowledge gap analysis and intensive review planning (2-4 weeks)
- **Long-term Learning:** Multi-course integration and semester-long knowledge building (4+ months)

**Critical UX Priorities:**
1. **Decision Fatigue Elimination:** Every interaction must reduce, not increase, mental load
2. **Study Flow Preservation:** Interface disappears into background during learning
3. **Immediate Clarity:** Users understand "what to do now" within 3 seconds
4. **Medical Context Integration:** Design reflects medical education culture and terminology

**Key User Interface Requirements:**
- Daily mission dashboard with personalized study objectives
- Knowledge graph visualization for content relationships
- Semantic search across integrated content sources
- Understanding validation with AI-powered feedback
- Progress analytics connecting to academic outcomes
- Multi-platform continuity (desktop intensive study, mobile quick review)

---

## 1. UX Goals and Principles

### 1.1 Target User Personas

#### **Primary Persona: Alex - The Overwhelmed First-Year**

**Demographics:**
- First-year medical student
- Age: 22-25
- Tech-savvy, mobile-native generation

**Goals:**
- Master course material efficiently without decision paralysis
- Build sustainable study habits for 4+ years of medical education
- Achieve strong academic performance while managing stress
- Develop genuine understanding (not just memorization) for clinical application

**Pain Points:**
- **Decision Fatigue:** Spends 30-40% of study time deciding what to focus on
- **Platform Fragmentation:** Uses 3-5 different tools ($200-600/year) that don't integrate
- **Learning Navigation Anxiety:** Constant worry about studying the "right" things
- **Comprehension Uncertainty:** Unsure if pattern recognition equals true understanding
- **Stress Management:** Overwhelming volume of content and high-stakes environment

**Study Patterns:**
- Morning study sessions (7-9 AM) before classes
- 45-90 minute focused study blocks
- Prefers visual learning with diagrams and knowledge connections
- Struggles with physiology concepts in early morning hours
- High engagement with gamified progress tracking

**Technology Context:**
- Primary device: Desktop/laptop for intensive study
- Secondary: Mobile phone for quick reviews between classes
- Expects seamless cross-device synchronization
- Values clean, distraction-free interfaces

#### **Secondary Persona: Sam - The Exam-Focused Strategist**

**Demographics:**
- First-year medical student approaching major exam
- Highly organized, data-driven learner
- Previous academic success creates high performance expectations

**Goals:**
- Identify and close knowledge gaps before high-stakes exams
- Maximize study efficiency through targeted review
- Achieve objective measurement of exam readiness
- Reduce pre-exam anxiety through data-driven confidence

**Pain Points:**
- **Gap Identification:** Difficulty knowing what they don't know
- **Prioritization Paralysis:** Everything feels important before exams
- **Confidence Calibration:** Oscillates between overconfidence and panic
- **Review Inefficiency:** Wastes time reviewing already-mastered content
- **Stress Amplification:** Exam pressure magnifies decision-making challenges

**Study Patterns:**
- Intensive 2-4 week exam preparation periods
- Longer study sessions (90-120 minutes) during exam prep
- Seeks concrete metrics and progress visualization
- Responds well to structured review plans
- Needs validation that preparation is sufficient

#### **Secondary Persona: Jordan - The Long-term Integrator**

**Demographics:**
- First-year medical student managing multiple concurrent courses
- Future clinical focus, values practical application
- Growth mindset, willing to invest in long-term learning systems

**Goals:**
- Integrate knowledge across anatomy, physiology, histology, and other courses
- Build clinical reasoning skills connecting basic science to practice
- Maintain retention of previous material while learning new content
- Develop sustainable learning system for entire medical education journey

**Pain Points:**
- **Integration Overwhelm:** Difficulty connecting concepts across multiple courses
- **Retention Anxiety:** Forgetting previous semester material while learning new content
- **Clinical Relevance Gap:** Struggling to see how basic science applies to patient care
- **Long-term Planning:** No clear path from preclinical to clinical learning phases
- **System Sustainability:** Current fragmented approach won't scale over 4+ years

**Study Patterns:**
- Daily consistent study (60-90 minutes) across entire semester
- Values spaced repetition for long-term retention
- Seeks clinical context and real-world applications
- Integrative learning style connecting multiple disciplines
- Long-term commitment to platform and learning methodology

---

### 1.2 Usability Goals

Based on the PRD's success criteria, UX principles, and 2025 best practices research, the platform must achieve:

**1. Rapid Onboarding with Progressive Depth (Updated for MVP Reality)**
- **Goal:** Immediate demo experience, then progressive personalization as you use it
- **Success Metric:**
  - <5 minutes to interactive demo mission (sample medical content)
  - <15 minutes to first real personalized mission (your content)
  - Continuous personalization improvement over first 30 days
- **User Benefit:** Instant "aha moment" without setup friction, then deepening value
- **2025 Best Practice:** Predictive onboarding that adapts to your behavior patterns from day one

**2. Cognitive Load Minimization**
- **Goal:** Eliminate decision fatigue through intelligent automation and clear guidance
- **Success Metric:** 25%+ reduction in time spent deciding "what to study"
- **User Benefit:** More time actually learning, less mental energy on planning

**3. Study Flow State Preservation**
- **Goal:** Interface disappears during learning sessions, maintaining focus and concentration
- **Success Metric:** <3 interruptions per 60-minute study session (only intentional breaks)
- **User Benefit:** Deep learning states, improved retention, reduced frustration

**4. Accessibility for Intensive Usage**
- **Goal:** Support extended study sessions (60-120 minutes) without causing eye strain or fatigue
- **Success Metric:** WCAG 2.1 AA compliance + extended-use ergonomic considerations
- **User Benefit:** Sustainable long-term platform usage, reduced physical strain

**5. Cross-Platform Learning Continuity (MVP-Scoped)**
- **Goal:** Seamless experience transitioning between desktop (intensive study) and mobile (quick review)
- **Success Metric:**
  - MVP: <15 seconds context restoration with cloud sync
  - Optimization Target: <2 seconds real-time handoff
- **User Benefit:** Flexibility to learn anywhere without losing progress or mental context
- **2025 Best Practice:** Context-aware interface adaptation - desktop shows detailed analytics, mobile focuses on quick actions

**6. Psychologically-Safe Transparency**
- **Goal:** AI explanations build confidence without amplifying medical student anxiety
- **Success Metric:**
  - 70%+ users report trusting platform's daily mission recommendations
  - 0% users report increased anxiety from AI insights
  - Transparency features used by 40%+ (opt-in for curious learners)
- **User Benefit:** Confidence in study guidance without triggering imposter syndrome or comparison anxiety
- **2025 Best Practice:** Adaptive transparency - simple reassurance by default, deep explanations on-demand
- **Key Innovation:** Frame all insights as opportunities ("Ready to master X") never deficits ("Struggling with Y")

---

### 1.3 Design Principles

The following design principles guide all UX/UI decisions for Americano. These principles are derived from the PRD's 10 UX design principles and prioritized for implementation:

**1. Cognitive Load Minimization (UX1)**
> "Every interface decision prioritizes reducing mental overhead for users already managing intensive medical education."

**Implementation Focus:**
- Single-action primary workflows (one clear "next step")
- Progressive disclosure of advanced features
- Intelligent defaults requiring minimal configuration
- Visual hierarchy directing attention to most important actions
- Automation of repetitive decisions (review scheduling, priority setting)

**2. Immediate Clarity and Actionability (UX3)**
> "Every screen answers 'What should I do now?' within 3 seconds."

**Implementation Focus:**
- Clear primary call-to-action on every screen
- Visual hierarchy prioritizing next actions
- Contextual help without requiring navigation away
- Status indicators showing progress and next steps
- Minimal navigation depth (2-3 clicks to any feature)

**3. Study Flow Preservation (UX2)**
> "Interface design maintains and enhances natural study flow states."

**Implementation Focus:**
- Distraction-free study mode (minimal chrome)
- Seamless transitions between learning activities
- Auto-save and progress preservation
- Non-intrusive notifications and system feedback
- Background processing for AI features

**4. Progress Transparency and Motivation (UX4)**
> "Learning progress is continuously visible through meaningful metrics connected to academic outcomes."

**Implementation Focus:**
- Real-time progress indicators during study sessions
- Daily/weekly/semester progress visualization
- Correlation between platform usage and academic performance
- Meaningful milestones celebrating learning achievements
- Clear connection between today's work and long-term goals

**5. Medical Context Integration (UX5)**
> "Design language reflects medical education culture and terminology."

**Implementation Focus:**
- Medical education terminology (lectures, learning objectives, high-yield concepts, clinical correlation)
- Content hierarchy matching medical curricula (systems-based, organ-based, integrated)
- Integration with medical school schedules (block exams, shelf exams, Step 1/2 prep)
- Evidence-based, data-driven presentation (medical culture values outcomes)
- Clinical relevance and application emphasized in all content
- **2025 Example:** Customizable dashboard tracking specific health metrics style (blood pressure = concept mastery, glucose = retention rates)

**6. Invisible Complexity (NEW - Critical Gap)**
> "Sophisticated AI systems operate silently in the background to deliver simple, actionable guidance. Students interact with elegant simplicity while benefiting from powerful intelligence."

**Implementation Focus:**
- **One-Click Primary Actions:** "Start Today's Mission" hides multi-step backend orchestration (content analysis, spaced repetition calculation, behavioral modeling, session composition)
- **Progressive Disclosure:** Advanced features (knowledge graph visualization, behavioral analytics) revealed only when user seeks depth
- **Smart Defaults:** Zero configuration required - AI learns preferences through usage, not setup forms
- **Background Processing:** Content upload, analysis, and embedding generation happen invisibly with simple status indicators
- **Complexity Budget:** Every feature asks "Can we automate this decision?" before exposing it to user
- **2025 Best Practice:** Predictive interfaces that anticipate needs (AI suggests review timing before user realizes they're forgetting)

---

## 1.4 Gamification Framework (Personalized-First, Psychology-Rooted)

**Critical Context:** This is a **personal tool for one user (you) right now**. Gamification must support intrinsic motivation (mastery, autonomy, purpose) rather than extrinsic competition (leaderboards, social comparison).

### **Self-Determination Theory (SDT) Foundation**

Based on 2025 research, effective gamification satisfies three psychological needs:

**1. Autonomy (Control Over Learning Journey)**
- **Mechanism:** You choose daily mission difficulty, skip topics you've mastered, adjust study pace
- **Anti-Pattern:** Avoid rigid paths or forced progression that feels controlling
- **Implementation:** "Suggested mission" with visible "Customize" option, not locked sequences

**2. Competence (Visible Mastery Progress)**
- **Mechanism:** Clear skill progression, mastery indicators, controlled challenges at edge of ability
- **Anti-Pattern:** Avoid arbitrary points/badges disconnected from real learning
- **Implementation:** Evidence-based metrics (retention curves, comprehension scores, exam correlation)

**3. Relatedness (Connection to Medical Identity)**
- **Mechanism:** Frame learning as "becoming the physician you want to be," clinical application focus
- **Anti-Pattern:** Since solo use, skip social comparison features that amplify anxiety
- **Implementation:** Future-self visualization ("This mastery prepares you for cardiology residency")

---

### **Intrinsic Motivation Mechanics (2025 Research-Based)**

**🎯 Mission System (Daily Goals)**
- **Psychological Hook:** Clear objectives reduce decision fatigue, completion triggers dopamine release
- **Personal Adaptation:** Missions evolve with your performance patterns (morning physiology struggles → afternoon scheduling)
- **Progress Framing:** "You're ready to master cardiac conduction" (opportunity) not "You're behind on cardiology" (deficit)
- **2025 Innovation:** Micro-missions (5-15 min) for fragmented time + macro-missions (60-90 min) for deep work

**📊 Mastery Tracking (Competence Feedback)**
- **Psychological Hook:** Visible progress satisfies achievement motivation without external validation
- **Personal Metrics:**
  - **Retention Curve:** Your forgetting curve vs. optimal spaced repetition timing
  - **Comprehension Depth:** Pattern recognition → Application → Teaching-level understanding
  - **Clinical Readiness:** Basic science knowledge → Clinical reasoning capability
- **Visual Language:** Medical dashboard aesthetics (vital signs, growth charts, diagnostic clarity)
- **Anti-Anxiety Design:** No percentiles, no peer comparison - only personal growth trajectory

**🔥 Streak Preservation (Habit Formation)**
- **Psychological Hook:** Loss aversion drives consistency (don't break the chain)
- **Personal Adaptation:** Streak counts study consistency, but "pauses" don't reset (acknowledge life happens)
- **Smart Streaks:** Tracks meaningful engagement (completed comprehension checks) not empty usage (opened app)
- **2025 Innovation:** "Momentum score" replaces binary streaks (3 days strong > 1 day missed ≠ failure)

**🌱 Knowledge Growth Visualization (Tangible Progress)**
- **Psychological Hook:** Seeing knowledge graph expand creates sense of accumulation and meaning
- **Personal View:** Your uploaded lectures → connected concepts → clinical integration pathways
- **Discovery Moments:** "You just linked anatomy, physiology, and histology!" (integration milestones)
- **Long-term Narrative:** First-year foundation → clinical application → specialty preparation arc

**⚡ Flow State Optimization (Intrinsic Engagement)**
- **Psychological Hook:** Optimal challenge (not too easy, not overwhelming) creates flow state immersion
- **Personal Calibration:** AI adjusts difficulty based on your real-time performance (struggling → easier questions, cruising → deeper challenges)
- **Session Design:** Warm-up (review) → peak challenge (new content) → wind-down (consolidation)
- **Distraction Elimination:** Study mode hides all chrome, notifications, peripheral UI

**🏆 Milestone Celebrations (Meaningful Achievement)**
- **Psychological Hook:** Acknowledgment of significant accomplishments reinforces commitment
- **Personal Milestones:**
  - "First complete system mastered" (cardiovascular system)
  - "30-day learning streak"
  - "Exam readiness achieved" (predicted 85%+ based on knowledge state)
  - "Clinical reasoning unlocked" (successfully explaining to patient-level)
- **Anti-Pattern:** Avoid frequent trivial badges (badge inflation reduces meaning)
- **Celebration Style:** Soft gamified (subtle confetti, smooth animations, friendly badges) - playful but not childish, professional but not sterile

---

### **Extrinsic Motivators to AVOID (Psychological Research)**

**❌ Leaderboards / Peer Comparison**
- **Why Avoid:** Medical students already suffer from comparison anxiety and imposter syndrome
- **Research:** Extrinsic competition undermines intrinsic motivation for learning
- **Your Context:** Solo use makes leaderboards meaningless and anxiety-inducing

**❌ Arbitrary Points / Currency Systems**
- **Why Avoid:** Points disconnected from real learning feel manipulative and hollow
- **Alternative:** Evidence-based metrics (retention rates, comprehension scores) are inherently meaningful

**❌ Time-Pressure Mechanics**
- **Why Avoid:** Medical students already face intense time pressure; adding artificial urgency increases stress
- **Alternative:** Time-tracking for self-awareness ("You studied 45 min today") not performance pressure

**❌ Punishment for Mistakes**
- **Why Avoid:** Fear of failure inhibits learning and experimentation
- **Alternative:** Controlled failure as learning tool ("Let's explore why that explanation was incomplete")

---

### **Implementation Priority for MVP**

**Phase 1 (Essential - Build Now):**
✅ Daily mission system with clear objectives
✅ Mastery progress tracking (retention curves, comprehension depth)
✅ Study streak with intelligent pauses
✅ Flow state session design (warm-up → challenge → consolidation)

**Phase 2 (Enhancement - Add After Core Works):**
- Knowledge growth visualization (graph expansion)
- Milestone celebrations (significant achievements only)
- Personalized difficulty adaptation (real-time challenge calibration)

**Phase 3 (Advanced - Future Optimization):**
- Future-self visualization (clinical identity connection)
- Micro-mission system (fragmented time optimization)
- Predictive flow state triggers (AI detects optimal study timing)

---

## 2. Information Architecture

### 2.1 Site Map

Based on the PRD's 15 functional requirements and personal-first usage model:

```
Americano Platform
│
├── [Home Icon] HOME / DASHBOARD (Primary Landing)
│   ├── Today's Mission (Primary CTA)
│   ├── Progress Summary (Quick glance)
│   ├── Upcoming Reviews (Spaced repetition queue)
│   └── Quick Actions (Upload content, Search, AI Chat, Settings)
│
├── [Target Icon] STUDY MODE (Distraction-free learning)
│   ├── Mission Briefing (What you'll accomplish)
│   ├── Active Learning Session
│   │   ├── Content Presentation (Lectures, notes, resources)
│   │   ├── Spaced Repetition Cards
│   │   ├── Understanding Validation (Comprehension checks)
│   │   └── Knowledge Graph Context (Related concepts)
│   ├── Session Progress (Real-time indicators)
│   ├── AI Study Assistant (FAB bottom-right - same position as everywhere else)
│   └── Session Summary (Completion, insights)
│
├── [Folder Icon] CONTENT LIBRARY (Your medical knowledge base)
│   ├── Courses (Anatomy, Physiology, Histology, etc.)
│   │   ├── Course Overview
│   │   ├── Learning Objectives
│   │   ├── Uploaded Lectures (PDFs, slides)
│   │   └── Personal Notes
│   ├── Resources (First Aid integration, external links)
│   ├── Tags & Organization (Medical taxonomy)
│   └── Upload Center (Drag-drop content processing)
│
├── [Brain Icon] KNOWLEDGE GRAPH (Concept relationships)
│   ├── Graph Visualization (Interactive concept map)
│   ├── Search & Discover (Semantic search)
│   ├── Concept Details (Deep dive on any topic)
│   └── Integration Insights (Cross-course connections)
│
├── [Chart Icon] PROGRESS & ANALYTICS (Your learning journey)
│   ├── Mastery Dashboard
│   │   ├── Retention Curves (Your forgetting patterns)
│   │   ├── Comprehension Depth (Recognition → Application → Teaching)
│   │   ├── Study Momentum (Streak, consistency)
│   │   └── Milestone Achievements
│   ├── Exam Preparation
│   │   ├── Readiness Score (Predicted performance)
│   │   ├── Knowledge Gap Analysis
│   │   ├── Review Plan (Targeted study schedule)
│   │   └── Exam Countdown
│   └── Learning Patterns (Behavioral insights)
│       ├── Optimal Study Times (When you perform best)
│       ├── Content Preferences (Visual, text, mixed)
│       └── Difficulty Trends (Struggling topics)
│
├── [Chat Icon] AI LEARNING ASSISTANT (Conversational support - Global Access)
│   ├── Access Pattern: Floating Action Button (FAB) bottom-right on ALL screens
│   ├── Ask Questions (Natural language medical Q&A)
│   ├── Explain Concepts (Get clarification on any topic)
│   ├── Quiz Me (On-demand practice questions)
│   ├── Study Strategy Advice (Personalized recommendations)
│   ├── Context-Aware Assistance (Knows your content, progress, struggles)
│   └── Chat History (Review past conversations)
│
├── [Search Icon] SEARCH (Global semantic search)
│   ├── Quick Search (Top navigation)
│   ├── Advanced Search (Filters, sources)
│   └── Search Results (Content + Context)
│
└── [Settings Icon] SETTINGS (Configuration & preferences)
    ├── Profile & Account
    ├── Course Management (Add/edit courses, exam schedules)
    ├── Learning Preferences (Session length, difficulty, review frequency)
    ├── Behavioral Data Settings (Privacy, data collection consent)
    └── Integrations (Future: AMBOSS, First Aid APIs)
```

**Key Architectural Decisions:**

1. **Dashboard-Centric:** Primary landing shows "what to do now" (Mission) + progress (Motivation)
2. **Study Mode Isolation:** Distraction-free environment separate from browsing/organizing
3. **Content vs. Knowledge Separation:** Library (static uploads) vs. Graph (dynamic relationships)
4. **AI Assistant Accessibility:** Always available but non-intrusive - contextual help button, not forced interaction
5. **Progressive Disclosure:** Advanced features (Analytics, Graph) accessible but not primary path
6. **Personal Focus:** No social features, collaboration, or comparison tools (aligned with solo use)

**AI Assistant Integration Philosophy:**
- **Consistent Placement:** Floating Action Button (FAB) bottom-right on ALL screens (desktop & mobile)
- **Single Implementation:** One code pattern, one user mental model, easy to maintain
- **Context-Aware:** AI knows current page, uploaded content, progress, identified struggles
- **On-Demand:** Available when you need help, minimizes to small button when you don't
- **Educational Focus:** Designed to explain concepts, not just answer questions (Socratic method)
- **Personalized:** Adapts explanations to your knowledge level and learning patterns
- **2025 Best Practice:** FAB pattern (ChatGPT, Intercom, Drift) - proven to work

---

### 2.2 Navigation Structure

**Primary Navigation (Always Visible - Top Bar)**

```
[Logo] Americano  |  [Target Icon] Today's Mission  |  [Folder Icon] Library  |  [Brain Icon] Graph  |  [Chart Icon] Progress  |  [Search Icon] Search  |  [Settings Icon]  [Avatar]
```

**Global Actions (Not in Nav Bar):**
- **AI Assistant:** Floating Action Button (FAB) bottom-right, always visible on all screens
  - Click to expand chat panel
  - Consistent position (never moves)
  - Context-aware (knows current page/content)

**Rationale:**
- **"Today's Mission" as Primary CTA:** Aligns with cognitive load minimization (one clear action)
- **Icon + Text Labels:** Medical students are visual learners, icons aid quick recognition and scanning
- **7 items:** Optimal navigation count (within Miller's Law 7±2)
- **AI as FAB:** Always accessible without taking nav slot, consistent with ChatGPT/Intercom patterns
- **Search Always Available:** FR15 requirement, medical students need instant access to content

---

**Mobile Navigation (Bottom Bar - Touch-Optimized)**

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ [Home]   │ [Target] │ [Folder] │ [Chart]  │  [More]  │
│  Home    │ Mission  │ Library  │ Progress │   •••    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Global Actions (Mobile):**
- **AI Assistant:** Floating Action Button (FAB) bottom-right, above nav bar
- **Search:** Pull-down gesture from top (standard mobile pattern)

**Rationale:**
- **Thumb-Zone Optimization:** Bottom navigation for one-handed mobile use
- **5 items:** Home, Mission, Library, Progress, More (Graph, Settings in More)
- **AI as FAB:** Consistent with desktop, doesn't consume nav slot, always accessible
- **Mission Central:** Easy access to start study session from any screen

---

**Breadcrumb Navigation (Contextual - Content Pages)**

```
Example: Home > Library > Anatomy > Cardiovascular System > Cardiac Conduction
```

**Rationale:**
- **Orientation:** Clear location in deep content hierarchies
- **Quick Navigation:** Click any level to jump back
- **Medical Hierarchy:** Reflects medical education structure (Course → System → Topic)

---

**In-Study Navigation (Study Mode - Minimal)**

```
During active study session:
[Exit Study Mode]  [Session Progress: 3/5 completed]  [⏸️ Pause]
```

**Rationale:**
- **Flow Preservation:** Minimal chrome to maintain focus
- **Progress Visibility:** Shows advancement without distraction
- **Easy Exit:** Always clear how to return to main navigation

---

## 3. User Flows

### Flow 1: Upload PNWU Lecture (MVP Priority #1)

**User Goal:** Get this week's PNWU lectures into Americano
**Entry Point:** Dashboard or Library
**Success Criteria:** Lecture processed and ready to study within 3 minutes
**Frequency:** 2-3x per week (as you get new lectures)
**MVP Priority:** 🔴 CRITICAL - Build this first

**Your Reality:**
- Lectures: PDF format from PNWU professors
- Content: Gross Anatomy, Musculoskeletal, Cardiovascular, etc.
- No personal notes - rely 100% on lecture PDFs
- Need: Fast upload, auto-extraction of objectives

**Step-by-Step Flow:**

1. **Upload Trigger (1 click)**
   - Dashboard: Big "+ Upload Lecture" button
   - Or: Drag PDF directly onto dashboard
   - Or: Keyboard: Cmd+U

2. **File Selection**
   - File picker opens
   - Select: `ANAT_505_Gross_Anatomy_Week_3.pdf`
   - Multi-select allowed (upload whole week at once)

3. **Quick Metadata (10 seconds)**
   ```
   Course: [Dropdown] → Gross Anatomy (ANAT 505)
   Week/Module: [Auto-detect] → Week 3

   [Upload & Process] button
   ```
   - Smart defaults: Course auto-detected from filename if possible
   - Can edit later if wrong

4. **Background Processing (Invisible - 2-3 minutes)**
   ```
   Upload progress: ████████░░ 80%
   Processing started...

   [You can close this and come back later]
   ```

   **Behind the scenes:**
   - OCR extracts text (PaddleOCR)
   - GPT-4 identifies learning objectives
   - Creates flashcards from key concepts
   - Adds to your content library

5. **Processing Complete Notification**
   ```
   ✅ Gross Anatomy Week 3 is ready!

   - 12 learning objectives found
   - 24 flashcards created
   - Added to Musculoskeletal System module

   [Study Now] [View in Library] [Dismiss]
   ```

6. **Error Handling (If OCR Fails)**
   ```
   ⚠️ Had trouble reading this PDF

   Possible issues:
   - Scanned image (not text PDF)
   - Poor quality scan

   [Try Again] [Upload Different File] [Contact Support]
   ```

**MVP Simplifications:**
- No manual objective editing (just accept what GPT-4 extracts)
- No custom tagging (auto-categorize only)
- No knowledge graph integration yet (just store in Library)
- Processing happens server-side (you wait, no background jobs yet)

**Tech Stack Notes:**
- Frontend: React file upload component
- Backend: OpenAI API for GPT-4
- OCR: PaddleOCR (Python service)
- Storage: PostgreSQL for content, S3 for PDFs

---

### Flow 2: Daily Study Session (MVP Priority #2)

**User Goal:** Study today without deciding "what to focus on"
**Entry Point:** Dashboard
**Success Criteria:** Studying within 30 seconds of opening app
**Frequency:** Daily (your main workflow)
**MVP Priority:** 🟡 HIGH - Build after upload works

**Your Reality:**
- You have lectures uploaded (Anatomy, Cardiovascular, Musculoskeletal)
- You need to review previous content + learn new content
- You don't know optimal spacing intervals yet (FSRS will learn)
- Start simple: Show you what needs review TODAY

**Step-by-Step Flow:**

1. **Open Americano (Morning routine)**
   ```
   Dashboard loads

   📋 Today's Study Plan
   ┌──────────────────────────────────────┐
   │ 🎯 Review 15 cards                   │
   │ 📚 Study Cardiovascular System       │
   │                                      │
   │ Estimated: 45 minutes                │
   │                                      │
   │      [Start Studying]                │
   └──────────────────────────────────────┘
   ```

2. **Click "Start Studying" → Study Mode**
   - Fullscreen, minimal UI
   - No nav bar, no distractions

3. **Review Phase (15 cards due today)**
   ```
   Card 1 of 15

   Q: What is the Frank-Starling mechanism?

   [Show Answer]
   ```

   Click "Show Answer":
   ```
   A: Increased preload → increased stroke volume

   How well did you know this?
   [Again] [Hard] [Good] [Easy]
   ```

4. **New Content Phase (After reviews)**
   ```
   📚 Cardiovascular System - New Content

   Learning Objective 1 of 3:
   "Describe cardiac conduction pathway"

   [Content from your lecture PDF shows here]

   [Got it, Next] [Need to review this again]
   ```

5. **Session Complete**
   ```
   ✅ Session Complete!

   Today's progress:
   - 15 reviews completed
   - 3 new concepts learned
   - 42 minutes studied

   Tomorrow: 18 cards to review

   [Done]
   ```

**MVP Simplifications:**
- Simple FSRS intervals (no fancy AI yet)
- No "explain to patient" validation (just "got it" or "review again")
- No session analytics (just count cards + time)
- No warm-up/peak/wind-down structure (that's V2)

**Error States:**
```
[Empty State - No Content Yet]

📭 Nothing to study today

You haven't uploaded any lectures yet.

[Upload Your First Lecture]
```

**Tech Stack:**
- FSRS algorithm: TypeScript implementation
- Card renderer: React components
- Progress tracking: PostgreSQL

---

### Flow 3: AI Chat Help (MVP Priority #3)

**User Goal:** Get unstuck when you don't understand a concept
**Entry Point:** FAB button (bottom-right, always visible)
**Success Criteria:** Helpful explanation within 10 seconds
**Frequency:** As-needed (5-10x per week estimated)
**MVP Priority:** 🟢 MEDIUM - Build after core studying works

**Your Reality:**
- You're studying alone, no classmates to ask
- Concepts can be confusing (especially physiology)
- Need quick help without leaving study flow
- OpenAI GPT-4 with YOUR lecture content as context

**Step-by-Step Flow:**

1. **Stuck on a concept during study**
   - You're reviewing cardiac conduction
   - Don't understand a specific part

2. **Click AI FAB (bottom-right)**
   ```
   Chat panel slides in →

   💬 AI Study Assistant

   I noticed you're studying cardiac conduction.
   How can I help?

   [Type your question...]
   ```

3. **Ask Question**
   ```
   You type: "Explain sinoatrial node simply"

   AI responds:
   "The SA node is your heart's natural pacemaker.

   Think of it like this:
   - Located in right atrium
   - Fires electrical signal 60-100 times/min
   - Signal spreads to make heart contract

   From your Cardiovascular lecture (Week 2):
   [Shows relevant excerpt from YOUR PDF]

   Make sense? Want me to quiz you on it?"

   [Yes, quiz me] [Explain more] [I got it]
   ```

4. **Follow-up or Close**
   - Get quizzed if helpful
   - Or minimize chat (FAB shrinks back)
   - Context preserved (can resume later)

**MVP Simplifications:**
- No conversation history (just current session)
- No "export to notes" feature
- No Socratic method (just direct answers for now)
- Simple: Question → Answer → Done

**Error State:**
```
⚠️ AI temporarily unavailable

OpenAI API error. Try again in a moment.

[Retry] [Close]
```

**Tech Stack:**
- OpenAI GPT-4 API
- Streaming responses (real-time)
- Context: Your current lecture + past performance (later)

---

### Flow 4: Exam Preparation Mode (V2 - SKIP FOR MVP)

**⚠️ NOT BUILDING IN V1 ⚠️**

**Rationale:** You need to:
1. Have content uploaded first
2. Study for 2-4 weeks to collect performance data
3. THEN we can analyze gaps and create exam prep mode

**Build This Later:** After you've used Americano for 1+ months and have your first PNWU exam coming up.

**For Now:** Just use daily study sessions. When exam approaches, manually increase study time.

**V2 Features (Future):**
- Automated gap analysis
- Exam countdown mode
- Readiness scoring

**Step-by-Step Flow:**

1. **Exam Setup (2 minutes)**
   - **Input Required:**
     - Exam date
     - Exam scope (which courses/topics)
     - Exam type (block exam, shelf, Step 1)
   - Optional: Upload exam syllabus for AI analysis

2. **Knowledge Gap Analysis (AI-Powered, 1 minute)**
   - **Platform Analyzes:**
     - All uploaded content in exam scope
     - Your performance history per topic
     - Current mastery levels (retention curves)
   - **Gap Report Generated:**
     - Strong areas (green): Well-mastered, light review needed
     - Weak areas (red): Low retention, intensive review needed
     - Unstudied (gray): No data yet, must learn

3. **Study Plan Generation (Immediate)**
   - **Plan Overview:**
     - Days until exam: 14
     - Topics to review: 12 (prioritized by weakness + exam weight)
     - Estimated total hours: 18
     - Daily time commitment: 90 minutes
   - **Review Schedule:**
     - Week 1: Close knowledge gaps (weak areas)
     - Week 2: Comprehensive review + validation
     - Final 3 days: Light review, confidence building

4. **Daily Missions (Exam-Focused)**
   - Missions automatically adapted:
     - Prioritize weak areas from gap analysis
     - Increase review frequency as exam approaches
     - Mix: 60% gaps, 30% comprehensive, 10% validation
   - Readiness score updates daily: "78% ready → 85% ready"

5. **Exam Day & Aftermath**
   - **3 Days Before:** Taper intensity, light review only
   - **Exam Day:** Confidence message, no new learning
   - **Post-Exam:** Deactivate mode, return to normal missions

**Key UX Decisions:**
- **Data-Driven Planning:** AI eliminates "what to study" anxiety
- **Adaptive Intensity:** Automatically adjusts based on progress
- **Readiness Transparency:** Clear prediction of exam performance
- **Stress Management:** Taper and confidence-building built in

---

### Flow 4: AI Learning Assistant Conversation

**User Goal:** Get help understanding a concept
**Entry Point:** Floating Action Button (FAB) - available on all screens
**Success Criteria:** Question answered with personalized, educational explanation
**Frequency:** As-needed (5-10x per week)

**Step-by-Step Flow:**

1. **Initiate Conversation (1 click)**
   - Click AI FAB (bottom-right corner, always visible)
   - Chat panel slides in from right
   - **Context Detection:**
     - In Study Session → "Need help with cardiac conduction?"
     - In Library → "Questions about this course?"
     - Dashboard → "How can I help you study today?"

2. **User Input**
   - **Question Types:**
     - Conceptual: "Explain Frank-Starling mechanism simply"
     - Strategic: "How should I approach cardiology for the exam?"
     - Practical: "Quiz me on cardiac conduction"
   - Natural language input (no templates)

3. **AI Processing (Context-Aware)**
   - **AI Retrieves:**
     - Your uploaded lecture notes on this topic
     - Your performance history (e.g., "You missed this on last quiz")
     - Related concepts you've already mastered
   - **Response Strategy:**
     - Socratic method (ask questions to guide understanding)
     - Adapt complexity to your demonstrated knowledge level
     - Reference your specific content, not generic explanations

4. **AI Response**
   - **Response Formats:**
     - **Explanation:** Step-by-step breakdown with clinical examples
     - **Quiz:** Practice questions with immediate feedback
     - **Strategy:** Personalized study recommendations
   - **Follow-up Options:**
     - "Explain simpler" (if still confused)
     - "Give clinical example" (connect to practice)
     - "Quiz me on this" (test understanding)
     - "Add to notes" (save conversation)

5. **Conversation Management**
   - Chat persists across sessions (history saved)
   - Minimize to FAB (doesn't close conversation)
   - Resume later from chat history
   - Export valuable explanations to personal notes

**Key UX Decisions:**
- **Always Available:** FAB visible on every screen (consistent position)
- **Context-Aware:** AI knows where you are, what you're studying
- **Educational Focus:** Socratic teaching, not just answers
- **Non-Intrusive:** On-demand only, never interrupts flow

---

### Flow 5: Knowledge Graph Visualization (V2 - SKIP FOR MVP)

**⚠️ NOT BUILDING IN V1 ⚠️**

**Rationale:**
- Cool feature, but not essential for studying
- Requires significant frontend work (D3.js or similar)
- Need meaningful amount of content first (50+ lectures)
- You can study effectively without visual graph

**Build This Later:** After V1 is working and you have 1-2 months of content uploaded.

**For Now:**
- Simple list view of your lectures (Library section)
- Search to find concepts
- Related concepts shown as text list (not graph)

**V2 Features (Future):**
- Interactive graph visualization
- Click nodes to explore
- Integration insights

**Step-by-Step Flow:**

1. **Graph Visualization Access**
   - **Entry Points:**
     - Navigation: "Graph" in main nav
     - Study Session: "Show related concepts" button
     - Search Results: "View in graph" option
   - Initial view: Your entire knowledge base as interconnected nodes

2. **Visual Exploration**
   - **Node Representation:**
     - Size: Importance (high-yield concepts = larger nodes)
     - Color: Mastery level (green = strong, yellow = moderate, red = weak)
     - Connections: Lines show relationships (thick = strong connection)
   - **Interaction:**
     - Zoom: Mouse wheel or pinch gesture
     - Pan: Click-drag to navigate
     - Click node: Open concept detail panel

3. **Concept Detail View**
   - **Information Displayed:**
     - Concept definition
     - Source lectures (where you learned it)
     - Your mastery level + retention curve
     - Related concepts (connected nodes)
     - Clinical relevance (if available)
   - **Actions:**
     - "Study now" → Add to today's mission
     - "Show connections" → Highlight relationship paths
     - "Integration quiz" → Test cross-course understanding

4. **Discovery Modes**
   - **Semantic Search:**
     - Search "cardiac" → Highlights all related nodes
     - Visual clusters form (anatomy, physiology, pharmacology)
     - Reveals integration opportunities
   - **Course Filter:**
     - Show only "Anatomy" → See course-specific progress
     - Compare to "Physiology" → Find integration gaps
   - **Clinical Pathway:**
     - Trace concept → clinical application
     - "Basic science → Patient presentation → Treatment"

5. **Integration Insights (AI-Generated)**
   - **Pattern Detection:**
     - "You've mastered cardiovascular anatomy but not physiology"
     - "These concepts appear together on exams frequently"
     - "Strong on individual systems, weak on integration"
   - **Actionable Recommendations:**
     - Generate integration mission: "Connect cardiac anatomy + physiology"
     - Suggest clinical case study
     - Create cross-course review session

**Key UX Decisions:**
- **Visual Learning:** Graph appeals to medical students' visual preferences
- **Discovery Over Directory:** Explore connections, not just browse content
- **Mastery Transparency:** Color-coding shows strengths/weaknesses at a glance
- **Action-Oriented:** Every insight leads to study action

---

## 4. Design & Development Priorities

### MVP Tech Stack (Based on OpenAI Cookbook + Your Needs)

**Frontend:**
- React + Next.js (SSR for performance)
- Tailwind CSS (fast styling, medical-professional aesthetic)
- shadcn/ui components (clean, accessible base components)

**Backend:**
- Next.js API routes (start simple)
- PostgreSQL (lectures, cards, progress)
- Prisma ORM (type-safe database)

**AI/ML:**
- OpenAI GPT-4 (content extraction, chat)
- OpenAI Embeddings (semantic search later)
- PaddleOCR (Python service for PDF text extraction)

**Storage:**
- Vercel Blob or S3 (PDF files)
- PostgreSQL (everything else)

**Deployment:**
- Vercel (Next.js native, easy deploys)

---

## 5. Development Roadmap (6-Week MVP - All Core Features)

### Week 1: Upload & Study Core
**Goal:** Upload lectures + basic studying works

**Tasks:**
1. Set up Next.js + PostgreSQL + Prisma
2. Build upload UI (drag-drop)
3. Integrate PaddleOCR + OpenAI for content extraction
4. Implement FSRS algorithm (TypeScript)
5. Build basic study UI (flashcards)
6. **Start tracking everything** (time, performance, reviews)

**Success Metric:** Upload lecture → Study cards → Data captured in DB

---

### Week 2: Progress Analytics Dashboard
**Goal:** See what's working, what's not

**Tasks:**
1. Build analytics dashboard page
2. **Key Metrics:**
   - Cards reviewed today/week/month
   - Time studied (by day, by course)
   - Mastery progression (% cards at each level)
   - Retention rate (% remembered)
3. Simple charts (recharts or Chart.js)
4. Course-level breakdown

**Success Metric:** After 1 week of studying, see clear progress data

**Dashboard Design:**
```
┌─────────────────────────────────────────┐
│ This Week                               │
│ • 87 cards reviewed                     │
│ • 4.2 hours studied                     │
│ • 82% retention rate                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Mastery by Course                       │
│                                         │
│ Anatomy:        ████████░░ 78%          │
│ Cardiovascular: ██████░░░░ 65%          │
│ Respiratory:    ████░░░░░░ 42%          │
└─────────────────────────────────────────┘
```

---

### Week 3: Behavioral Learning Patterns + Understanding Validation
**Goal:** Track WHEN you study + test real comprehension

**Part A: Behavioral Patterns**
**Tasks:**
1. Track study session timestamps
2. Track performance by time of day
3. Identify struggling topics (low retention, many "Again" presses)
4. Simple pattern detection:
   - "You study best at 7-9 AM"
   - "Physiology concepts take you 2x longer"
   - "You struggle with cardiovascular on Mondays"

**Part B: Understanding Validation**
**Tasks:**
1. Add "Explain" mode to study sessions
2. After flashcard review, occasional prompt: "Explain this to a patient"
3. OpenAI GPT-4 grades response (1-5 scale)
4. Track comprehension scores separately from recall

**Success Metric:**
- Dashboard shows "Best study time: 7-9 AM"
- Complete 5 "explain" validations, see comprehension score

**Understanding Validation UI:**
```
✅ You got the flashcard right!

Now explain it:
┌─────────────────────────────────────────┐
│ Explain the SA node to a patient with   │
│ no medical background.                  │
│                                         │
│ [Text input area]                       │
│                                         │
│ [Submit]                   [Skip]       │
└─────────────────────────────────────────┘

AI Feedback:
"Good explanation of location and function.
Could improve: Add analogy for pacemaker.
Comprehension Score: 4/5"
```

---

### Week 4: Daily Mission Intelligence + AI Chat
**Goal:** Smart mission generation + on-demand help

**Part A: Mission Generation 2.0**
**Tasks:**
1. Use behavioral patterns to schedule content
2. Prioritize struggling topics
3. Adapt difficulty based on recent performance
4. Time-aware scheduling (hard content in your peak hours)

**Part B: AI Chat Assistant**
**Tasks:**
1. Floating Action Button (FAB) component
2. OpenAI chat with streaming
3. Context: current lecture + your performance data
4. Chat panel UI

**Success Metric:**
- Mission adapts to your patterns
- AI answers "Explain SA node" with YOUR lecture context

---

### Week 5: Exam Preparation Mode
**Goal:** Targeted review for upcoming exams

**Tasks:**
1. Exam setup UI (date, scope, courses)
2. Gap analysis algorithm:
   - Identify weak topics (low retention, low comprehension)
   - Unstudied content
   - High-yield flagging (from GPT-4 extraction)
3. Generate exam-focused mission plan
4. Daily readiness score (predicted performance)
5. Countdown mode (tapers review 3 days before)

**Success Metric:** Set exam 2 weeks out → See gap report → Get daily exam-prep missions

**Exam Prep UI:**
```
📅 Anatomy Exam in 14 days

Knowledge Gaps Detected:
❌ Muscle tissue types (35% retention)
❌ Cardiac conduction (not studied in 12 days)
⚠️  Neuroanatomy (weak comprehension scores)
✅ Skeletal system (strong, light review needed)

Study Plan:
• Week 1: Close gaps (90 min/day)
• Week 2: Comprehensive review (60 min/day)
• Final 3 days: Light review (30 min/day)

Current Readiness: 68% → Target: 85%

[Start Exam Prep]
```

---

### Week 6: Knowledge Graph Visualization
**Goal:** Discover concept connections

**Tasks:**
1. Build graph data structure from lecture relationships
2. Integrate D3.js or React-Force-Graph
3. Node visualization:
   - Size = importance (high-yield)
   - Color = mastery (green/yellow/red)
   - Connections = related concepts
4. Interactive:
   - Click node → see details
   - Search → highlight related nodes
   - Filter by course
5. Integration insights (AI-generated)

**Success Metric:** See your knowledge graph, click cardiovascular → see anatomy/physiology connections

**Graph UI:**
```
[Visual graph with nodes and edges]

Nodes:
• SA Node (green, large) ──┬── Cardiac Conduction
• AV Node (yellow, medium)─┤
• Bundle of His (red, small)┘

Click "SA Node":
┌─────────────────────────────────────┐
│ SA Node (Sinoatrial Node)           │
│                                     │
│ Mastery: 85% ✅                     │
│ Last studied: 2 days ago            │
│ Comprehension: 4/5                  │
│                                     │
│ Related concepts:                   │
│ • Cardiac conduction (connected)    │
│ • Heart physiology (integrated)     │
│                                     │
│ [Study Now] [Add to Mission]        │
└─────────────────────────────────────┘
```

---

## 6. What You're NOT Building in MVP (V2 Features)

❌ Mobile Native App (web-responsive is enough for now)
❌ Social/Collaboration Features (solo use only)
❌ Integration with AMBOSS/First Aid APIs (manual for now)
❌ Advanced Gamification (milestones, achievements - add later)
❌ Spaced Repetition Optimization (start with standard FSRS, tune later)
❌ Voice Input/Output (typing is fine for MVP)
❌ Offline Mode (PWA can wait)

**Build These in V2:** After 6-8 weeks of real usage data

---

## 7. Next Actions (Start TODAY)

### Immediate (Today):
1. **Create Next.js project:** `npx create-next-app@latest americano`
2. **Set up PostgreSQL:** Local Postgres or Supabase
3. **Install Prisma:** `npm install prisma @prisma/client`
4. **Init database schema:** Create `Lecture`, `Card`, `Review` models

### This Week:
1. Build upload UI
2. Test OpenAI API (get API key, test GPT-4 call)
3. Research PaddleOCR integration options

### Success Criteria for MVP Launch (6 weeks):
✅ You can upload PNWU lectures (Week 1)
✅ Study flashcards with FSRS scheduling (Week 1-2)
✅ Progress analytics dashboard shows your data (Week 2)
✅ Behavioral patterns tracked and surfaced (Week 3)
✅ Understanding validation tests real comprehension (Week 3)
✅ AI chat helps when stuck (Week 4)
✅ Exam prep mode for targeted review (Week 5)
✅ Knowledge graph shows concept connections (Week 6)

**After 6 weeks, you have a COMPLETE learning platform tailored to YOU.**

---

## 8. Design System - Soft Gamified Playful Flat Minimal with Glassmorphism

**Design Aesthetic Philosophy:**
A modern, approachable learning platform that balances **playful gamification** with **medical professionalism**. The design uses **flat minimalism** as its foundation, enhanced with **subtle glassmorphism** for depth, and **soft, friendly elements** that reduce anxiety while maintaining credibility.

**Core Design Principles:**
- **Soft Gamification:** Gentle progress indicators, friendly celebrations, non-intimidating metrics
- **Playful:** Rounded corners, smooth animations, warm interactions (not childish)
- **Flat Minimal:** Clean hierarchy, generous whitespace, essential elements only
- **Glassmorphism Hints:** Subtle transparency, backdrop blur on cards/modals, layered depth
- **Medical Professional:** Trustworthy color palette, evidence-based presentation, clinical terminology

---

### Color Palette (Soft + Professional)

**Primary Colors (OKLCH Color Space):**
- **Primary Blue:** `oklch(0.7 0.15 230)` (blue-400) - Softer, more approachable than traditional medical blue
- **Accent Purple:** `oklch(0.7 0.15 290)` (purple-400) - Playful, gamified elements (streaks, achievements)
- **Success Green:** `oklch(0.75 0.15 160)` (emerald-400) - Mastery, completion (bright but not harsh)
- **Warning Amber:** `oklch(0.8 0.15 85)` (amber-400) - Review needed (warm, not alarming)
- **Error Rose:** `oklch(0.7 0.15 15)` (rose-400) - Mistakes (softer than harsh red)

**Neutral Palette:**
- **Background:** `#FAFAFA` (gray-50) - Soft white, easy on eyes for long study sessions
- **Surface:** `#FFFFFF` with glassmorphism - Cards use `bg-white/80 backdrop-blur-md`
- **Text Primary:** `#1F2937` (gray-800) - High contrast, readable
- **Text Secondary:** `#6B7280` (gray-500) - Subtle, non-critical info
- **Border:** `#E5E7EB` (gray-200) - Soft dividers

**Glassmorphism Layers:**
```css
/* Primary cards */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);

/* Secondary overlays */
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(8px);
```

---

### Typography (Friendly + Readable)

**Font Family:**
- **Primary:** `Inter` - Clean, modern, excellent readability
- **Accent:** `DM Sans` - Slightly playful for headings, gamified elements
- **Fallback:** System UI stack

**Type Scale:**
- **Hero (Dashboard Mission):** 2.25rem (36px), DM Sans Bold, letter-spacing -0.02em
- **Heading 1:** 1.875rem (30px), DM Sans Semibold
- **Heading 2:** 1.5rem (24px), Inter Semibold
- **Body:** 1rem (16px), Inter Regular, line-height 1.6
- **Small (Captions):** 0.875rem (14px), Inter Regular

**Tone:**
- Friendly but not casual
- Encouraging ("You're ready to master...") not demanding
- Medical terminology used accurately but explained simply

---

### Spacing & Layout (Generous Whitespace)

**Spacing Scale (Tailwind):**
- **Micro:** 4px (px-1) - Tight grouping
- **Small:** 8px (px-2) - Related elements
- **Medium:** 16px (px-4) - Section padding
- **Large:** 24px (px-6) - Card padding
- **XLarge:** 32px (px-8) - Page margins
- **XXLarge:** 48px (px-12) - Section separation

**Layout Principles:**
- **Generous whitespace:** Reduce cognitive load, not cramped
- **Max content width:** 1280px (constrain for readability)
- **Grid:** 12-column responsive (Tailwind grid)
- **Card-based:** Everything in soft-rounded cards with glassmorphism

---

### Component Style (Flat Minimal + Glassmorphism)

**Buttons:**
- **Primary CTA:** Rounded-lg (8px), solid color bg-blue-400, shadow-md, hover:shadow-lg hover:bg-blue-500
  ```css
  background: #60A5FA; /* Solid blue-400, NO GRADIENTS */
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(96, 165, 250, 0.2);
  transition: all 200ms ease-in-out;
  ```
  ```css
  /* Hover state */
  background: #3B82F6; /* blue-500 */
  box-shadow: 0 10px 15px rgba(96, 165, 250, 0.3);
  ```
- **Secondary:** Outline style, border-2, hover:bg-gray-50
- **Tertiary:** Ghost style, text-primary, hover:bg-gray-100

**Cards:**
- **Primary (Dashboard, Content):**
  ```css
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  ```
- **Hover:** Scale up 2% (transform: scale(1.02)), shadow-xl

**Modals/Dialogs:**
- **Overlay:** bg-black/40 backdrop-blur-sm (glassmorphism backdrop)
- **Content:** Same glassmorphism as cards, centered, rounded-2xl (12px)

**Progress Indicators:**
- **Progress Bars:** Rounded-full, solid emerald fill, soft glow on completion
  ```css
  background: #34D399; /* Solid emerald-400, NO GRADIENTS */
  border-radius: 9999px;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
  ```
- **Streaks/Achievements:** Playful badges with soft shadows, not harsh borders

**Icons:**
- **Style:** Lucide Icons or Heroicons (rounded, friendly)
- **Size:** 20px (default), 24px (large actions)
- **Color:** Match text hierarchy (gray-500 secondary, primary for actions)

---

### Interaction & Animation (Smooth + Playful)

**Transitions (Powered by motion.dev):**
- **Default:** 200ms ease-in-out (buttons, hover states)
- **Page transitions:** 300ms ease-out (smoother for navigation)
- **Success celebrations:** 400ms spring animation (playful bounce)
- **Note:** Use motion.dev for all animations (modern library, NOT deprecated Framer Motion)

**Hover States:**
- **Lift Effect:** Translate-y -2px + shadow-lg (cards, buttons)
- **Color Shift:** Lighten/darken by 5% (subtle feedback)

**Loading States:**
- **Skeleton:** Soft pulse animation, glassmorphism background
- **Spinners:** Soft gradient spinner (not harsh blue)

**Celebrations (Gamification):**
- **Mission Complete:** Confetti (subtle, 2 seconds), success toast with glass effect
- **Streak Milestone:** Gentle scale-up animation, glow effect
- **Mastery Unlocked:** Badge flies in from bottom, settles with bounce

---

### Medical Professional Elements (Trust Anchors)

**Where to Apply Medical Aesthetic:**
- **Progress Analytics:** Dashboard-style metrics (vital signs presentation)
- **Exam Readiness Scores:** Clinical severity colors (green/yellow/red zones)
- **Learning Objectives:** Numbered lists, clinical terminology
- **Content Organization:** Medical curriculum structure (systems-based)

**Where to Apply Playful Aesthetic:**
- **Daily Missions:** Friendly language, encouraging CTAs
- **Gamification:** Streaks, achievements, celebrations
- **Onboarding:** Welcoming, not intimidating
- **AI Chat:** Approachable, Socratic, patient explanations

**Balance:** Medical credibility in metrics/outcomes, playful encouragement in interactions.

---

### Implementation Notes (shadcn/ui Customization)

**shadcn/ui Base:**
- Use shadcn/ui components as foundation (accessibility, best practices)
- Customize with Tailwind classes for glassmorphism + soft gamification

**Example Customizations:**
```tsx
// Card with glassmorphism
<Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">

// Primary button - solid color, NO gradients
<Button className="bg-blue-400 hover:bg-blue-500 shadow-md hover:shadow-lg rounded-lg transition-all duration-200">

// Progress bar with glow - solid color, NO gradients
<Progress className="h-2 rounded-full" indicatorClassName="bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
```

**Dark Mode (Future):**
- Invert glassmorphism: dark glass on dark background
- Maintain soft, playful feel (not harsh neon)

---

### Accessibility (WCAG 2.1 AA Compliance)

**Contrast Ratios:**
- Text on background: Minimum 4.5:1 (normal text), 3:1 (large text)
- Glassmorphism: Ensure text remains readable on blurred backgrounds

**Focus States:**
- Visible focus ring: ring-2 ring-primary ring-offset-2
- Keyboard navigation: All interactive elements accessible

**Motion:**
- Respect `prefers-reduced-motion` for animations
- Disable confetti/celebrations if user prefers reduced motion

---

### Design Consistency Checklist

✅ Every card uses glassmorphism (bg-white/80 backdrop-blur-md)
✅ All buttons have rounded corners (rounded-lg minimum)
✅ Animations are smooth (200-400ms, ease-in-out)
✅ Celebrations are playful but brief (2-3 seconds max)
✅ Medical terminology used accurately
✅ Color palette balances soft (playful) with professional (trust)
✅ Typography friendly but readable (Inter + DM Sans)
✅ Generous whitespace throughout (reduce cognitive load)
❌ **NEVER use gradients**

---

**TL;DR for Developers:**
- **Glass cards everywhere:** `bg-white/80 backdrop-blur-md rounded-2xl`
- **Soft shadows:** `shadow-[0_8px_32px_rgba(31,38,135,0.1)]`
- **Smooth animations:** `transition-all duration-200 ease-in-out`
- **Playful but professional:** Friendly language + medical accuracy
- **NEVER use gradients**

---

## Appendix: Related Documents

- **PRD:** `docs/PRD-Americano-2025-10-14.md`
- **Epics:** `docs/epics-Americano-2025-10-14.md`
- **Product Brief:** `docs/product-brief-Americano-2025-10-14.md`
- **Workflow Status:** `docs/bmm-workflow-status.md`

---

## Document Status

**Version:** 1.0
**Date:** 2025-10-14
**Author:** Kevy (with John PM assistance)
**Status:** ✅ COMPLETE - Ready for Development

**Next Step:** START CODING 🚀

No more planning. Build the upload flow this week.

---

## Appendix

### Related Documents

- PRD: `{{prd}}`
- Epics: `{{epics}}`
- Tech Spec: `{{tech_spec}}`
- Architecture: `{{architecture}}`

### Version History

| Date     | Version | Changes               | Author        |
| -------- | ------- | --------------------- | ------------- |
| 2025-10-14 | 1.0     | Initial specification | Kevy |
