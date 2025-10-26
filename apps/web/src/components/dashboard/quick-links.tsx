// apps/web/src/components/dashboard/quick-links.tsx
'use client';

import * as React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Library, Settings } from 'lucide-react';
import { AnimatedCard } from './animated-card';

const links = [
  { href: '/study', label: 'Start Studying', icon: BookOpen },
  { href: '/library', label: 'Browse Library', icon: Library },
  { href: '/settings', label: 'Adjust Settings', icon: Settings },
];

export function QuickLinks() {
  return (
    <AnimatedCard className="bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,0.06)] border-none rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-heading">Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {links.map((link) => (
          <Button asChild key={link.href} variant="ghost" className="justify-start gap-2 text-left h-auto py-3">
            <Link href={link.href}>
              <link.icon className="size-4 text-muted-foreground" />
              <span>{link.label}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </AnimatedCard>
  );
}
