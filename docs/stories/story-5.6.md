# Story 5.6: Behavioral Insights Dashboard and Self-Awareness

Status: Done

## Story

As a medical student,
I want to understand my learning patterns and behavioral insights,
So that I can develop better self-awareness and study habits.

## Acceptance Criteria

1. Behavioral insights dashboard showing learning patterns and trends
2. Self-awareness tools helping user understand their learning characteristics
3. Comparison of current patterns with historical performance and improvements
4. Actionable recommendations for study habit optimization
5. Progress tracking for behavioral improvements and learning effectiveness
6. Educational content about learning science and behavioral optimization
7. Goal setting and tracking for behavioral improvements
8. Integration with academic performance to show correlation and impact

## Tasks / Subtasks

### Task 1: Design Comprehensive Insights Dashboard UI (AC: #1, #2, #3)
- [ ] 1.1: Create `/analytics/behavioral-insights` page as central hub
  - Hero section: Personal Learning Intelligence summary card
  - Tab navigation: Patterns, Progress, Goals, Learn (learning science)
  - Real-time update indicators when new insights detected
  - Responsive layout: Desktop (full dashboard), tablet (tabs), mobile (cards)
- [ ] 1.2: Design "Patterns" tab layout
  - Section 1: Current Learning Patterns (cards with icons)
    - Study Time Patterns (clock icon, optimal times highlighted)
    - Session Performance Patterns (chart icon, duration vs effectiveness)
    - Content Preferences (content type breakdown with VARK profile)
    - Attention & Focus Patterns (brain icon, fatigue detection)
  - Section 2: Pattern Evolution Timeline
    - Historical view: How patterns have changed over weeks/months
    - Comparison slider: "You vs. 4 weeks ago"
    - Trend indicators: improving/stable/declining
- [ ] 1.3: Design "Progress" tab layout
  - Section 1: Behavioral Improvement Metrics
    - Study consistency score (days studied / days planned)
    - Focus quality trend (engagement level over time)
    - Retention improvement (personal forgetting curve evolution)
    - Efficiency gains (time to mastery reduction)
  - Section 2: Academic Performance Correlation
    - Chart: Behavioral score vs. exam performance
    - Mission completion rate vs. mastery improvement
    - Insight application impact (before/after comparison)
  - Section 3: Milestone Achievements
    - "Studied at optimal time for 7 consecutive days" (badge)
    - "Increased session duration by 20%" (badge)
    - "Applied 5 behavioral insights successfully" (badge)
- [ ] 1.4: Design "Goals" tab layout
  - Section 1: Active Behavioral Goals
    - Card-based goal display with progress bars
    - Goal types: Study time consistency, session length optimization, content diversification
    - Deadline indicators and reminder settings
  - Section 2: Goal Creation Interface
    - Template-based goals: "Study during optimal hours", "Maintain 45-min sessions", "Try kinesthetic learning"
    - Custom goal builder with target metrics
    - AI-suggested goals based on patterns
  - Section 3: Completed Goals Archive
    - Historical goals with completion dates
    - Success metrics and learnings
- [ ] 1.5: Design "Learn" tab layout (learning science education)
  - Section 1: Your Learning Science Profile
    - "Why you learn best in the morning" (personalized explanation)
    - "How your forgetting curve works" (interactive visualization)
    - "Understanding your learning style" (VARK breakdown with examples)
  - Section 2: Evidence-Based Learning Techniques
    - Spaced repetition science (Ebbinghaus curve)
    - Active recall benefits (retrieval practice)
    - Interleaving vs. blocked practice
    - Cognitive load theory basics
  - Section 3: Recommended Reading & Resources
    - Links to learning science papers
    - Book recommendations (Make It Stick, etc.)
    - Videos explaining learning principles

### Task 2: Build Pattern Visualization Components (AC: #1, #2)
- [ ] 2.1: Create `LearningPatternsGrid` component
  - Grid layout: 2x2 on desktop, 1x4 on mobile
  - Each pattern card:
    - Icon + Pattern name
    - Confidence indicator (0-100% badge)
    - Key insight text (1-2 sentences)
    - "Last detected: 3 days ago" timestamp
    - "View details" link to expanded view
  - Empty state: "Complete 6 weeks of study to unlock patterns"
- [ ] 2.2: Create `PatternDetailModal` component
  - Modal triggered by clicking pattern card
  - Header: Pattern name + confidence score
  - Section 1: Pattern Description (what was detected)
  - Section 2: Evidence (charts/data supporting pattern)
    - Study time pattern: Heatmap of performance by time
    - Session duration: Scatter plot of duration vs. performance
    - Content preference: Bar chart of engagement by content type
  - Section 3: Actionable Recommendations
    - Specific steps to leverage pattern
    - "Apply to settings" button
  - Footer: "Pattern strength: Strong/Moderate/Weak"
- [ ] 2.3: Create `PatternEvolutionTimeline` component
  - Horizontal timeline: Weeks on x-axis
  - Vertical lanes: Different pattern types
  - Markers: Pattern detection events
  - Tooltip: Hover to see pattern details at that time
  - Interactive: Click marker to see full pattern snapshot
  - Comparison mode: "Show changes since last month"
- [ ] 2.4: Create `ComparisonSlider` component
  - Time period selector: "Compare to 2/4/8 weeks ago"
  - Side-by-side metrics display
  - Delta indicators: +15% improvement (green up arrow)
  - Charts: Before/after overlays
  - Key changes highlighted: "You've increased morning study by 40%"
- [ ] 2.5: Create `ConfidenceIndicator` component
  - Visual indicator: Progress circle (0-100%)
  - Color-coded: <60% yellow (weak), 60-80% light green (moderate), >80% dark green (strong)
  - Tooltip: "Confidence based on X sessions over Y weeks"
  - Animated fill on page load

### Task 3: Build Progress Tracking Components (AC: #3, #5, #8)
- [ ] 3.1: Create `BehavioralMetricsCard` component
  - Card design: Metric name, current value, trend indicator
  - Supported metrics:
    - Study consistency: "85% (7/8 days this week)"
    - Focus quality: "High (avg engagement: 82/100)"
    - Retention rate: "78% (improving +5% vs. last month)"
    - Time to mastery: "4.2 days (down from 5.8 days)"
  - Sparkline: Mini chart showing 4-week trend
  - Tooltip: Full explanation of metric calculation
- [ ] 3.2: Create `PerformanceCorrelationChart` component
  - Dual-axis line chart
    - Y-axis left: Behavioral score (composite: consistency + focus + retention)
    - Y-axis right: Academic performance (exam scores, mastery %)
    - X-axis: Time (weeks/months)
  - Correlation coefficient displayed: "r = 0.73 (strong positive)"
  - Interactive: Hover to see exact values at each time point
  - Annotation: Key events (e.g., "Started applying optimal study times")
- [ ] 3.3: Create `MissionImpactAnalysis` component
  - Chart: Mission completion rate vs. mastery improvement over time
  - Statistical analysis: Pearson correlation coefficient
  - Key insight text: "When you complete missions, mastery improves 2.3x faster"
  - Breakdown: Impact by mission type (review, new content, validation)
  - Recommendation: "Prioritize validation missions for biggest impact"
- [ ] 3.4: Create `InsightApplicationTracker` component
  - List of applied insights with before/after metrics
  - Each item:
    - Insight title: "Study during 7-9 AM"
    - Applied date: "2 weeks ago"
    - Impact: "Retention +12%, Focus +18%"
    - Status: "Active" (green) or "Testing" (yellow)
  - Success rate: "4/5 insights improved performance"
  - CTA: "Apply 2 new insights" (link to recommendations)
- [ ] 3.5: Create `MilestoneAchievements` component
  - Badge grid: Icons with labels
  - Badge types:
    - Consistency badges: "7-day streak", "30-day streak"
    - Optimization badges: "Optimal time mastery", "Session length pro"
    - Learning badges: "VARK awareness", "Forgetting curve optimizer"
  - Progress to next badge: "3 days until 7-day streak"
  - Gamification: Share badges (future feature placeholder)

### Task 4: Build Self-Awareness Tools (AC: #2, #6)
- [ ] 4.1: Create `LearningStyleExplorer` component
  - Interactive VARK radar chart (from Story 5.1)
  - Dimension breakdown:
    - Visual: Examples of visual learning (graphs, diagrams)
    - Auditory: Examples of auditory learning (explain-to-patient)
    - Kinesthetic: Examples of hands-on learning (clinical scenarios)
    - Reading/Writing: Examples of text-based learning (notes, summaries)
  - "How to leverage your learning style" section
    - Personalized recommendations per dimension
    - Content type suggestions
    - Study technique tips
  - Learning style quiz option: "Not sure? Take the VARK assessment"
- [ ] 4.2: Create `ForgettingCurveEducation` component
  - Personal forgetting curve overlay on standard Ebbinghaus curve
  - Key parameters displayed:
    - R₀: Initial retention (e.g., 92%)
    - k: Decay rate (e.g., 0.18)
    - Half-life: Days to 50% retention (e.g., 3.9 days)
  - Comparison text: "Your retention decays 15% faster than average"
  - Actionable insight: "Review critical concepts every 3 days (not 7 days)"
  - Interactive: Adjust review frequency, see predicted retention
  - Educational tooltip: "What is the forgetting curve?" with explanation
- [ ] 4.3: Create `StudyTimeOptimizationGuide` component
  - Heatmap: Time-of-day performance (from Story 5.1)
  - Personal optimal windows highlighted
  - Explanation: "Why you perform better in the morning"
    - Circadian rhythm factors
    - Cognitive peak times
    - Energy level patterns
  - Experiment suggestions: "Try studying at 8 PM for 1 week to verify"
  - Calendar integration preview: "Your optimal study schedule"
- [ ] 4.4: Create `CognitiveLoadInsights` component
  - Current cognitive load indicator: Low/Medium/High
  - Factors contributing to load:
    - Session duration relative to optimal
    - Content difficulty vs. current capacity
    - Time of day effectiveness
    - Recent study intensity
  - Load management tips:
    - When to take breaks
    - When to switch content types
    - When to stop for the day
  - Historical load patterns: "You typically overload on Sundays"
- [ ] 4.5: Create `MetacognitionPrompts` component
  - Reflective questions to build self-awareness:
    - "How confident are you in your current knowledge?"
    - "What study technique worked best today?"
    - "Did you study at your optimal time?"
  - Journaling interface: Short text input
  - Pattern detection from journal entries (future: sentiment analysis)
  - Reflection history: Past insights revisited

### Task 5: Implement Recommendations Engine (AC: #4)
- [ ] 5.1: Create `RecommendationsEngine` class
  - Method: `generateRecommendations(userId): Recommendation[]`
  - Method: `prioritizeRecommendations(recommendations): Recommendation[]`
  - Method: `trackRecommendationEffectiveness(userId, recommendationId, applied, outcome): void`
- [ ] 5.2: Implement recommendation generation logic
  - Input: UserLearningProfile, BehavioralPattern[], recent performance
  - Recommendation types:
    - **Time Optimization:** "Study during X-Y (your peak hours)"
    - **Duration Adjustment:** "Shorten sessions to 45 min (your optimal)"
    - **Content Diversification:** "Try more clinical scenarios (kinesthetic preference)"
    - **Retention Strategy:** "Review 20% more frequently (faster forgetting curve)"
    - **Consistency Building:** "Set study time alarm for 7 AM"
    - **Experiment Suggestions:** "Test afternoon study for 1 week to explore new patterns"
  - Template-based with personalized data insertion
  - Minimum confidence threshold: 0.7 to generate recommendation
