// apps/web/src/components/dashboard/knowledge-map.tsx
'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockKnowledgeMap } from '@/lib/mock-dashboard-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCard } from './animated-card';

const colors = [
  'oklch(0.7 0.15 230)', // blue
  'oklch(0.7 0.15 130)', // green
  'oklch(0.7 0.15 30)',  // yellow
  'oklch(0.7 0.15 330)', // red
  'oklch(0.7 0.15 280)', // purple
];

export function KnowledgeMap() {
  return (
    <AnimatedCard className="bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,.06)] border-none rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-heading">Your Knowledge Map</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="relative w-full h-80 flex items-center justify-center">
            {mockKnowledgeMap.map((subject, index) => (
              <Tooltip key={subject.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: `${subject.size}px`,
                      height: `${subject.size}px`,
                      backgroundColor: colors[index % colors.length],
                      x: `${Math.random() * 200 - 100}px`,
                      y: `${Math.random() * 200 - 100}px`,
                      opacity: subject.progress / 100,
                    }}
                    animate={{
                        x: [0, Math.random() * 200 - 100, 0],
                        y: [0, Math.random() * 200 - 100, 0],
                    }}
                    transition={{
                      duration: 10 + Math.random() * 10,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">{subject.name}</p>
                  <p>Progress: {subject.progress}%</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </AnimatedCard>
  );
}
