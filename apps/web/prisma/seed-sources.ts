/**
 * Seed script for Source credibility database
 *
 * Epic 3 - Story 3.4 - Task 2.1: Source Authority Ranking System
 *
 * Seeds default sources with credibility scores:
 * - First Aid: 95 (gold standard for board exams)
 * - Clinical Guidelines: 95 (official evidence-based guidelines)
 * - Peer-reviewed Journals: 90 (high-quality research)
 * - Medical Textbooks: 85 (authoritative but may be outdated)
 * - Medical School Lectures: 70-85 (variable quality, institution-dependent)
 * - User Notes: 50 (personal, unverified content)
 */

import { PrismaClient, SourceType } from '../src/generated/prisma'

const prisma = new PrismaClient()

/**
 * Default sources to seed
 */
const SOURCES = [
  // FIRST_AID sources
  {
    name: 'First Aid for the USMLE Step 1 2026',
    type: SourceType.FIRST_AID,
    credibilityScore: 95,
    medicalSpecialty: 'General Medical Education',
    metadata: {
      edition: '2026',
      publisher: 'McGraw-Hill',
      isbn: '978-1264269419',
      boardExamRelevance: 'USMLE Step 1',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
    },
  },
  {
    name: 'First Aid for the USMLE Step 2 CK',
    type: SourceType.FIRST_AID,
    credibilityScore: 95,
    medicalSpecialty: 'Clinical Medicine',
    metadata: {
      publisher: 'McGraw-Hill',
      boardExamRelevance: 'USMLE Step 2 CK',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
    },
  },
  {
    name: 'First Aid for the COMLEX Level 1',
    type: SourceType.FIRST_AID,
    credibilityScore: 95,
    medicalSpecialty: 'Osteopathic Medicine',
    metadata: {
      publisher: 'McGraw-Hill',
      boardExamRelevance: 'COMLEX Level 1',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
    },
  },

  // GUIDELINE sources
  {
    name: 'American Heart Association (AHA) Guidelines',
    type: SourceType.GUIDELINE,
    credibilityScore: 95,
    medicalSpecialty: 'Cardiology',
    metadata: {
      organization: 'American Heart Association',
      url: 'https://www.heart.org/en/health-topics',
      evidenceLevel: 'LEVEL_I',
      peerReviewed: true,
      updateFrequency: 'Annual',
    },
  },
  {
    name: 'American College of Cardiology (ACC) Guidelines',
    type: SourceType.GUIDELINE,
    credibilityScore: 95,
    medicalSpecialty: 'Cardiology',
    metadata: {
      organization: 'American College of Cardiology',
      url: 'https://www.acc.org/guidelines',
      evidenceLevel: 'LEVEL_I',
      peerReviewed: true,
    },
  },
  {
    name: 'Centers for Disease Control and Prevention (CDC) Guidelines',
    type: SourceType.GUIDELINE,
    credibilityScore: 95,
    medicalSpecialty: 'Infectious Disease',
    metadata: {
      organization: 'CDC',
      url: 'https://www.cdc.gov/guidelines',
      evidenceLevel: 'LEVEL_I',
      peerReviewed: true,
    },
  },
  {
    name: 'American Diabetes Association (ADA) Standards of Care',
    type: SourceType.GUIDELINE,
    credibilityScore: 95,
    medicalSpecialty: 'Endocrinology',
    metadata: {
      organization: 'American Diabetes Association',
      url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
      evidenceLevel: 'LEVEL_I',
      peerReviewed: true,
      updateFrequency: 'Annual',
    },
  },
  {
    name: 'UpToDate Clinical Practice Guidelines',
    type: SourceType.GUIDELINE,
    credibilityScore: 95,
    medicalSpecialty: 'General Medicine',
    metadata: {
      organization: 'Wolters Kluwer',
      url: 'https://www.uptodate.com',
      evidenceLevel: 'LEVEL_I',
      peerReviewed: true,
      subscription: true,
    },
  },

  // JOURNAL sources
  {
    name: 'New England Journal of Medicine (NEJM)',
    type: SourceType.JOURNAL,
    credibilityScore: 90,
    medicalSpecialty: 'General Medicine',
    metadata: {
      impactFactor: 176.1,
      publisher: 'Massachusetts Medical Society',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
      url: 'https://www.nejm.org',
    },
  },
  {
    name: 'The Lancet',
    type: SourceType.JOURNAL,
    credibilityScore: 90,
    medicalSpecialty: 'General Medicine',
    metadata: {
      impactFactor: 168.9,
      publisher: 'Elsevier',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
      url: 'https://www.thelancet.com',
    },
  },
  {
    name: 'Journal of the American Medical Association (JAMA)',
    type: SourceType.JOURNAL,
    credibilityScore: 90,
    medicalSpecialty: 'General Medicine',
    metadata: {
      impactFactor: 157.3,
      publisher: 'American Medical Association',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
      url: 'https://jamanetwork.com',
    },
  },
  {
    name: 'Circulation (AHA Journal)',
    type: SourceType.JOURNAL,
    credibilityScore: 90,
    medicalSpecialty: 'Cardiology',
    metadata: {
      impactFactor: 37.8,
      publisher: 'American Heart Association',
      peerReviewed: true,
      evidenceLevel: 'LEVEL_II',
      url: 'https://www.ahajournals.org/journal/circ',
    },
  },

  // TEXTBOOK sources
  {
    name: "Harrison's Principles of Internal Medicine",
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Internal Medicine',
    metadata: {
      edition: '21st Edition',
      publisher: 'McGraw-Hill',
      authors: ['Kasper', 'Fauci', 'Hauser', 'Longo', 'Jameson', 'Loscalzo'],
      isbn: '978-1259644030',
      evidenceLevel: 'LEVEL_III',
    },
  },
  {
    name: 'Robbins and Cotran Pathologic Basis of Disease',
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Pathology',
    metadata: {
      edition: '10th Edition',
      publisher: 'Elsevier',
      authors: ['Kumar', 'Abbas', 'Aster'],
      isbn: '978-0323531139',
      evidenceLevel: 'LEVEL_III',
    },
  },
  {
    name: "Gray's Anatomy",
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Anatomy',
    metadata: {
      edition: '42nd Edition',
      publisher: 'Elsevier',
      isbn: '978-0702077050',
      evidenceLevel: 'LEVEL_III',
    },
  },
  {
    name: 'Guyton and Hall Textbook of Medical Physiology',
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Physiology',
    metadata: {
      edition: '14th Edition',
      publisher: 'Elsevier',
      authors: ['Hall', 'Hall'],
      isbn: '978-0323640039',
      evidenceLevel: 'LEVEL_III',
    },
  },
  {
    name: "Katzung's Basic & Clinical Pharmacology",
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Pharmacology',
    metadata: {
      edition: '15th Edition',
      publisher: 'McGraw-Hill',
      authors: ['Katzung', 'Trevor'],
      isbn: '978-1260452310',
      evidenceLevel: 'LEVEL_III',
    },
  },
  {
    name: 'Lippincott Illustrated Reviews: Biochemistry',
    type: SourceType.TEXTBOOK,
    credibilityScore: 85,
    medicalSpecialty: 'Biochemistry',
    metadata: {
      edition: '8th Edition',
      publisher: 'Wolters Kluwer',
      authors: ['Ferrier'],
      isbn: '978-1975161033',
      evidenceLevel: 'LEVEL_III',
    },
  },

  // LECTURE sources (placeholders - actual lectures added by users)
  {
    name: 'Medical School Lecture (Tier 1)',
    type: SourceType.LECTURE,
    credibilityScore: 85,
    medicalSpecialty: 'General',
    metadata: {
      tier: 'Tier_1',
      description: 'Top-tier medical schools (Johns Hopkins, Harvard, UCSF, etc.)',
      evidenceLevel: 'LEVEL_IV',
    },
  },
  {
    name: 'Medical School Lecture (Tier 2)',
    type: SourceType.LECTURE,
    credibilityScore: 75,
    medicalSpecialty: 'General',
    metadata: {
      tier: 'Tier_2',
      description: 'Mid-tier medical schools',
      evidenceLevel: 'LEVEL_IV',
    },
  },
  {
    name: 'Medical School Lecture (Tier 3)',
    type: SourceType.LECTURE,
    credibilityScore: 70,
    medicalSpecialty: 'General',
    metadata: {
      tier: 'Tier_3',
      description: 'Lower-tier medical schools or unverified sources',
      evidenceLevel: 'LEVEL_V',
    },
  },

  // USER_NOTES (placeholder)
  {
    name: 'User-Generated Notes',
    type: SourceType.USER_NOTES,
    credibilityScore: 50,
    medicalSpecialty: 'General',
    metadata: {
      description: 'Personal study notes and annotations',
      evidenceLevel: 'LEVEL_V',
      peerReviewed: false,
    },
  },
]

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Seeding source credibility database...')

  for (const sourceData of SOURCES) {
    try {
      const source = await prisma.source.upsert({
        where: { name: sourceData.name },
        update: {
          credibilityScore: sourceData.credibilityScore,
          medicalSpecialty: sourceData.medicalSpecialty,
          metadata: sourceData.metadata,
          lastUpdated: new Date(),
        },
        create: {
          name: sourceData.name,
          type: sourceData.type,
          credibilityScore: sourceData.credibilityScore,
          medicalSpecialty: sourceData.medicalSpecialty,
          metadata: sourceData.metadata,
          lastUpdated: new Date(),
        },
      })

      console.log(`✅ ${source.name} (${source.type}, score: ${source.credibilityScore})`)
    } catch (error) {
      console.error(`❌ Failed to seed ${sourceData.name}:`, error)
    }
  }

  console.log('✨ Source seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
