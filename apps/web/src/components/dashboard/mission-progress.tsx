// Legacy design-tokens removed; use app tokens/utilities instead.

interface MissionProgressProps {
  current: number;
  total: number;
}

export function MissionProgress({ current, total }: MissionProgressProps) {
  const progress = total === 0 ? 0 : (current / total) * 100;

  return (
    <div className="w-full bg-muted rounded-full h-2.5 mb-2">
      <div
        className="h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: colors.info,
        }}
      ></div>
    </div>
  );
}
