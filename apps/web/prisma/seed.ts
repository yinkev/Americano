// prisma/seed.ts
// Seed database with Dumpling demo user (placeholder data for development)
// Delete Dumpling via Settings → Delete Demo User when ready for real data

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create Kevy (real user - you)
  const kevy = await prisma.user.upsert({
    where: { email: 'kevy@americano.dev' },
    update: {},
    create: {
      email: 'kevy@americano.dev',
      name: 'Kevy',
    },
  })

  console.log('✓ Kevy user created:', kevy)

  // Create Dumpling demo user (all placeholder content belongs to this user)
  const demoUser = await prisma.user.upsert({
    where: { email: 'dumpling@americano.demo' },
    update: {},
    create: {
      email: 'dumpling@americano.demo',
      name: 'Dumpling',
    },
  })

  console.log('✓ Dumpling demo user created:', demoUser)

  // Create sample courses for Dumpling (realistic PNWU-COM OMS 1 curriculum)
  const anatomyCourse = await prisma.course.upsert({
    where: { id: 'demo-gross-anatomy' },
    update: {},
    create: {
      id: 'demo-gross-anatomy',
      userId: demoUser.id,
      name: 'Gross Anatomy',
      code: 'OMS1-ANAT',
      term: 'OMS 1 (Year-long)',
    },
  })

  const scifomCourse = await prisma.course.upsert({
    where: { id: 'demo-scifom' },
    update: {},
    create: {
      id: 'demo-scifom',
      userId: demoUser.id,
      name: 'Scientific Foundations of Medicine (SciFOM)',
      code: 'OMS1-SCIFOM',
      term: 'OMS 1 (Weeks 1-12)',
    },
  })

  const pharmacologyCourse = await prisma.course.upsert({
    where: { id: 'demo-pharmacology' },
    update: {},
    create: {
      id: 'demo-pharmacology',
      userId: demoUser.id,
      name: 'Fundamentals of Pharmacology',
      code: 'OMS1-PHARM',
      term: 'OMS 1 (Weeks 3-12)',
    },
  })

  const oppCourse = await prisma.course.upsert({
    where: { id: 'demo-opp' },
    update: {},
    create: {
      id: 'demo-opp',
      userId: demoUser.id,
      name: 'Osteopathic Principles and Practice (OPP)',
      code: 'OMS1-OPP',
      term: 'OMS 1 (Year-long)',
    },
  })

  const clinicalSkillsCourse = await prisma.course.upsert({
    where: { id: 'demo-clinical-skills' },
    update: {},
    create: {
      id: 'demo-clinical-skills',
      userId: demoUser.id,
      name: 'Clinical Skills',
      code: 'OMS1-CLIN',
      term: 'OMS 1 (Year-long)',
    },
  })

  const communityDoctoringCourse = await prisma.course.upsert({
    where: { id: 'demo-community-doctoring' },
    update: {},
    create: {
      id: 'demo-community-doctoring',
      userId: demoUser.id,
      name: 'Community Doctoring',
      code: 'OMS1-COMM',
      term: 'OMS 1 (Year-long)',
    },
  })

  console.log('✓ Demo courses created (PNWU-COM OMS 1 curriculum):', {
    anatomy: anatomyCourse.name,
    scifom: scifomCourse.name,
    pharmacology: pharmacologyCourse.name,
    opp: oppCourse.name,
    clinicalSkills: clinicalSkillsCourse.name,
    communityDoctoring: communityDoctoringCourse.name,
  })

  // Story 5.6: Seed Learning Science Articles
  const articles = [
    {
      slug: 'spaced-repetition-science',
      title: 'The Science of Spaced Repetition',
      subtitle: 'Understanding Ebbinghaus and Your Personal Forgetting Curve',
      category: 'SPACED_REPETITION' as const,
      content: `# The Science of Spaced Repetition

## What Is Spaced Repetition?

Spaced repetition is a learning technique based on the spacing effect, first discovered by Hermann Ebbinghaus in 1885. Through meticulous self-experimentation, Ebbinghaus revealed that humans forget information exponentially over time—but strategic review can dramatically slow this decay.

## The Ebbinghaus Forgetting Curve

Ebbinghaus discovered that without reinforcement, we forget:
- **20% of new information** within the first hour
- **50%** within one day
- **70%** within one week
- **90%** within one month

The mathematical model: **R(t) = R₀ × e^(-kt)**

Where:
- R(t) = retention at time t
- R₀ = initial retention (typically 0.9-1.0)
- k = decay constant (varies by individual and content)
- t = time elapsed

## Your Personal Forgetting Curve

{{PERSONALIZED_FORGETTING_CURVE}}

Based on your study data, we've calculated your personal forgetting curve parameters:
- **R₀ (Initial Retention)**: {{R0_VALUE}}
- **k (Decay Constant)**: {{K_VALUE}}
- **Half-life**: {{HALF_LIFE_DAYS}} days

This means you retain information **{{RETENTION_COMPARISON}}** than Ebbinghaus's average subject.

## Optimal Review Timing

Research shows the best times to review are:
1. **1 day** after initial learning
2. **3 days** after first review
3. **7 days** after second review
4. **14 days** after third review
5. **30 days** after fourth review

Your personalized review schedule should align with your decay constant (k = {{K_VALUE}}), which we've built into Americano's FSRS algorithm.

## Research Citations

1. Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.
2. Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. Psychological Bulletin, 132(3), 354-380.
3. Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966-968.
4. Bjork, R. A., & Bjork, E. L. (1992). A new theory of disuse and an old theory of stimulus fluctuation. In A. Healy, S. Kosslyn, & R. Shiffrin (Eds.), From learning processes to cognitive processes: Essays in honor of William K. Estes (Vol. 2, pp. 35-67).

## Actionable Takeaways

1. **Don't cram**: Distributed practice beats massed practice by 200%+
2. **Trust the intervals**: Resist the urge to review too early
3. **Embrace difficulty**: Struggling to retrieve strengthens memory traces
4. **Track your curve**: Your forgetting curve improves with consistent practice
`,
      researchCitations: [
        'Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.',
        'Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. Psychological Bulletin, 132(3), 354-380.',
        'Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966-968.',
      ],
      estimatedReadTime: 8,
      personalizedDataFields: [
        'PERSONALIZED_FORGETTING_CURVE',
        'R0_VALUE',
        'K_VALUE',
        'HALF_LIFE_DAYS',
        'RETENTION_COMPARISON',
      ],
    },
    {
      slug: 'active-recall-benefits',
      title: 'Active Recall: The Most Powerful Learning Strategy',
      subtitle: 'Why Retrieval Practice Beats Re-reading',
      category: 'ACTIVE_RECALL' as const,
      content: `# Active Recall: The Most Powerful Learning Strategy

## What Is Active Recall?

Active recall (also called retrieval practice) is the process of actively stimulating memory during learning. Instead of passively re-reading notes or highlighting text, you force your brain to retrieve information from memory.

## The Science Behind It

Karpicke and Roediger (2008) demonstrated that retrieval practice produces **400% better retention** than repeated studying over one week. The "testing effect" shows that the act of retrieving information strengthens neural pathways more than any other learning method.

### Why It Works: Desirable Difficulties

Robert Bjork introduced the concept of "desirable difficulties"—challenges that feel harder in the moment but produce superior long-term learning. Active recall creates exactly this kind of beneficial struggle:

1. **Effortful retrieval** strengthens memory consolidation
2. **Failure to retrieve** highlights knowledge gaps (metacognitive benefit)
3. **Successful retrieval** builds confidence and fluency

## Your Active Recall Performance

{{ACTIVE_RECALL_STATS}}

Based on your flashcard reviews:
- **Average retrieval success rate**: {{RETRIEVAL_SUCCESS_RATE}}%
- **Cards reaching mastery**: {{MASTERED_CARDS_COUNT}}
- **Average time to recall**: {{AVG_RECALL_TIME}}s

## Techniques for Active Recall

### 1. The Feynman Technique
Explain concepts in simple terms as if teaching someone else. Gaps in your explanation reveal gaps in understanding.

### 2. Self-Testing with Flashcards
Americano's FSRS-optimized flashcards implement active recall at optimal intervals.

### 3. Free Recall
Close your notes and write everything you remember about a topic. Compare against source material.

### 4. Elaborative Interrogation
Ask yourself "why" and "how" questions about the material, forcing deep retrieval.

### 5. Interleaving
Mix different topics during practice to force discrimination between concepts (harder but more effective).

## Common Mistakes

❌ **Re-reading notes** (passive, minimal retention benefit)
❌ **Highlighting** (illusion of competence)
❌ **Reviewing too soon** (no retrieval challenge)
❌ **Giving up on difficult recalls** (the struggle IS the learning)

✅ **Use flashcards** (forced retrieval)
✅ **Practice retrieval before looking** (even if you fail)
✅ **Test yourself frequently** (testing = studying)
✅ **Embrace the difficulty** (struggle strengthens memory)

## Research Citations

1. Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966-968.
2. Roediger, H. L., & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. Trends in Cognitive Sciences, 15(1), 20-27.
3. Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way. Psychology and the Real World, 2, 59-68.
4. Dunlosky, J., et al. (2013). Improving students' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4-58.

## Actionable Takeaways

1. **Test yourself before reviewing** notes (pre-testing effect)
2. **Use Americano's flashcards** for systematic active recall
3. **Don't mistake recognition for recall** (can you retrieve without cues?)
4. **Track your retrieval success** to identify weak areas
`,
      researchCitations: [
        'Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. Science, 319(5865), 966-968.',
        'Roediger, H. L., & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. Trends in Cognitive Sciences, 15(1), 20-27.',
        'Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way. Psychology and the Real World, 2, 59-68.',
      ],
      estimatedReadTime: 7,
      personalizedDataFields: [
        'ACTIVE_RECALL_STATS',
        'RETRIEVAL_SUCCESS_RATE',
        'MASTERED_CARDS_COUNT',
        'AVG_RECALL_TIME',
      ],
    },
    {
      slug: 'vark-learning-styles',
      title: 'Understanding VARK Learning Styles',
      subtitle: 'Personalized Learning Preferences (With Research Caveats)',
      category: 'LEARNING_STYLES' as const,
      content: `# Understanding VARK Learning Styles

## What Is VARK?

VARK categorizes learning preferences into four modalities:
- **Visual (V)**: Prefer diagrams, charts, graphs, and visual representations
- **Auditory (A)**: Learn best through listening, discussions, and verbal explanations
- **Reading/Writing (R)**: Prefer written words, note-taking, and reading
- **Kinesthetic (K)**: Learn through hands-on experience, practice, and movement

## Your VARK Profile

{{VARK_PROFILE_CHART}}

Based on your content preferences:
- **Visual**: {{VISUAL_PERCENTAGE}}%
- **Auditory**: {{AUDITORY_PERCENTAGE}}%
- **Reading/Writing**: {{READING_PERCENTAGE}}%
- **Kinesthetic**: {{KINESTHETIC_PERCENTAGE}}%

Your dominant learning style is **{{DOMINANT_STYLE}}**, but you benefit from multimodal approaches.

## The Research Context

**Important caveat**: While VARK is popular, research on "learning styles" is mixed:

### What Research Supports:
- ✅ People have **preferences** for certain modalities
- ✅ **Multimodal learning** is more effective than single-modality
- ✅ Matching content **format to subject matter** improves learning (e.g., anatomy benefits from visual diagrams)

### What Research Does NOT Support:
- ❌ Strict "learning styles" that determine ability (learning styles myth)
- ❌ Teaching exclusively to one modality (limits learning)
- ❌ People can only learn through their preferred style

### The Nuanced Truth (Pashler et al., 2008):
"We found virtually no evidence for the interaction pattern mentioned above, which was judged to be a precondition for validating the educational applications of learning styles."

The value of VARK is **self-awareness**, not limitation.

## How to Use Your VARK Profile

### If You're High Visual (>40%):
- Use Americano's diagram-based flashcards
- Draw concept maps and flowcharts
- Annotate images with labels
- Watch video lectures with subtitles off (force visual attention)

### If You're High Auditory (>40%):
- Explain concepts aloud (Feynman Technique)
- Record yourself teaching material
- Join study groups for discussion
- Use mnemonic rhymes and verbal associations

### If You're High Reading/Writing (>40%):
- Take detailed Cornell notes
- Rewrite concepts in your own words
- Create study guides and summaries
- Use flashcards with text-heavy explanations

### If You're High Kinesthetic (>40%):
- Use physical mnemonics (e.g., hand gestures for anatomy)
- Practice clinical skills frequently
- Draw/write while studying (muscle memory)
- Take breaks to move (walk while reviewing mental flashcards)

## The Multimodal Advantage

Research overwhelmingly shows that **combining modalities** produces the best learning outcomes:

1. **Visual + Auditory**: Watch lectures while taking notes (dual coding theory)
2. **Reading + Kinesthetic**: Write flashcards by hand (motor memory + text)
3. **Visual + Kinesthetic**: Draw diagrams from memory (retrieval + spatial)
4. **All Four**: Teach a topic using diagrams while explaining aloud (ultimate multimodal)

## Research Citations

1. Fleming, N. D., & Mills, C. (1992). Not Another Inventory, Rather a Catalyst for Reflection. To Improve the Academy, 11, 137-155.
2. Pashler, H., et al. (2008). Learning Styles: Concepts and Evidence. Psychological Science in the Public Interest, 9(3), 105-119.
3. Rogowsky, B. A., et al. (2015). Matching learning style to instructional method: Effects on comprehension. Journal of Educational Psychology, 107(1), 64-78.
4. Paivio, A. (1990). Mental Representations: A Dual Coding Approach. Oxford University Press.

## Actionable Takeaways

1. **Know your preferences** but don't limit yourself to them
2. **Use multimodal study** techniques (visual + auditory + kinesthetic)
3. **Match format to content** (anatomy = visual, physiology mechanisms = verbal/causal)
4. **Diversify your study** methods to build robust neural networks
`,
      researchCitations: [
        'Fleming, N. D., & Mills, C. (1992). Not Another Inventory, Rather a Catalyst for Reflection. To Improve the Academy, 11, 137-155.',
        'Pashler, H., et al. (2008). Learning Styles: Concepts and Evidence. Psychological Science in the Public Interest, 9(3), 105-119.',
        'Paivio, A. (1990). Mental Representations: A Dual Coding Approach. Oxford University Press.',
      ],
      estimatedReadTime: 9,
      personalizedDataFields: [
        'VARK_PROFILE_CHART',
        'VISUAL_PERCENTAGE',
        'AUDITORY_PERCENTAGE',
        'READING_PERCENTAGE',
        'KINESTHETIC_PERCENTAGE',
        'DOMINANT_STYLE',
      ],
    },
    {
      slug: 'cognitive-load-theory',
      title: 'Cognitive Load Theory for Medical Students',
      subtitle: 'Managing Mental Bandwidth for Optimal Learning',
      category: 'COGNITIVE_LOAD' as const,
      content: `# Cognitive Load Theory for Medical Students

## What Is Cognitive Load?

Cognitive Load Theory (Sweller, 1988) explains that working memory has limited capacity (~7±2 chunks). Medical education is particularly demanding because it requires integrating vast amounts of information across multiple domains simultaneously.

## The Three Types of Cognitive Load

### 1. Intrinsic Load (Content Difficulty)
The inherent complexity of the material. Medical topics like biochemical pathways or cardiac electrophysiology have high intrinsic load—you can't simplify them without losing critical information.

**Example**: Understanding the citric acid cycle requires holding 8 reactions, 8 intermediates, and regulatory steps in working memory simultaneously.

### 2. Extraneous Load (Poor Design)
Mental effort wasted on poorly presented information. Examples:
- Confusing textbook layouts
- Irrelevant details during lectures
- Disorganized study materials
- Multitasking during study sessions

### 3. Germane Load (Deep Learning)
Productive mental effort that builds schemas (organized knowledge structures). This is the GOOD type of cognitive load—it's the struggle that creates expertise.

**Example**: Creating a concept map that links anatomy → physiology → pathology → clinical presentation uses germane load productively.

## Your Cognitive Load Patterns

{{COGNITIVE_LOAD_ANALYSIS}}

Based on your study sessions:
- **Average session duration**: {{AVG_SESSION_DURATION}} minutes
- **Attention drops after**: {{ATTENTION_DROP_TIME}} minutes
- **Optimal session length**: {{OPTIMAL_SESSION_LENGTH}} minutes
- **Cognitive overload indicators**: {{OVERLOAD_COUNT}} sessions in past month

## Strategies to Manage Cognitive Load

### Reduce Extraneous Load
1. **Study in distraction-free environment** (no phone, no multitasking)
2. **Use well-designed materials** (Americano's flashcards optimize for this)
3. **Follow the split-attention principle** (integrate diagrams with text, don't separate)
4. **Eliminate redundancy** (don't read and listen to identical content simultaneously)

### Optimize Intrinsic Load
1. **Chunk information** (group related concepts together)
2. **Use prerequisites** (master foundational concepts first)
3. **Progressive complexity** (start simple, add nuance gradually)
4. **Part-task training** (break complex procedures into steps)

### Maximize Germane Load
1. **Elaborative rehearsal** (connect new info to existing knowledge)
2. **Self-explanation** (explain WHY things work, not just WHAT)
3. **Worked examples** (study solutions before attempting problems)
4. **Schema construction** (build mental models and concept maps)

## The Worked Example Effect

Research shows that for novices, **studying worked examples** is more effective than problem-solving. As expertise grows, the reverse becomes true (expertise reversal effect).

**Medical school application**:
- **First exposure** to pathophysiology: Study annotated clinical cases
- **Second exposure**: Attempt diagnosis independently
- **Mastery phase**: Generate your own clinical cases

## Signs of Cognitive Overload

Watch for these warning signs in your study sessions:
- 🚩 Rereading the same sentence 3+ times
- 🚩 Unable to recall what you just studied
- 🚩 Feeling overwhelmed by lecture slides
- 🚩 Declining performance after 60+ minute sessions
- 🚩 Increased errors on "easy" flashcards

**Americano's detection**: We track these patterns and recommend breaks when overload is detected.

## Research Citations

1. Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science, 12(2), 257-285.
2. Paas, F., Renkl, A., & Sweller, J. (2003). Cognitive load theory and instructional design. Educational Psychologist, 38(1), 1-4.
3. Kalyuga, S. (2007). Expertise reversal effect and its implications for learner-tailored instruction. Educational Psychology Review, 19(4), 509-539.
4. Mayer, R. E., & Moreno, R. (2003). Nine ways to reduce cognitive load in multimedia learning. Educational Psychologist, 38(1), 43-52.

## Actionable Takeaways

1. **Respect your working memory limits** (7±2 chunks)
2. **Take breaks before** cognitive overload sets in ({{OPTIMAL_SESSION_LENGTH}} min for you)
3. **Chunk related information** together (anatomy + physiology + pathology)
4. **Study worked examples** before attempting practice questions
5. **Eliminate distractions** ruthlessly during study sessions
`,
      researchCitations: [
        'Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science, 12(2), 257-285.',
        'Paas, F., Renkl, A., & Sweller, J. (2003). Cognitive load theory and instructional design. Educational Psychologist, 38(1), 1-4.',
        'Mayer, R. E., & Moreno, R. (2003). Nine ways to reduce cognitive load in multimedia learning. Educational Psychologist, 38(1), 43-52.',
      ],
      estimatedReadTime: 10,
      personalizedDataFields: [
        'COGNITIVE_LOAD_ANALYSIS',
        'AVG_SESSION_DURATION',
        'ATTENTION_DROP_TIME',
        'OPTIMAL_SESSION_LENGTH',
        'OVERLOAD_COUNT',
      ],
    },
    {
      slug: 'circadian-rhythms-optimal-timing',
      title: 'Circadian Rhythms and Optimal Study Timing',
      subtitle: 'Aligning Your Study Schedule with Your Biological Clock',
      category: 'CIRCADIAN_RHYTHMS' as const,
      content: `# Circadian Rhythms and Optimal Study Timing

## What Are Circadian Rhythms?

Your circadian rhythm is a 24-hour biological clock that regulates alertness, cognitive performance, body temperature, and hormone release. For medical students, understanding and leveraging your circadian rhythm can dramatically improve learning efficiency.

## The Science of Cognitive Performance Peaks

Research by Schmidt et al. (2007) shows that cognitive performance follows a predictable daily pattern:

### Typical Circadian Performance Curve:
- **6-8 AM**: Cortisol surge, alertness increases (but cognitive performance still warming up)
- **9-11 AM**: **PEAK analytical thinking** (prefrontal cortex optimally active)
- **12-2 PM**: Post-lunch dip (blood flow diverted to digestion, adenosine accumulation)
- **3-6 PM**: **SECOND PEAK** for learning and memory consolidation
- **7-9 PM**: Good for review and low-stakes practice
- **10 PM-1 AM**: Melatonin release, memory consolidation during sleep prep
- **1-6 AM**: Lowest cognitive performance (circadian nadir)

## Your Personal Circadian Pattern

{{CIRCADIAN_HEATMAP}}

Based on your study performance data:
- **Peak performance hours**: {{PEAK_HOURS}}
- **Performance score during peak**: {{PEAK_PERFORMANCE_SCORE}}/100
- **Performance score off-peak**: {{OFFPEAK_PERFORMANCE_SCORE}}/100
- **Performance delta**: {{PERFORMANCE_DELTA}}% improvement during peak hours

**Your chronotype**: {{CHRONOTYPE}} (Morning Lark / Intermediate / Night Owl)

## Chronotypes: Are You a Lark or an Owl?

### Morning Larks (~25% of population):
- Peak performance: 8 AM - 12 PM
- Strategy: **Front-load difficult material** early in the day
- Avoid: Late-night cramming (performance crashes after 8 PM)

### Night Owls (~25% of population):
- Peak performance: 4 PM - 12 AM
- Strategy: **Schedule deep work** in afternoon/evening
- Avoid: 8 AM lectures (if possible) or high-stakes study before 10 AM

### Intermediates (~50% of population):
- Peak performance: 10 AM - 4 PM
- Strategy: **Balanced schedule** with morning review, afternoon deep work
- Most flexible chronotype for medical school schedules

## Optimizing Your Study Schedule

### For Your Peak Hours ({{PEAK_HOURS}}):
1. **Tackle hardest subjects** (biochemistry, pharmacology)
2. **Do active recall practice** (maximum retrieval efficiency)
3. **Learn new material** (encoding is most efficient)
4. **Solve complex problems** (analytical thinking peaks)

### For Off-Peak Hours:
1. **Review flashcards** (lower cognitive demand)
2. **Watch video lectures** (passive learning acceptable)
3. **Organize notes** (administrative tasks)
4. **Light reading** (textbook review, not intensive study)

### Avoid During Your Trough ({{TROUGH_HOURS}}):
- ❌ Learning complex new material
- ❌ High-stakes practice exams
- ❌ Memorization tasks
- ✅ Physical activity (exercise improves subsequent cognitive performance)
- ✅ Meal preparation, errands, social time

## Sleep and Memory Consolidation

**Critical insight**: Sleep isn't "downtime"—it's when your brain consolidates what you learned.

### Sleep Stages and Learning:
- **Slow-wave sleep (deep sleep)**: Consolidates declarative memory (facts, concepts)
- **REM sleep**: Integrates knowledge, strengthens procedural memory
- **Naps (20-90 min)**: Boost afternoon alertness and consolidation

**Your sleep data**: {{SLEEP_CORRELATION}}

Students who sleep 7-9 hours show **30% better retention** than those sleeping <6 hours (Walker, 2017).

## Light, Caffeine, and Circadian Hacking

### Light Exposure:
- **Morning bright light** (10,000 lux or sunlight): Advances circadian rhythm (helps night owls wake earlier)
- **Avoid blue light 2 hours before bed**: Delays melatonin release

### Caffeine Strategy:
- **Optimal timing**: 90-120 minutes after waking (not immediately upon waking)
- **Avoid after 2 PM** if you sleep at 10 PM (6-8 hour half-life)
- **Use strategically**: Before peak performance hours, not to combat poor sleep

## Research Citations

1. Schmidt, C., et al. (2007). A time to think: Circadian rhythms in human cognition. Cognitive Neuropsychology, 24(7), 755-789.
2. Walker, M. (2017). Why We Sleep: Unlocking the Power of Sleep and Dreams. Scribner.
3. Adan, A., et al. (2012). Circadian typology: A comprehensive review. Chronobiology International, 29(9), 1153-1175.
4. Horne, J. A., & Östberg, O. (1976). A self-assessment questionnaire to determine morningness-eveningness in human circadian rhythms. International Journal of Chronobiology, 4(2), 97-110.

## Actionable Takeaways

1. **Study hardest subjects during your peak hours** ({{PEAK_HOURS}} for you)
2. **Protect your sleep** (7-9 hours nightly for consolidation)
3. **Use strategic caffeine** (90-120 min after waking, not after 2 PM)
4. **Get morning sunlight** if you want to shift toward earlier peak performance
5. **Track your performance by time** to validate your personal circadian pattern
`,
      researchCitations: [
        'Schmidt, C., et al. (2007). A time to think: Circadian rhythms in human cognition. Cognitive Neuropsychology, 24(7), 755-789.',
        'Walker, M. (2017). Why We Sleep: Unlocking the Power of Sleep and Dreams. Scribner.',
        'Adan, A., et al. (2012). Circadian typology: A comprehensive review. Chronobiology International, 29(9), 1153-1175.',
      ],
      estimatedReadTime: 11,
      personalizedDataFields: [
        'CIRCADIAN_HEATMAP',
        'PEAK_HOURS',
        'PEAK_PERFORMANCE_SCORE',
        'OFFPEAK_PERFORMANCE_SCORE',
        'PERFORMANCE_DELTA',
        'CHRONOTYPE',
        'TROUGH_HOURS',
        'SLEEP_CORRELATION',
      ],
    },
  ]

  for (const article of articles) {
    const created = await prisma.learningArticle.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    })
    console.log(`✓ Learning article created: ${created.title}`)
  }

  console.log('\n✅ Database seeded successfully!')
  console.log('   - Kevy: Your real user (clean, no demo data)')
  console.log('   - Dumpling: Demo user with sample courses')
  console.log('   - 5 Learning Science Articles seeded')
  console.log('   🥟 Delete Dumpling via Settings → Delete Demo User when ready')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