- [ ] 5.3: Implement prioritization algorithm
  - Scoring factors:
    - Pattern confidence (30%): Higher confidence = higher priority
    - Potential impact (40%): Estimated performance improvement
    - Ease of implementation (20%): How easy to apply
    - User readiness (10%): Based on past application success
  - Sort by score descending
  - Limit to top 5 active recommendations per user
  - Diversify: Include at least 1 from each category (time, duration, content, retention)
- [ ] 5.4: Implement effectiveness tracking
  - When user applies recommendation:
    - Create `AppliedRecommendation` record
    - Track baseline metrics (before application)
    - Monitor metrics for 2 weeks post-application
    - Calculate outcome: improved/neutral/declined
  - Update recommendation engine with effectiveness data
  - Use for future prioritization (boost successful types, lower failed types)

### Task 6: Build Recommendations UI (AC: #4)
- [ ] 6.1: Create `RecommendationsPanel` component
  - Header: "Personalized Recommendations for You"
  - Card-based layout: Top 5 recommendations
  - Each card:
    - Icon (clock for time, ruler for duration, etc.)
    - Title: "Study during your peak hours"
    - Description: "You perform 30% better between 7-9 AM"
    - Confidence badge: "High confidence (85%)"
    - Estimated impact: "+12% retention improvement"
    - Actions: "Apply Now" button, "Learn More" link, "Dismiss" icon
  - Empty state: "Complete more study sessions to unlock recommendations"
- [ ] 6.2: Implement "Apply Now" functionality
  - Modal: "How would you like to apply this?"
  - Options:
    - Update settings automatically (e.g., set preferredStudyTimes)
    - Set reminder/notification
    - Add to behavioral goals
    - Manual application (just track)
  - Confirmation: "Recommendation applied! We'll track your progress."
  - Create AppliedRecommendation record
  - Update relevant settings/preferences
- [ ] 6.3: Create `RecommendationDetailModal` component
  - Header: Recommendation title + confidence
  - Section 1: Why This Recommendation
    - Explanation of underlying pattern
    - Evidence: Charts/data supporting recommendation
  - Section 2: How to Apply
    - Step-by-step instructions
    - Example: "Set alarm for 7 AM, plan first mission at 7:15 AM"
  - Section 3: Expected Outcomes
    - Predicted performance improvement
    - Timeline: "You should see results in 1-2 weeks"
  - Section 4: Research & Science
    - Link to learning science principles
    - Evidence: "Studies show morning study improves retention by 15%"
  - Footer: "Apply" and "Save for Later" buttons
- [ ] 6.4: Create `AppliedRecommendationsTracker` component
  - List of recommendations user has applied
  - Each item:
    - Recommendation title
    - Applied date: "2 weeks ago"
    - Progress indicator: "Testing (2/14 days)"
    - Current metrics vs. baseline
    - Impact assessment: "On track for +10% improvement"
  - Filter: Active, Completed, Dismissed
  - Success rate: "80% of applied recommendations improved performance"

### Task 7: Implement Goal Setting System (AC: #7)
- [ ] 7.1: Create `BehavioralGoal` model
  - Fields:
    - `id`, `userId`, `goalType`, `title`, `description`
    - `targetMetric` (e.g., "studyConsistency", "sessionDuration", "retentionRate")
    - `currentValue`, `targetValue`, `unit` (e.g., "days", "minutes", "%")
    - `startDate`, `deadline`, `completedAt`
    - `status`: "active", "completed", "abandoned"
    - `progressHistory` (JSON): Array of { date, value } checkpoints
    - `linkedRecommendationId` (if created from recommendation)
  - Relations: User, linked BehavioralInsight/Recommendation
- [ ] 7.2: Run Prisma migration for BehavioralGoal model
- [ ] 7.3: Create `GoalManager` class
  - Method: `createGoal(userId, goalData): BehavioralGoal`
  - Method: `updateGoalProgress(goalId, currentValue): void`
  - Method: `checkGoalCompletion(goalId): boolean`
  - Method: `suggestGoals(userId): GoalSuggestion[]`
- [ ] 7.4: Implement goal suggestion logic
  - Based on BehavioralPattern and UserLearningProfile:
    - If optimal study time detected → "Study during peak hours 5/7 days"
    - If session duration suboptimal → "Maintain 45-min sessions for 2 weeks"
    - If learning style skewed → "Try 30% kinesthetic content this month"
    - If forgetting curve steep → "Increase review frequency by 20%"
  - Templates with personalized values
  - Limit to 3 suggested goals at a time
- [ ] 7.5: Implement automated progress tracking
  - Daily job: Update goal progress based on recent study sessions
  - For "study consistency" goal:
    - Check if user studied on days covered by goal
    - Update currentValue (days studied / days elapsed)
  - For "session duration" goal:
    - Check if sessions matched target duration (±10% tolerance)
    - Update currentValue (successful sessions / total sessions)
  - For "retention rate" goal:
    - Calculate recent retention from review data
    - Update currentValue (current retention rate)
  - Trigger completion check after each update
- [ ] 7.6: Implement goal completion logic
  - Check if currentValue >= targetValue
  - If completed:
    - Set status = "completed"
    - Set completedAt timestamp
    - Generate completion notification
    - Award achievement badge if applicable
    - Create new BehavioralInsight celebrating success
  - If deadline passed without completion:
    - Set status = "expired"
    - Generate reflection prompt: "What blocked you from achieving this goal?"

