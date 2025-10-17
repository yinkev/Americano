'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface LearningStyleProfileProps {
  profile: {
    learningStyleProfile: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      reading: number;
    };
  };
}

export function LearningStyleProfile({ profile }: LearningStyleProfileProps) {
  const chartData = [
    {
      axis: 'Visual',
      value: Math.round(profile.learningStyleProfile.visual * 100),
      fullMark: 100,
    },
    {
      axis: 'Auditory',
      value: Math.round(profile.learningStyleProfile.auditory * 100),
      fullMark: 100,
    },
    {
      axis: 'Kinesthetic',
      value: Math.round(profile.learningStyleProfile.kinesthetic * 100),
      fullMark: 100,
    },
    {
      axis: 'Reading/Writing',
      value: Math.round(profile.learningStyleProfile.reading * 100),
      fullMark: 100,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="px-3 py-2 rounded-md shadow-lg"
          style={{
            backgroundColor: 'oklch(0.95 0.01 230)',
            border: '1px solid oklch(0.85 0.02 230)',
          }}
        >
          <p className="text-sm font-medium" style={{ color: 'oklch(0.3 0.08 230)' }}>
            {data.axis}
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.5 0.05 230)' }}>
            {data.value}% preference
          </p>
        </div>
      );
    }
    return null;
  };

  // Generate recommendations based on profile
  const getRecommendations = () => {
    const recommendations: string[] = [];
    const { visual, auditory, kinesthetic, reading } = profile.learningStyleProfile;

    if (visual > 0.4) {
      recommendations.push(
        `Your visual learning preference (${Math.round(visual * 100)}%) suggests focusing on knowledge graphs and diagram-based study materials.`
      );
    }

    if (kinesthetic > 0.4) {
      recommendations.push(
        `Your kinesthetic preference (${Math.round(kinesthetic * 100)}%) indicates clinical reasoning scenarios and hands-on practice are most effective for you.`
      );
    }

    if (auditory > 0.3) {
      recommendations.push(
        `With ${Math.round(auditory * 100)}% auditory preference, verbal explanation exercises and discussion-based learning would benefit you.`
      );
    }

    if (reading > 0.4) {
      recommendations.push(
        `Your reading/writing strength (${Math.round(reading * 100)}%) means traditional text-based lectures and note-taking will be particularly effective.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Your learning style is well-balanced. Continue using a variety of content types for optimal learning.'
      );
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="oklch(0.85 0.02 230)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'oklch(0.5 0.05 230)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'oklch(0.6 0.03 230)', fontSize: 10 }}
          />
          <Radar
            name="Learning Style"
            dataKey="value"
            stroke="oklch(0.5 0.2 280)"
            fill="oklch(0.7 0.15 280)"
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Percentages Display */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {chartData.map((item) => (
          <div
            key={item.axis}
            className="flex justify-between items-center p-2 rounded"
            style={{ backgroundColor: 'oklch(0.97 0.01 230)' }}
          >
            <span style={{ color: 'oklch(0.5 0.05 230)' }}>{item.axis}</span>
            <span
              className="font-semibold"
              style={{ color: 'oklch(0.4 0.15 280)' }}
            >
              {item.value}%
            </span>
          </div>
        ))}
      </div>

      {/* Content Recommendations */}
      <div
        className="p-4 rounded-md"
        style={{ backgroundColor: 'oklch(0.97 0.01 280)' }}
      >
        <h4
          className="text-sm font-semibold mb-2"
          style={{ color: 'oklch(0.4 0.15 280)' }}
        >
          Personalized Recommendations
        </h4>
        <ul className="space-y-2 text-sm" style={{ color: 'oklch(0.5 0.05 230)' }}>
          {recommendations.map((rec, index) => (
            <li key={index} className="flex gap-2">
              <span style={{ color: 'oklch(0.5 0.15 280)' }}>•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
