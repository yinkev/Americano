import { Card, CardContent } from '@/components/ui/card';
import { typography, colors, transitions, shadows, borderRadius, glassmorphism } from '@/lib/design-tokens';

export function StatCard({ title, value, unit, icon, color, secondaryValue, secondaryLabel, footer }) {
  const cardColor = colors[color] || colors.clinical;

  return (
    <Card
      className={`${glassmorphism.light} hover:shadow-lg transition-all`}
      style={{
        borderRadius: borderRadius.xl,
        transition: transitions.medium,
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="rounded-full p-3"
            style={{ backgroundColor: `oklch(from ${cardColor} l c h / 0.1)` }}
          >
            <div style={{ color: cardColor }}>{icon}</div>
          </div>
          <div className="text-right">
            <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>{secondaryLabel}</p>
            <p className={`${typography.body.small} font-semibold text-foreground`}>
              {secondaryValue}
            </p>
          </div>
        </div>
        <h3 className={`${typography.body.small} font-medium text-muted-foreground mb-1`}>
          {title}
        </h3>
        <p className="text-[32px] font-heading font-bold text-foreground">
          {value}
          {unit && <span className="text-[16px] text-muted-foreground ml-2">{unit}</span>}
        </p>
        {footer && <p className={`${typography.body.tiny} text-muted-foreground mt-2`}>{footer}</p>}
      </CardContent>
    </Card>
  );
}