### Task 8: Build Goal Setting UI (AC: #7)
- [ ] 8.1: Create `BehavioralGoalsSection` component (for Goals tab)
  - Active goals grid: 3 columns on desktop, 1 on mobile
  - Each goal card:
    - Goal title + target
    - Progress bar with percentage
    - Current vs. target values
    - Deadline countdown: "5 days remaining"
    - Status indicator: On track (green) / At risk (yellow) / Behind (red)
  - "Create New Goal" button
  - Empty state: "No active goals. Create your first behavioral goal!"
- [ ] 8.2: Create `GoalCreationModal` component
  - Step 1: Choose goal type
    - Template goals (from suggestions)
    - Custom goal builder
  - Step 2: Set target and deadline
    - Metric selector (study consistency, session duration, etc.)
    - Target value input with unit
    - Deadline date picker (max 90 days)
  - Step 3: Personalization
    - Reminders: Daily/weekly check-in notifications
    - Tracking preferences: Automatic vs. manual progress updates
  - Step 4: Confirmation
    - Goal summary review
    - "Start Goal" button
- [ ] 8.3: Create `GoalDetailView` component
  - Header: Goal title, status badge, deadline
  - Section 1: Progress Overview
    - Large progress circle (percentage complete)
    - Current value vs. target value
    - Days elapsed / total days
  - Section 2: Progress History Chart
    - Line chart: Progress over time
    - Milestones marked: 25%, 50%, 75% completion
    - Trend line: On track for completion?
  - Section 3: Recent Activity
    - Log of relevant study sessions contributing to goal
    - Daily check-ins or manual progress updates
  - Section 4: Actions
    - "Update Progress" (if manual tracking)
    - "Edit Goal" (adjust target or deadline)
    - "Mark Complete" (manual completion)
    - "Abandon Goal" (with confirmation)
- [ ] 8.4: Create `GoalProgressUpdateModal` component
  - For manual progress updates
  - Input: Current value (e.g., "How many days did you study this week?")
  - Optional note: "What helped or hindered progress?"
  - Save → Update BehavioralGoal.progressHistory
  - Show updated progress immediately
- [ ] 8.5: Create `CompletedGoalsArchive` component
  - List of completed goals with completion dates
  - Each item:
    - Goal title + target
    - Completion date: "Completed 2 weeks ago"
    - Final metrics: "Achieved 95% of target"
    - Impact summary: "Retention improved by 15% during this goal"
  - Filter by goal type and completion date
  - "Set Similar Goal" quick action

### Task 9: Build Learning Science Education Content (AC: #6)
- [ ] 9.1: Create `LearningPrinciples` content library
  - Article 1: "Spaced Repetition: The Science Behind Americano's FSRS System"
    - Ebbinghaus forgetting curve explanation
    - Why spacing works (memory consolidation)
    - How Americano implements it
    - Your personal forgetting curve comparison
  - Article 2: "Active Recall: Why Testing Beats Re-Reading"
    - Retrieval practice benefits
    - How validation prompts leverage active recall
    - Studies: Testing effect research
  - Article 3: "Understanding Your Learning Style (VARK)"
    - What VARK measures
    - Your personal VARK profile
    - How to leverage each dimension
    - Limitations of learning styles (research nuance)
  - Article 4: "Cognitive Load Theory for Medical Students"
    - What is cognitive load
    - Intrinsic vs. extrinsic load
    - How Americano manages load (session orchestration)
    - Tips for reducing cognitive overload
  - Article 5: "Optimal Study Timing and Circadian Rhythms"
    - Why time of day matters
    - Peak cognitive hours research
    - Your personal optimal times
    - How to align study schedule with circadian rhythm
- [ ] 9.2: Create `LearningPrincipleCard` component
  - Card design: Title, summary, read time, read status
  - Thumbnail: Icon representing principle
  - "Read Article" action → Opens article view
  - Progress indicator: "3/5 articles read"
- [ ] 9.3: Create `ArticleViewer` component
  - Full-screen article view with rich text content
  - Sections: Introduction, Science, Application, Your Data
  - "Your Data" section: Personalized insights from user's patterns
    - For spaced repetition article: Show personal forgetting curve
    - For VARK article: Display user's VARK profile
    - For study timing article: Show optimal time heatmap
  - Interactive elements: Charts, diagrams, videos (embeds)
  - References section: Links to academic papers
  - Actions: Bookmark, share, "Apply to my study" (link to recommendations)
- [ ] 9.4: Create `ResourceLibrary` component
  - External resources section:
    - Books: "Make It Stick" by Brown et al., "Learning How to Learn" by Oakley
    - Videos: Coursera course links, YouTube explainers
    - Papers: Key research studies (open access links)
  - Each resource:
    - Title, author, type (book/video/paper)
    - Brief description
    - "Why this matters" relevance note
    - External link
- [ ] 9.5: Implement content recommendation system
  - Based on user's patterns and goals:
    - If steep forgetting curve → Recommend spaced repetition article
    - If inconsistent study times → Recommend circadian rhythm article
    - If low engagement → Recommend cognitive load article
  - "Recommended for You" section at top of Learn tab
  - Track which articles user reads, suggest related content

### Task 10: Build Performance Correlation Analysis (AC: #8)
- [ ] 10.1: Create `AcademicPerformanceIntegration` service
  - Method: `trackExamPerformance(userId, examId, score): void`
  - Method: `calculateBehavioralScore(userId, dateRange): number`
  - Method: `correlatePerformance(userId, minWeeks = 8): CorrelationResult`
- [ ] 10.2: Implement behavioral score calculation
  - Composite score from multiple factors:
    - Study consistency (25%): Days studied / days planned
    - Session quality (25%): Avg engagement level and performance
    - Mission completion (20%): Completion rate
    - Insight application (15%): % of recommendations applied
    - Retention rate (15%): Avg retention from reviews
  - Scale to 0-100
  - Calculate for specified date range (week, month, semester)
