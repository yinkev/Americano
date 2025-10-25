import { Card, CardContent } from '@/components/ui/card';
import { typography, colors, glassmorphism } from '@/lib/design-tokens';

interface ProgressStatsProps {
  streak: number;
  cardsReviewed: number;
  accuracy: number;
  points: number;
}

export function ProgressStats({ streak, cardsReviewed, accuracy, points }: ProgressStatsProps) {
  return (
    <Card className={`${glassmorphism.light} mb-8`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className={`${typography.body.small} text-muted-foreground mb-1`}>Day Streak</p>
            <p className={`${typography.heading.h2} text-foreground`}>{streak}</p>
          </div>
          <div className="text-center">
            <p className={`${typography.body.small} text-muted-foreground mb-1`}>Cards Reviewed</p>
            <p className={`${typography.heading.h2} text-foreground`}>{cardsReviewed}</p>
          </div>
          <div className="text-center">
            <p className={`${typography.body.small} text-muted-foreground mb-1`}>Accuracy</p>
            <p className={`${typography.heading.h2} text-foreground`}>{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className={`${typography.body.small} text-muted-foreground mb-1`}>Points Earned</p>
            <p className={`${typography.heading.h2} text-foreground`}>{points}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
