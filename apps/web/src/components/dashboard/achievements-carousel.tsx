// apps/web/src/components/dashboard/achievements-carousel.tsx
'use client';

import * as React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { mockAchievements } from '@/lib/mock-dashboard-data';
import Image from 'next/image';
import { AnimatedCard } from './animated-card';

export function AchievementsCarousel() {
  return (
    <AnimatedCard className="bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,0.06)] border-none rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-heading">Achievements Unlocked</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel className="w-full">
          <CarouselContent>
            {mockAchievements.map((achievement) => (
              <CarouselItem key={achievement.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200">
                    <Image src={achievement.icon} alt={achievement.title} width={64} height={64} />
                    <p className="font-bold mt-2">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </AnimatedCard>
  );
}