- [ ] 10.3: Implement correlation analysis
  - Collect time-series data:
    - Weekly behavioral scores
    - Exam scores (when available)
    - Mission completion rates
    - Mastery percentages from reviews
  - Calculate Pearson correlation coefficient:
    - Behavioral score vs. exam performance
    - Mission completion vs. mastery improvement
    - Insight application vs. retention rate
  - Statistical significance: p-value calculation
  - Generate insights: "Strong positive correlation (r=0.78, p<0.01)"
- [ ] 10.4: Create `PerformanceCorrelationDashboard` component
  - Section 1: Correlation Strength Indicator
    - Large number: "r = 0.73" (correlation coefficient)
    - Interpretation: "Strong positive correlation"
    - Explanation: "Your behavioral improvements predict 73% of grade variance"
  - Section 2: Dual-Axis Chart
    - Line 1: Behavioral score over time (green)
    - Line 2: Academic performance over time (blue)
    - X-axis: Weeks/months
    - Hover: Exact values at each point
  - Section 3: Key Insights
    - "When you improve behavioral score by 10 points, grades increase by 5%"
    - "Your best exam (92%) followed 3 weeks of high behavioral consistency"
    - "Mission completion correlates most strongly with retention (r=0.81)"
  - Section 4: Actionable Recommendations
    - Based on correlation data:
      - "Focus on mission completion for biggest grade impact"
      - "Your study consistency directly predicts exam success"
- [ ] 10.5: Create `MissionMasteryCorrelation` component
  - Scatter plot: Mission completion rate (x-axis) vs. Mastery improvement (y-axis)
  - Each point: One week of data
  - Color-coded: Recent weeks (darker), older weeks (lighter)
  - Trend line: Linear regression
  - Key finding: "2.3x faster mastery when completing missions"
  - Interactive: Click point to see that week's details

### Task 11: Build Notification System for Insights (AC: #1, #4)
- [ ] 11.1: Create `InsightNotification` model
  - Fields: `id`, `userId`, `notificationType`, `title`, `message`, `actionUrl`, `read`, `createdAt`
  - Types: NEW_PATTERN, NEW_RECOMMENDATION, GOAL_PROGRESS, GOAL_ACHIEVED, MILESTONE
- [ ] 11.2: Implement notification generation logic
  - Trigger: New BehavioralPattern detected (confidence >= 0.7)
    - Create notification: "We've discovered a new learning pattern for you"
  - Trigger: New Recommendation available
    - Create notification: "New personalized recommendation ready"
  - Trigger: Goal progress milestone (25%, 50%, 75%)
    - Create notification: "You're 50% of the way to your goal!"
  - Trigger: Goal completed
    - Create notification: "Congratulations! Goal achieved"
  - Trigger: Achievement badge earned
    - Create notification: "New badge unlocked: 7-day study streak"
- [ ] 11.3: Create `NotificationBell` component
  - Bell icon in top navigation bar
  - Badge: Count of unread notifications
  - Dropdown on click:
    - List of recent notifications (max 10)
    - Each item: Icon, title, timestamp, read status
    - "Mark all as read" action
    - "View all notifications" link to full list
- [ ] 11.4: Create `/notifications` page
  - Filter tabs: All, Patterns, Recommendations, Goals
  - Notification list: Grouped by date (Today, Yesterday, This Week, Older)
  - Each notification card:
    - Icon + title + message
    - Timestamp
    - Action button (e.g., "View Insight", "Apply Recommendation")
    - Mark as read/unread toggle
  - Pagination for older notifications
- [ ] 11.5: Implement in-app notification toasts
  - Toast for high-priority events:
    - Goal achieved (celebratory animation)
    - New high-confidence recommendation (>0.85)
    - Major pattern change detected
  - Auto-dismiss after 5 seconds
  - Action button in toast for quick access
  - User setting: Enable/disable toast notifications

### Task 12: Build API Endpoints (AC: All)
- [ ] 12.1: Create GET `/api/analytics/behavioral-insights/dashboard` endpoint
  - Returns comprehensive dashboard data:
    - `patterns`: Recent BehavioralPattern[] (top 5)
    - `recommendations`: Active Recommendation[] (top 5)
    - `goals`: Active BehavioralGoal[] with progress
    - `metrics`: Current behavioral metrics (consistency, focus, retention)
    - `correlationData`: Performance correlation stats
  - Cache for 1 hour (refresh on new pattern detection)
- [ ] 12.2: Create GET `/api/analytics/behavioral-insights/patterns/evolution` endpoint
  - Query params: `weeks` (default 12), `patternType?`
  - Returns time-series data: Array of { week, patterns[] }
  - Includes pattern confidence evolution
  - Used by PatternEvolutionTimeline component
- [ ] 12.3: Create GET `/api/analytics/behavioral-insights/progress` endpoint
  - Returns progress metrics:
    - `behavioralScore`: Current composite score
    - `trends`: { consistency, focus, retention, efficiency } with deltas
    - `milestones`: Achievement[] recently unlocked
    - `appliedInsights`: Impact data for applied recommendations
- [ ] 12.4: Create GET `/api/analytics/behavioral-insights/recommendations` endpoint
  - Query params: `includeApplied` (default false), `limit` (default 5)
  - Returns Recommendation[] sorted by priority
  - Includes confidence, estimated impact, recommendation text
- [ ] 12.5: Create POST `/api/analytics/behavioral-insights/recommendations/:id/apply` endpoint
  - Body: `{ applicationType: "auto" | "manual", settings?: {} }`
  - Creates AppliedRecommendation record
  - Updates user settings if applicationType === "auto"
  - Returns: `{ success: true, updatedSettings, trackingId }`
