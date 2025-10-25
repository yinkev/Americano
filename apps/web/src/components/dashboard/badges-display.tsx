import { useState } from 'react';
import { Trophy, Flame, Target } from 'lucide-react';
import { typography, colors } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';

interface BadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const Badge = ({ icon, title, description, color }: BadgeProps) => (
  <div className="flex items-center space-x-3 p-3 rounded-lg"
       style={{ backgroundColor: `oklch(from ${colors[color]} l c h / 0.1)` }}>
    <div style={{ color: colors[color] }}>{icon}</div>
    <div>
      <p className={`${typography.body.small} font-semibold`} style={{ color: colors[color] }}>{title}</p>
      <p className={`${typography.body.tiny} text-muted-foreground`}>{description}</p>
    </div>
  </div>
);

export function BadgesDisplay() {
  const [isExpanded, setIsExpanded] = useState(false);

  const allBadges = [
    {
      icon: <Flame className="size-6" />,
      title: "7-Day Streak",
      description: "Maintained study streak for 7 consecutive days",
      color: "energy",
    },
    {
      icon: <Trophy className="size-6" />,
      title: "Mission Master",
      description: "Completed 100 missions with high accuracy",
      color: "success",
    },
    {
      icon: <Target className="size-6" />,
      title: "Accuracy Ace",
      description: "Achieved 90%+ accuracy on 500+ cards",
      color: "info",
    },
  ];

  const displayedBadges = isExpanded ? allBadges : allBadges.slice(0, 2);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedBadges.map((badge, index) => (
          <Badge key={index} {...badge} />
        ))}
      </div>
      {allBadges.length > 2 && (
        <div className="text-center mt-4">
          <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Show less' : 'Show all'}
          </Button>
        </div>
      )}
    </div>
  );
}
