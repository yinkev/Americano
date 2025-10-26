// apps/web/src/lib/mock-dashboard-data.ts

export interface WhatsNextAction {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  icon: string; // Placeholder for a lucide-react icon name
}

export interface KnowledgeMapSubject {
  id: string;
  name: string;
  progress: number; // 0 to 100
  size: number; // Represents the size of the "planet"
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Placeholder for an icon or image URL
}

export const mockWhatsNextActions: WhatsNextAction[] = [
  {
    id: '1',
    title: "Ready to conquer Cardiology?",
    description: "Let's start with a 10-minute quiz on heart murmurs.",
    buttonText: "Let's Go!",
    href: '/study/quiz/cardiology-murmurs',
    icon: 'HeartPulse',
  },
  {
    id: '2',
    title: "You're on a 3-day streak!",
    description: "Keep the flame alive by reviewing 15 flashcards on renal physiology.",
    buttonText: "Keep Streak!",
    href: '/study/flashcards/renal-physiology',
    icon: 'Flame',
  },
];

export const mockKnowledgeMap: KnowledgeMapSubject[] = [
  { id: '1', name: 'Cardiology', progress: 75, size: 80 },
  { id: '2', name: 'Neurology', progress: 50, size: 60 },
  { id: '3', name: 'Pharmacology', progress: 90, size: 95 },
  { id: '4', name: 'Anatomy', progress: 25, size: 40 },
  { id: '5', name: 'Biochemistry', progress: 60, size: 70 },
];

export const mockAchievements: Achievement[] = [
  { id: '1', title: 'Anatomy Expert', description: 'Mastered the basics of anatomy.', icon: '/assets/icons/achievements/anatomy-expert.svg' },
  { id: '2', title: 'Perfect Quiz Score', description: 'Scored 100% on a quiz.', icon: '/assets/icons/achievements/perfect-score.svg' },
  { id: '3', title: '5-Day Study Streak', description: 'Studied for 5 consecutive days.', icon: '/assets/icons/achievements/streak-5.svg' },
  { id: '4', title: 'Pharmacology Whiz', description: 'Completed the pharmacology module.', icon: '/assets/icons/achievements/pharma-whiz.svg' },
];

export const mockWeakAreas: { id: string; name: string; href: string }[] = [
    { id: '1', name: 'Cardiac Glycosides', href: '/library/pharmacology/cardiac-glycosides' },
    { id: '2', name: 'Cranial Nerves', href: '/library/anatomy/cranial-nerves' },
    { id: '3', name: 'Krebs Cycle', href: '/library/biochemistry/krebs-cycle' },
];