- [ ] 12.6: Create POST `/api/analytics/behavioral-insights/goals` endpoint
  - Body: `{ goalType, targetMetric, targetValue, deadline, title?, description? }`
  - Creates new BehavioralGoal
  - Returns: `{ goal: BehavioralGoal }`
- [ ] 12.7: Create PATCH `/api/analytics/behavioral-insights/goals/:id/progress` endpoint
  - Body: `{ currentValue, note? }`
  - Updates goal progress history
  - Checks for completion
  - Returns: `{ goal: BehavioralGoal, completed: boolean }`
- [ ] 12.8: Create GET `/api/analytics/behavioral-insights/goals/:id` endpoint
  - Returns full goal details with progress history
  - Includes recent activity log (related study sessions)
- [ ] 12.9: Create GET `/api/analytics/behavioral-insights/correlation` endpoint
  - Query params: `weeks` (default 12), `metric` ("behavioral" | "mission")
  - Returns correlation analysis:
    - `coefficient`: Pearson r value
    - `pValue`: Statistical significance
    - `interpretation`: Text explanation
    - `timeSeriesData`: Array of { date, behavioralScore, academicScore }
- [ ] 12.10: Create GET `/api/analytics/behavioral-insights/learning-science/:articleId` endpoint
  - Returns article content with personalized data sections
  - Fetches user's relevant patterns for "Your Data" sections
  - Marks article as read when accessed

### Task 13: Implement Data Export and Privacy (AC: #2)
- [ ] 13.1: Create export functionality for behavioral insights
  - Export format: JSON
  - Includes:
    - UserLearningProfile
    - BehavioralPattern[]
    - BehavioralInsight[] (including applied recommendations)
    - BehavioralGoal[] (active and completed)
    - Progress history data
  - API endpoint: GET `/api/analytics/behavioral-insights/export`
  - Response: JSON file download
- [ ] 13.2: Extend settings page with behavioral insights controls
  - Section: "Behavioral Insights & Privacy"
  - Toggle: "Enable behavioral pattern detection" (default ON)
  - Toggle: "Show insights notifications" (default ON)
  - Toggle: "Share anonymized patterns for research" (default OFF, future feature)
  - Button: "Export my behavioral insights" (JSON download)
  - Button: "Delete all behavioral insights" (with confirmation dialog)
- [ ] 13.3: Implement deletion functionality
  - DELETE `/api/analytics/behavioral-insights/clear` endpoint
  - Cascading delete:
    - All BehavioralPattern records
    - All BehavioralInsight records
    - All BehavioralGoal records
    - UserLearningProfile record
    - AppliedRecommendation records
  - Keep raw BehavioralEvent records (for potential reanalysis if user re-enables)
  - Confirmation required: User must type "DELETE MY INSIGHTS" to proceed
- [ ] 13.4: Implement privacy-respecting analytics
  - All behavioral data strictly personal (never shared or aggregated without consent)
  - No external tracking services for behavioral analytics
  - FERPA compliance: User owns all learning data
  - Transparent data usage: Clear explanations of what's tracked and why

### Task 14: Testing and Validation (AC: All)
- [ ] 14.1: Manual testing with real behavioral data (12+ weeks)
  - Verify dashboard displays correctly with full data
  - Test pattern evolution timeline with historical patterns
  - Validate recommendations are actionable and accurate
  - Test goal creation, progress tracking, and completion
  - Check correlation analysis with real exam scores
- [ ] 14.2: Test UI components across devices
  - Desktop: Full dashboard layout (1920x1080, 1440x900)
  - Tablet: Tab-based navigation (iPad, 768px)
  - Mobile: Card-based layout (iPhone, 375px)
  - Verify all charts render correctly
  - Test touch interactions (sliders, modals)
- [ ] 14.3: Test recommendation application flow
  - Apply recommendation → Verify settings updated
  - Track recommendation effectiveness → Verify metrics change
  - Test "before/after" comparison in AppliedRecommendationsTracker
  - Validate impact statistics
- [ ] 14.4: Test goal system end-to-end
  - Create goal from template → Verify goal created
  - Track progress automatically → Verify progress updates
  - Complete goal → Verify completion notification and badge
  - Create custom goal → Verify validation and creation
- [ ] 14.5: Test learning science education content
  - Read articles → Verify personalized data sections
  - Check resource links → Verify external links work
  - Test content recommendation → Verify relevant articles suggested
- [ ] 14.6: Test notifications
  - New pattern detected → Verify notification created
  - New recommendation → Verify notification shown
  - Goal milestone → Verify toast appears
  - Mark as read → Verify badge count updates
- [ ] 14.7: Test data export and privacy
  - Export insights → Verify JSON completeness
  - Toggle pattern detection OFF → Verify analysis stops
  - Delete all insights → Verify cascading deletion
  - Re-enable pattern detection → Verify reanalysis works
- [ ] 14.8: Integration testing
  - Verify insights integrate with mission generation (Story 2.4)
  - Test correlation analysis with real exam data
  - Validate pattern evolution reflects actual behavior changes
  - Test automated weekly insights generation

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic5/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics & Personalization (lines 604-648)
  - Story 5.6 builds on the behavioral modeling foundation from Stories 5.1-5.5
  - This is the USER-FACING story that makes all Epic 5 insights visible and actionable

- **PRD:** `/Users/kyin/Projects/Americano-epic5/docs/PRD-Americano-2025-10-14.md`
  - Epic 5: Behavioral Learning Twin (lines 450-468)
  - UX Principle #9: Personal Learning Reflection (line 369)
  - UX Principle #10: Trust Through Transparency (line 373)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic5/docs/epics-Americano-2025-10-14.md`
  - Story 5.6 Details: Lines 808-829
  - Epic 5 Goals: Creating strongest competitive moat through personalized data (lines 674-695)

