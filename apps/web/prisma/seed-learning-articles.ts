/**
 * Seed Learning Science Articles
 * Story 5.6: Behavioral Insights Dashboard - Task 11 (Learning Science Education)
 *
 * Seeds 5 core learning science articles with personalized sections:
 * 1. Spaced Repetition Science
 * 2. Active Recall Benefits
 * 3. VARK Learning Styles
 * 4. Cognitive Load Theory
 * 5. Circadian Rhythms & Optimal Timing
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

const articles = [
  {
    slug: 'spaced-repetition-science',
    title: 'The Science of Spaced Repetition: Why Timing Matters',
    category: 'SPACED_REPETITION',
    summary: 'Learn how the Ebbinghaus forgetting curve explains why spacing your reviews leads to better long-term retention.',
    content: `# The Science of Spaced Repetition

## What is Spaced Repetition?

Spaced repetition is a learning technique that involves reviewing information at increasing intervals. Instead of cramming everything in one session, you revisit material just as you're about to forget it.

## The Ebbinghaus Forgetting Curve

In 1885, psychologist Hermann Ebbinghaus discovered that we forget information exponentially over time. Without review:
- **20 minutes later**: You retain about 58% of what you learned
- **1 hour later**: 44% remains
- **1 day later**: 33% remains
- **1 week later**: Only 25% remains

The forgetting curve shows that **retention decays exponentially** unless you actively review the material.

## How Spaced Repetition Works

The key insight: **Reviewing just before you forget strengthens memory more effectively than reviewing when you still remember.**

Each successful review:
1. **Slows down the forgetting curve**
2. **Increases the optimal interval** until the next review
3. **Strengthens long-term retention**

### Optimal Spacing Intervals

Research suggests these intervals for maximum retention:
- **1st review**: 1 day after learning
- **2nd review**: 3 days after first review
- **3rd review**: 7 days after second review
- **4th review**: 14 days after third review
- **5th review**: 30 days after fourth review

## Your Personalized Forgetting Curve

{YOUR_DATA_PLACEHOLDER}

## Practical Tips

1. **Don't cram**: Spread your reviews over time
2. **Review actively**: Test yourself instead of re-reading
3. **Use optimal intervals**: Follow your personalized curve
4. **Track your progress**: Monitor retention rates
5. **Adjust as needed**: Some topics need more frequent review

## Further Reading

- Ebbinghaus, H. (1885). *Memory: A Contribution to Experimental Psychology*
- Cepeda et al. (2006). "Distributed practice in verbal recall tasks"
- Dunlosky et al. (2013). "Improving Students' Learning With Effective Learning Techniques"`,
    personalizedSections: {
      yourData: {
        type: 'forgetting-curve',
        position: 2, // After "How Spaced Repetition Works"
        placeholder: '{YOUR_DATA_PLACEHOLDER}',
      },
    },
    externalLinks: [
      {
        title: 'Forgetting Curve - Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Forgetting_curve',
        description: 'Comprehensive overview of the forgetting curve',
      },
      {
        title: 'Spaced Repetition Research',
        url: 'https://www.gwern.net/Spaced-repetition',
        description: 'In-depth analysis of spaced repetition research',
      },
    ],
    readingTimeMinutes: 7,
    difficulty: 'BEGINNER',
    tags: ['memory', 'retention', 'forgetting-curve', 'spaced-repetition'],
  },
  {
    slug: 'active-recall-benefits',
    title: 'Active Recall: Why Testing Yourself Works',
    category: 'ACTIVE_RECALL',
    summary: 'Discover why retrieving information from memory (active recall) is far more effective than passive review.',
    content: `# Active Recall: The Power of Retrieval Practice

## What is Active Recall?

Active recall is the practice of actively retrieving information from memory, rather than passively reviewing notes or re-reading material. It's the difference between:

- **Passive review**: "Let me read this chapter again"
- **Active recall**: "Can I explain this concept without looking?"

## The Testing Effect

Research consistently shows that **testing yourself improves long-term retention** more than re-studying:

- **50-100% improvement** in retention compared to re-reading
- **Better transfer** to new problems and contexts
- **Stronger neural connections** in the brain

### Why Testing Works Better

1. **Effortful retrieval strengthens memory traces**
2. **Identifies gaps in knowledge** immediately
3. **Creates retrieval pathways** for future recall
4. **Reduces illusion of competence** from passive review

## Types of Active Recall

### 1. Self-Testing
- Flashcards (Anki, Quizlet)
- Practice questions
- Past exam papers

### 2. Free Recall
- Write everything you remember about a topic
- Explain concepts out loud
- Teach someone else

### 3. Practice Problems
- Clinical cases
- Math problems
- Essay questions

## Your Active Recall Performance

{YOUR_DATA_PLACEHOLDER}

## How to Implement Active Recall

### During Study Sessions
1. **Close your notes** after initial reading
2. **Write or say everything** you remember
3. **Check your accuracy** against notes
4. **Identify gaps** and review those areas
5. **Test again** after a short break

### Best Practices
- Test yourself **before** you feel ready
- Embrace **difficulty** - struggling helps learning
- Use **varied question types** (recall, application, analysis)
- **Space out** your retrieval practice
- **Interleave** different topics

## Common Mistakes

❌ **Re-reading** instead of testing
❌ **Highlighting** as primary study method
❌ **Testing only once** right after learning
❌ **Avoiding difficult questions**
❌ **Not checking answers** thoroughly

## Further Reading

- Roediger & Karpicke (2006). "The Power of Testing Memory"
- Karpicke & Blunt (2011). "Retrieval Practice Produces More Learning"
- Dunlosky et al. (2013). "What Works, What Doesn't"`,
    personalizedSections: {
      yourData: {
        type: 'recall-performance',
        position: 2,
        placeholder: '{YOUR_DATA_PLACEHOLDER}',
      },
    },
    externalLinks: [
      {
        title: 'The Testing Effect',
        url: 'https://www.retrievalpractice.org/',
        description: 'Resources for implementing retrieval practice',
      },
      {
        title: 'Make It Stick (Book)',
        url: 'https://www.amazon.com/Make-Stick-Science-Successful-Learning/dp/0674729013',
        description: 'Evidence-based learning strategies',
      },
    ],
    readingTimeMinutes: 8,
    difficulty: 'BEGINNER',
    tags: ['active-recall', 'testing-effect', 'retrieval-practice', 'study-methods'],
  },
  {
    slug: 'vark-learning-styles',
    title: 'VARK Learning Styles: Understanding Your Preferences',
    category: 'LEARNING_STYLES',
    summary: 'Explore the VARK model of learning preferences and learn how to leverage your strengths while avoiding over-reliance.',
    content: `# VARK Learning Styles: Preferences, Not Limitations

## What is VARK?

VARK stands for the four main sensory modalities used in learning:

- **V**isual: Learning through images, diagrams, charts
- **A**uditory: Learning through listening and discussion
- **R**eading/Writing: Learning through text and note-taking
- **K**inesthetic: Learning through hands-on practice and movement

## Important Research Context

⚠️ **Critical nuance**: While VARK preferences are real, research shows:

1. **Learning styles don't predict performance** when matched to instruction
2. **Everyone benefits from multimodal learning**
3. **Preferences ≠ effectiveness** - your preferred style isn't always best
4. **Content matters more** than delivery style

That said, **understanding your preferences helps you:**
- Engage more effectively with material
- Identify when to push yourself into less comfortable modes
- Create more varied and effective study sessions

## Your VARK Profile

{YOUR_DATA_PLACEHOLDER}

## How to Use Your Profile

### Visual Learners (Images & Diagrams)
**Strengths:**
- Mind maps and concept diagrams
- Color-coded notes
- Visual mnemonics
- Flowcharts and timelines

**Growth areas:**
- Practice verbal explanations
- Listen to lectures without slides
- Work through text-heavy problems

### Auditory Learners (Sound & Discussion)
**Strengths:**
- Lecture attendance and recordings
- Study groups and discussions
- Explaining concepts out loud
- Podcasts and audiobooks

**Growth areas:**
- Create visual summaries
- Practice with diagrams
- Silent reading comprehension

### Reading/Writing Learners (Text)
**Strengths:**
- Detailed written notes
- Essays and summaries
- Textbook reading
- Rewriting and reorganizing

**Growth areas:**
- Visual representation of concepts
- Verbal discussion
- Hands-on practice

### Kinesthetic Learners (Hands-On)
**Strengths:**
- Clinical practice and simulations
- Physical models and manipulatives
- Pacing while studying
- Real-world applications

**Growth areas:**
- Abstract theoretical concepts
- Extended reading sessions
- Lecture-based learning

## Multimodal Learning Strategies

The most effective approach combines all modalities:

1. **See it**: Diagram, chart, or visualization
2. **Hear it**: Explain out loud or listen to explanation
3. **Write it**: Summarize in your own words
4. **Do it**: Apply to practice problems or clinical cases

### Example: Learning Cardiac Physiology

- **Visual**: Draw the cardiac cycle diagram
- **Auditory**: Explain each phase out loud
- **Reading**: Write summary notes
- **Kinesthetic**: Trace the blood flow with your finger, simulate valve actions

## Practical Recommendations

✅ **Use your strengths** to engage initially
✅ **Challenge yourself** with other modalities
✅ **Vary your methods** to strengthen understanding
✅ **Match the content** (e.g., anatomy is inherently visual)
✅ **Don't limit yourself** to one style

## Further Reading

- Fleming, N. D. (2001). "VARK: A Guide to Learning Styles"
- Pashler et al. (2008). "Learning Styles: Concepts and Evidence"
- Willingham et al. (2015). "The Scientific Status of Learning Styles Theories"`,
    personalizedSections: {
      yourData: {
        type: 'vark-profile',
        position: 1,
        placeholder: '{YOUR_DATA_PLACEHOLDER}',
      },
    },
    externalLinks: [
      {
        title: 'VARK Questionnaire',
        url: 'https://vark-learn.com/the-vark-questionnaire/',
        description: 'Official VARK learning styles assessment',
      },
      {
        title: 'Learning Styles Critique',
        url: 'https://www.apa.org/news/press/releases/2019/05/learning-styles-myth',
        description: 'APA article on learning styles research',
      },
    ],
    readingTimeMinutes: 9,
    difficulty: 'INTERMEDIATE',
    tags: ['vark', 'learning-styles', 'multimodal-learning', 'study-preferences'],
  },
  {
    slug: 'cognitive-load-theory',
    title: 'Cognitive Load Theory: Managing Mental Capacity',
    category: 'COGNITIVE_LOAD',
    summary: 'Learn how to optimize learning by managing intrinsic, extraneous, and germane cognitive load.',
    content: `# Cognitive Load Theory: Working Memory Limits

## What is Cognitive Load?

Cognitive Load Theory (CLT) explains how the limitations of working memory affect learning. Your working memory can only hold **4±1 chunks of information** at once.

Think of it like RAM in a computer - you have limited capacity for active processing.

## Three Types of Cognitive Load

### 1. Intrinsic Load (The Content)
**Definition**: The inherent difficulty of the material itself

**Example:**
- Low intrinsic: Basic terminology (mitochondria definition)
- High intrinsic: Complex pathway (Krebs cycle with all intermediates)

**You can't eliminate intrinsic load**, but you can manage it by:
- Breaking complex topics into chunks
- Building prerequisite knowledge first
- Progressive complexity (simple → advanced)

### 2. Extraneous Load (The Presentation)
**Definition**: Load created by poor instructional design

**Common sources:**
- Cluttered slides with too much text
- Searching for information in poorly organized notes
- Distracting formatting or irrelevant details
- Splitting attention between multiple sources

**You CAN eliminate extraneous load** through:
- Clean, organized notes
- Integrated diagrams and text
- Removing distractions
- Focused study environment

### 3. Germane Load (The Learning)
**Definition**: Mental effort devoted to schema construction and automation

**This is GOOD load** - it's the actual learning happening!

**Maximize germane load** through:
- Deliberate practice
- Self-explanation
- Concept mapping
- Connecting new knowledge to existing schemas

## The Balancing Act

**Total Cognitive Load = Intrinsic + Extraneous + Germane**

Your working memory has a **fixed capacity**. The goal:

✅ **Minimize Extraneous** (wasted effort)
✅ **Manage Intrinsic** (chunk appropriately)
✅ **Maximize Germane** (productive learning)

## Your Cognitive Load Patterns

{YOUR_DATA_PLACEHOLDER}

## Practical Strategies

### Reduce Extraneous Load
1. **Clean workspace**: Remove distractions
2. **Organized notes**: Clear structure and headings
3. **Integrated materials**: Text + diagrams together
4. **Worked examples**: Before practice problems
5. **Dual coding**: Visual + verbal explanations

### Manage Intrinsic Load
1. **Prerequisite mastery**: Build foundation first
2. **Chunking**: Break into smaller units
3. **Part-whole**: Learn components before integration
4. **Segmentation**: Take breaks between complex topics
5. **Scaffolding**: Gradual complexity increase

### Optimize Germane Load
1. **Active processing**: Self-explanation
2. **Schema building**: Connect concepts
3. **Varied practice**: Apply in different contexts
4. **Elaboration**: "Why does this make sense?"
5. **Metacognition**: Monitor understanding

## Warning Signs of Cognitive Overload

❌ Information "not sticking"
❌ Confusion increasing over time
❌ Difficulty connecting concepts
❌ Mental fatigue early in session
❌ Need to constantly re-read

**Solutions:**
- Take a break
- Reduce scope of current session
- Review prerequisites
- Simplify study materials
- Chunk into smaller units

## CLT for Medical School

Medical education has **HIGH intrinsic load** by nature. Success requires:

1. **Master prerequisites** (anatomy before physiology)
2. **Use clinical context** to reduce perceived difficulty
3. **Build schemas** (pathways, diagnostic algorithms)
4. **Automate basics** (free up working memory)
5. **Optimize presentation** (clean notes, integrated diagrams)

## Further Reading

- Sweller, J. (1988). "Cognitive Load During Problem Solving"
- van Merriënboer & Sweller (2005). "Cognitive Load Theory and Complex Learning"
- Paas & Sweller (2014). "Implications of Cognitive Load Theory for Multimedia Learning"`,
    personalizedSections: {
      yourData: {
        type: 'cognitive-load',
        position: 2,
        placeholder: '{YOUR_DATA_PLACEHOLDER}',
      },
    },
    externalLinks: [
      {
        title: 'CLT Overview',
        url: 'https://www.instructionaldesign.org/theories/cognitive-load/',
        description: 'Comprehensive guide to Cognitive Load Theory',
      },
      {
        title: 'John Sweller on CLT',
        url: 'https://www.youtube.com/watch?v=qcnM3H8uLYY',
        description: 'Founder of CLT explains the theory',
      },
    ],
    readingTimeMinutes: 10,
    difficulty: 'INTERMEDIATE',
    tags: ['cognitive-load', 'working-memory', 'mental-capacity', 'learning-efficiency'],
  },
  {
    slug: 'circadian-rhythms-optimal-timing',
    title: 'Circadian Rhythms: Finding Your Optimal Study Time',
    category: 'CIRCADIAN_RHYTHMS',
    summary: 'Understand how your biological clock affects cognitive performance and discover your peak learning hours.',
    content: `# Circadian Rhythms: The Science of Timing

## What Are Circadian Rhythms?

Circadian rhythms are 24-hour biological cycles that regulate:
- Alertness and focus
- Memory consolidation
- Hormone levels
- Body temperature
- Cognitive performance

Your brain's **suprachiasmatic nucleus (SCN)** acts as the master clock, synchronized by light exposure and other zeitgebers (time cues).

## Three Chronotypes

Research identifies three main chronotypes:

### 1. Larks (Morning Types) - ~25% of population
**Peak performance**: 8 AM - 12 PM
- High cortisol early morning
- Alertness peaks before noon
- Energy declines afternoon
- Early sleep onset (9-10 PM)

### 2. Hummingbirds (Intermediate) - ~50% of population
**Peak performance**: 10 AM - 2 PM
- Balanced cortisol curve
- Moderate morning alertness
- Sustained afternoon energy
- Standard sleep onset (10-11 PM)

### 3. Owls (Evening Types) - ~25% of population
**Peak performance**: 4 PM - 10 PM
- Delayed cortisol rise
- Slow morning awakening
- Peak alertness evening
- Late sleep onset (12 AM+)

## Your Chronotype & Optimal Times

{YOUR_DATA_PLACEHOLDER}

## Cognitive Performance Throughout the Day

### Morning (6 AM - 12 PM)
**Strengths:**
- Analytical thinking
- Complex problem-solving
- Focus and concentration
- New learning

**Best for:**
- Difficult new material
- Math and logic problems
- Detailed reading
- Memorization

### Afternoon (12 PM - 6 PM)
**Strengths:**
- Creative thinking
- Insight and integration
- Social interaction
- Physical coordination

**Best for:**
- Connecting concepts
- Study groups
- Clinical practice
- Creative problem-solving

### Evening (6 PM - 12 AM)
**Strengths:**
- Review and consolidation
- Less distractible (for owls)
- Relaxed learning
- Procedural practice

**Best for:**
- Flashcard review
- Light reading
- Skill practice
- Pre-sleep consolidation

## Sleep's Role in Learning

### Memory Consolidation
Sleep is when learning becomes permanent:

1. **NREM sleep**: Consolidates declarative memory (facts, concepts)
2. **REM sleep**: Consolidates procedural memory (skills)
3. **Sleep spindles**: Transfer short-term → long-term memory

### Optimal Sleep-Study Timing

✅ **Study before sleep**: 20-30% better retention
✅ **Sleep after learning**: Critical for consolidation
✅ **Avoid all-nighters**: -40% retention, impaired reasoning
✅ **Naps help**: 20-min nap improves alertness, 60-90 min consolidates

## Practical Timing Strategies

### Match Task to Time

**High-cognitive load (intrinsic difficulty):**
- Schedule during YOUR peak hours
- Avoid post-lunch dip (1-3 PM for most)
- Morning for most analytical tasks

**Low-cognitive load (review, practice):**
- Non-peak hours work fine
- Evening review beneficial
- Pre-sleep flashcards excellent

### Optimize Your Schedule

1. **Identify your chronotype** (track 1-2 weeks)
2. **Schedule accordingly**:
   - Larks: Tackle hard stuff early
   - Owls: Protect afternoon/evening time
   - Hummingbirds: Flexible, avoid extremes
3. **Respect the post-lunch dip** (light tasks 1-3 PM)
4. **Use caffeine strategically** (30-60 min before peak)
5. **Block blue light** 2 hours before bed

### Light Exposure Hacking

- **Morning light**: Advances clock (good for owls)
- **Evening light**: Delays clock (good for larks)
- **Blue light blockers**: Improve sleep quality
- **Bright study environment**: Increases alertness

## Medical School Considerations

Unfortunately, medical school doesn't always respect chronotypes:

**8 AM lectures for owls:** 😴
- Sit front row
- Stand in back
- Splash cold water
- Pre-lecture prep helps

**Late-night studying for larks:** 😴
- Wake up earlier instead
- Power nap before evening study
- Use bright lights
- Caffeine (but not after 2 PM)

## Warning Signs of Circadian Misalignment

❌ Chronic fatigue despite adequate sleep
❌ Difficulty concentrating at "expected" times
❌ Needing excessive caffeine
❌ Weekend sleep pattern very different
❌ Poor academic performance despite effort

**Solutions:**
- Gradually shift sleep schedule (15 min/day)
- Optimize light exposure
- Consistent sleep-wake times (even weekends)
- Speak with academic advisor about accommodation

## Further Reading

- Czeisler, C. A. (1999). "Stability, Precision, and Near-24-Hour Period of the Human Circadian Pacemaker"
- Roenneberg et al. (2003). "Life between Clocks: Daily Temporal Patterns"
- Goel et al. (2013). "Circadian Rhythms, Sleep Deprivation, and Human Performance"
- Walker, M. (2017). *Why We Sleep* (book)`,
    personalizedSections: {
      yourData: {
        type: 'optimal-study-times',
        position: 1,
        placeholder: '{YOUR_DATA_PLACEHOLDER}',
      },
    },
    externalLinks: [
      {
        title: 'Chronotype Quiz',
        url: 'https://www.chronotype-self-test.info/',
        description: 'Determine your circadian preference',
      },
      {
        title: 'Sleep Foundation - Circadian Rhythm',
        url: 'https://www.sleepfoundation.org/circadian-rhythm',
        description: 'Comprehensive resource on sleep science',
      },
      {
        title: 'Why We Sleep (Book)',
        url: 'https://www.amazon.com/Why-We-Sleep-Unlocking-Dreams/dp/1501144316',
        description: 'Matthew Walker on sleep and learning',
      },
    ],
    readingTimeMinutes: 11,
    difficulty: 'ADVANCED',
    tags: ['circadian-rhythm', 'chronotype', 'optimal-timing', 'sleep', 'performance'],
  },
]

async function seedLearningArticles() {
  console.log('🌱 Seeding learning science articles...')

  for (const article of articles) {
    const existing = await prisma.learningArticle.findUnique({
      where: { slug: article.slug },
    })

    if (existing) {
      console.log(`  ✓ Article "${article.title}" already exists, skipping...`)
      continue
    }

    await prisma.learningArticle.create({
      data: article,
    })

    console.log(`  ✓ Created article: ${article.title}`)
  }

  console.log('✅ Learning science articles seeded successfully!')
}

// Run if called directly
if (require.main === module) {
  seedLearningArticles()
    .catch((error) => {
      console.error('❌ Error seeding learning articles:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedLearningArticles }
