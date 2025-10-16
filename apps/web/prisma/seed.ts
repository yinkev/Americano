// prisma/seed.ts
// Seed database with Dumpling demo user (placeholder data for development)
// Delete Dumpling via Settings → Delete Demo User when ready for real data

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create Kevy (real user - you)
  const kevy = await prisma.user.upsert({
    where: { email: 'kevy@americano.dev' },
    update: {},
    create: {
      email: 'kevy@americano.dev',
      name: 'Kevy',
    },
  });

  console.log('✓ Kevy user created:', kevy);

  // Create Dumpling demo user (all placeholder content belongs to this user)
  const demoUser = await prisma.user.upsert({
    where: { email: 'dumpling@americano.demo' },
    update: {},
    create: {
      email: 'dumpling@americano.demo',
      name: 'Dumpling',
    },
  });

  console.log('✓ Dumpling demo user created:', demoUser);

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

  console.log('✓ Demo courses created (PNWU-COM OMS 1 curriculum):', {
    anatomy: anatomyCourse.name,
    scifom: scifomCourse.name,
    pharmacology: pharmacologyCourse.name,
    opp: oppCourse.name,
    clinicalSkills: clinicalSkillsCourse.name,
    communityDoctoring: communityDoctoringCourse.name,
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('   - Kevy: Your real user (clean, no demo data)');
  console.log('   - Dumpling: Demo user with sample courses');
  console.log('   🥟 Delete Dumpling via Settings → Delete Demo User when ready');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