### Database Schema Extensions

**Create `BehavioralGoal` model:**
```prisma
model BehavioralGoal {
  id                    String         @id @default(cuid())
  userId                String
  goalType              GoalType
  title                 String
  description           String?        @db.Text
  targetMetric          String         // "studyConsistency", "sessionDuration", "retentionRate"
  currentValue          Float
  targetValue           Float
  unit                  String         // "days", "minutes", "%", "score"
  startDate             DateTime       @default(now())
  deadline              DateTime
  completedAt           DateTime?
  status                GoalStatus     @default(ACTIVE)
  progressHistory       Json           // Array of { date, value } checkpoints
  linkedRecommendationId String?       // If created from recommendation

  // Relations
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([deadline])
  @@map("behavioral_goals")
}

enum GoalType {
  STUDY_TIME_CONSISTENCY    // Study at optimal times regularly
  SESSION_DURATION          // Maintain optimal session length
  CONTENT_DIVERSIFICATION   // Try different content types
  RETENTION_IMPROVEMENT     // Improve retention rate
  CUSTOM                    // User-defined goal
}

enum GoalStatus {
  ACTIVE      // In progress
  COMPLETED   // Successfully completed
  EXPIRED     // Deadline passed without completion
  ABANDONED   // User manually abandoned
}
```

**Create `Recommendation` model:**
```prisma
model Recommendation {
  id                    String              @id @default(cuid())
  userId                String
  recommendationType    RecommendationType
  title                 String
  description           String              @db.Text
  actionableText        String              @db.Text  // Specific action to take
  confidence            Float               // 0.0-1.0
  estimatedImpact       String?             // "+12% retention improvement"
  supportingPatternIds  String[]            // BehavioralPattern IDs
  createdAt             DateTime            @default(now())
  dismissedAt           DateTime?
  appliedAt             DateTime?

  // Relations
  appliedRecords        AppliedRecommendation[]

  @@index([userId])
  @@index([createdAt])
  @@index([appliedAt])
  @@map("recommendations")
}

enum RecommendationType {
  TIME_OPTIMIZATION           // When to study
  DURATION_ADJUSTMENT        // How long to study
  CONTENT_PREFERENCE         // What to study (content type)
  RETENTION_STRATEGY         // How to improve retention
  CONSISTENCY_BUILDING       // Build study habits
  EXPERIMENT_SUGGESTION      // Try something new
}
```

**Create `AppliedRecommendation` model:**
```prisma
model AppliedRecommendation {
  id                    String         @id @default(cuid())
  userId                String
  recommendationId      String
  appliedAt             DateTime       @default(now())
  applicationType       ApplicationType
  settingsUpdated       Json?          // What settings were changed

  // Effectiveness tracking
  baselineMetrics       Json           // Metrics before application
  testPeriodWeeks       Int            @default(2)
  outcomeStatus         OutcomeStatus  @default(TESTING)
  finalMetrics          Json?          // Metrics after test period
  impactAssessment      String?        // "improved", "neutral", "declined"

  // Relations
  recommendation        Recommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([appliedAt])
  @@map("applied_recommendations")
}

enum ApplicationType {
  AUTO    // Settings updated automatically
  MANUAL  // User applied manually
}

enum OutcomeStatus {
  TESTING     // Still in test period
  IMPROVED    // Metrics improved
  NEUTRAL     // No significant change
  DECLINED    // Metrics declined
}
```

**Create `InsightNotification` model:**
```prisma
model InsightNotification {
  id                    String              @id @default(cuid())
  userId                String
  notificationType      NotificationType
  title                 String
  message               String              @db.Text
  actionUrl             String?             // Link to relevant page
  priority              NotificationPriority @default(NORMAL)
  read                  Boolean             @default(false)
  createdAt             DateTime            @default(now())

  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@map("insight_notifications")
}

enum NotificationType {
  NEW_PATTERN              // New behavioral pattern detected
  NEW_RECOMMENDATION       // New recommendation available
  GOAL_PROGRESS           // Goal milestone reached
  GOAL_ACHIEVED           // Goal completed
  MILESTONE_UNLOCKED      // Achievement badge earned
  PATTERN_CHANGED         // Significant pattern evolution
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
}
```

**Create `LearningArticle` model:**
```prisma
model LearningArticle {
  id                    String         @id @default(cuid())
  slug                  String         @unique  // "spaced-repetition-science"
  title                 String
  summary               String         @db.Text
  content               String         @db.Text  // Markdown content
  category              ArticleCategory
  readTimeMinutes       Int
  relatedPatternTypes   String[]       // Which pattern types this article relates to
  externalResources     Json           // Array of { title, url, type }
  publishedAt           DateTime       @default(now())

  // Relations
  readByUsers           ArticleRead[]

  @@index([category])
  @@map("learning_articles")
}

enum ArticleCategory {
  SPACED_REPETITION
  ACTIVE_RECALL
  LEARNING_STYLES
  COGNITIVE_LOAD
  CIRCADIAN_RHYTHMS
  METACOGNITION
  MEMORY_CONSOLIDATION
}
```

**Create `ArticleRead` model:**
```prisma
model ArticleRead {
  id                    String         @id @default(cuid())
  userId                String
  articleId             String
  readAt                DateTime       @default(now())

  // Relations
  article               LearningArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
  @@index([userId])
  @@map("article_reads")
}
```

### Key Components and Features

**Dashboard Structure:**
1. **Patterns Tab:** Visualization of detected learning patterns, evolution timeline, comparison tools
2. **Progress Tab:** Behavioral metrics, academic performance correlation, milestone achievements
3. **Goals Tab:** Active goals, goal creation, completed goals archive
4. **Learn Tab:** Learning science education, personalized explanations, resource library

