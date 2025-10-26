// apps/web/src/components/dashboard/whats-next-card.tsx
'use client';

import * as React from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockWhatsNextActions, WhatsNextAction } from '@/lib/mock-dashboard-data';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';
import { AnimatedCard } from './animated-card';

export function WhatsNextCard() {
  const [action, setAction] = React.useState<WhatsNextAction | null>(null);

  React.useEffect(() => {
    // Select a random action on component mount
    const randomAction = mockWhatsNextActions[Math.floor(Math.random() * mockWhatsNextActions.length)];
    setAction(randomAction);
  }, []);

  if (!action) {
    return null; // or a loading skeleton
  }

  return (
    <AnimatedCard className="bg-white/95 backdrop-blur-xl shadow-[0_4px_16px_rgba(31,38,135,0.06)] border-none rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl flex items-center justify-center">
             <Icon name={action.icon as any} className="text-primary" size={24} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold font-heading">{action.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{action.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full font-bold text-lg py-6 rounded-xl">
          <Link href={action.href}>
            {action.buttonText}
          </Link>
        </Button>
      </CardContent>
    </AnimatedCard>
  );
}
