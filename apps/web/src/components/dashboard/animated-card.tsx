// apps/web/src/components/dashboard/animated-card.tsx
'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';

export const AnimatedCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Card className={className}>
        {children}
      </Card>
    </motion.div>
  );
};