**Core Features:**
1. **Pattern Visualization:** Heatmaps, charts, confidence indicators, pattern evolution
2. **Recommendations Engine:** AI-generated suggestions with impact estimates and application tracking
3. **Goal System:** Template-based and custom goals with automated progress tracking
4. **Learning Science Education:** Personalized articles explaining why behavioral insights matter
5. **Performance Correlation:** Statistical analysis showing behavioral improvements predict academic success
6. **Notification System:** Timely alerts for new insights, goal progress, achievements

### Integration Points

**With Story 5.1 (Learning Pattern Recognition):**
- Uses BehavioralPattern, UserLearningProfile, and BehavioralInsight models
- Displays patterns detected by Story 5.1 analyzers
- Shows study time heatmaps, learning style profiles, forgetting curves

**With Story 2.6 (Mission Analytics):**
- Correlates mission completion with mastery improvement
- Shows mission impact on academic performance
- Uses mission analytics for goal progress tracking

**With Story 2.4 (Mission Generation):**
- Recommendations can update mission generation preferences
- Applied insights influence future mission scheduling
- Goal achievements trigger mission adjustments

**With Story 1.6 (Study Session Management):**
- Session performance data feeds behavioral metrics
- Study consistency tracked from session history

**With Story 4.6 (Understanding Analytics):**
- Comprehension metrics integrated into behavioral score
- Validation performance correlates with retention insights

### Educational Content Strategy

**Learning Science Articles (5 core articles):**
1. **Spaced Repetition Science:** Explains Ebbinghaus curve, personal forgetting curve comparison
2. **Active Recall Benefits:** Retrieval practice research, validation prompt effectiveness
3. **VARK Learning Styles:** User's profile, how to leverage each dimension, research nuance
4. **Cognitive Load Theory:** Intrinsic vs. extrinsic load, session orchestration strategies
5. **Circadian Rhythms:** Time-of-day performance, optimal study windows, energy patterns

**External Resources:**
- Books: "Make It Stick" (Brown et al.), "Learning How to Learn" (Oakley & Sejnowski)
- Videos: Coursera "Learning How to Learn", YouTube learning science channels
- Papers: Key research studies with open access links

**Personalization:**
- Each article includes "Your Data" section with user's specific patterns
- Recommendations based on user's current challenges
- Interactive visualizations with user's real data

### UX/UI Design Considerations

**Design System Compliance:**
- Glassmorphism: `bg-white/80 backdrop-blur-md` for all cards
- OKLCH colors: NO gradients, use perceptually uniform OKLCH color space
- Charts: Recharts library with OKLCH color palette
- Icons: Lucide React (consistent with rest of app)
- Responsive: Desktop (full dashboard), tablet (tabs), mobile (cards)

**Visualization Libraries:**
- **Recharts:** Line charts, bar charts, scatter plots, radar charts (VARK profile)
- **D3.js (if needed):** Heatmaps, force-directed graphs (pattern evolution timeline)
- **Custom components:** Progress circles, confidence indicators, metric cards

**Accessibility:**
- All charts include ARIA labels and text alternatives
- Color-blind friendly palette (use patterns/textures in addition to color)
- Keyboard navigation for all interactive elements
- Screen reader support for data visualizations

**User Flow:**
1. User has 12+ weeks of study data, patterns detected
2. User receives notification: "3 new behavioral insights ready"
3. User clicks notification → Navigates to `/analytics/behavioral-insights`
4. Dashboard loads with Patterns tab active
5. User explores detected patterns, views evolution timeline
6. User switches to Progress tab, sees academic correlation
7. User switches to Goals tab, creates goal from template
8. User switches to Learn tab, reads spaced repetition article
9. User sees personalized forgetting curve in article
10. User applies recommendation: "Study during 7-9 AM"
11. User tracks goal progress over 2 weeks
12. User sees improvement in behavioral metrics
13. User receives goal achievement notification

### Performance Considerations

1. **Dashboard Loading:** Lazy load tabs (only load active tab content)
2. **Charts:** Implement virtualization for large datasets (>100 points)
3. **Data Caching:** Cache dashboard data for 1 hour, invalidate on new pattern detection
4. **API Pagination:** Limit notifications list to 20 per page
5. **Image Optimization:** Use Next.js Image component for article thumbnails

### Testing Strategy

**Manual Testing (MVP Approach):**
1. Generate 12+ weeks of behavioral data with diverse patterns
2. Trigger pattern analysis to populate dashboard
3. Test each tab: Patterns, Progress, Goals, Learn
4. Create goal, track progress, complete goal
5. Apply recommendation, verify settings updated
6. Read learning science articles, verify personalized sections
7. Test on desktop, tablet, mobile devices
8. Verify notifications appear correctly
9. Test data export and privacy controls

**Edge Cases:**
- User with <6 weeks data (show "insufficient data" messaging)
- User with no detected patterns (confidence too low)
- User disables behavioral analysis (dashboard shows disabled state)
- User has no exam scores (correlation analysis not available)
- User completes all goals (show "Create new goal" CTA)

### References

- **Source:** Epic 5, Story 5.6 (epics-Americano-2025-10-14.md:808-829)
- **Source:** Story 5.1 Implementation (story-5.1.md) - Patterns, analyzers, learning profile
- **Source:** PRD UX Principles #9 and #10 (PRD-Americano-2025-10-14.md:369-373)
- **Source:** Solution Architecture Subsystem 5 (solution-architecture.md:604-648)
- **Learning Science:** Ebbinghaus Forgetting Curve, VARK Framework, Cognitive Load Theory
- **Design Reference:** AGENTS.MD design system (OKLCH colors, no gradients, glassmorphism)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
