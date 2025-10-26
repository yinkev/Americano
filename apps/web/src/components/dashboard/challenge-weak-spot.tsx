// apps/web/src/components/dashboard/challenge-weak-spot.tsx
'use client';

import * as React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockWeakAreas } from '@/lib/mock-dashboard-data';
import Link from 'next/link';
import { AnimatedCard } from './animated-card';

export function ChallengeWeakSpot() {
  const [weakArea, setWeakArea] = React.useState<{ id: string; name: string; href: string } | null>(null);

  React.useEffect(() => {
    // Select a random weak area on component mount
    const randomWeakArea = mockWeakAreas[Math.floor(Math.random() * mockWeakAreas.length)];
    setWeakArea(randomWeakArea);
  }, []);

  if (!weakArea) {
    return null; // or a loading skeleton
  }

  return (
    <AnimatedCard className="bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,0.06)] border-none rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-heading">Challenge a Weak Spot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200">
            <p className="font-bold text-lg">{weakArea.name}</p>
            <Button asChild className="w-full mt-4 font-bold rounded-xl">
                <Link href={weakArea.href}>
                    Review Topic
                </Link>
            </Button>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
