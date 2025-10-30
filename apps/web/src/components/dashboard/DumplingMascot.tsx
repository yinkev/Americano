'use client'

import React from 'react'

interface DumplingMascotProps {
  size?: number
  variant?: 'happy' | 'excited' | 'thinking' | 'sad' | 'sleeping'
  className?: string
}

/**
 * Dumpling Mascot Component
 *
 * Cute SVG mascot for the Americano dashboard
 * Supports multiple emotional states and sizes
 */
export function DumplingMascot({
  size = 48,
  variant = 'happy',
  className = '',
}: DumplingMascotProps) {
  const getExpressionPath = () => {
    switch (variant) {
      case 'excited':
        return {
          eyes: 'M25 35 Q25 38 28 38 Q31 38 31 35 Q31 32 28 32 Q25 32 25 35 M45 35 Q45 38 48 38 Q51 38 51 35 Q51 32 48 32 Q45 32 45 35',
          mouth: 'M30 48 Q38 54 46 48',
        }
      case 'thinking':
        return {
          eyes: 'M28 35 Q28 36 29 36 Q30 36 30 35 Q30 34 29 34 Q28 34 28 35 M46 35 Q46 36 47 36 Q48 36 48 35 Q48 34 47 34 Q46 34 46 35',
          mouth: 'M32 48 L44 48',
        }
      case 'sad':
        return {
          eyes: 'M28 36 Q28 37 29 37 Q30 37 30 36 Q30 35 29 35 Q28 35 28 36 M46 36 Q46 37 47 37 Q48 37 48 36 Q48 35 47 35 Q46 35 46 36',
          mouth: 'M30 52 Q38 48 46 52',
        }
      case 'sleeping':
        return {
          eyes: 'M26 36 L32 36 M44 36 L50 36',
          mouth: 'M34 48 Q38 50 42 48',
        }
      case 'happy':
      default:
        return {
          eyes: 'M28 35 Q28 37 29 37 Q30 37 30 35 Q30 33 29 33 Q28 33 28 35 M46 35 Q46 37 47 37 Q48 37 48 35 Q48 33 47 33 Q46 33 46 35',
          mouth: 'M30 48 Q38 52 46 48',
        }
    }
  }

  const expression = getExpressionPath()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Dumpling mascot looking ${variant}`}
    >
      {/* Main dumpling body */}
      <circle
        cx="38"
        cy="38"
        r="30"
        fill="oklch(0.95 0.02 85)"
        stroke="oklch(0.75 0.04 85)"
        strokeWidth="2"
      />

      {/* Dumpling folds */}
      <path
        d="M38 8 Q28 12 24 18 Q20 24 20 32"
        stroke="oklch(0.75 0.04 85)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 8 Q48 12 52 18 Q56 24 56 32"
        stroke="oklch(0.75 0.04 85)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 8 Q34 12 32 18"
        stroke="oklch(0.75 0.04 85)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 8 Q42 12 44 18"
        stroke="oklch(0.75 0.04 85)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <path
        d={expression.eyes}
        fill="oklch(0.30 0.02 260)"
        stroke="oklch(0.30 0.02 260)"
        strokeWidth="1"
      />

      {/* Mouth */}
      <path
        d={expression.mouth}
        stroke="oklch(0.30 0.02 260)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Blush */}
      {(variant === 'happy' || variant === 'excited') && (
        <>
          <circle cx="20" cy="42" r="4" fill="oklch(0.80 0.15 20)" opacity="0.4" />
          <circle cx="56" cy="42" r="4" fill="oklch(0.80 0.15 20)" opacity="0.4" />
        </>
      )}

      {/* Thinking bubble */}
      {variant === 'thinking' && (
        <>
          <circle cx="58" cy="20" r="2" fill="oklch(0.85 0.02 220)" opacity="0.6" />
          <circle cx="62" cy="16" r="3" fill="oklch(0.85 0.02 220)" opacity="0.6" />
          <circle cx="67" cy="13" r="5" fill="oklch(0.85 0.02 220)" opacity="0.6" />
        </>
      )}

      {/* Sparkles for excited */}
      {variant === 'excited' && (
        <>
          <path
            d="M12 20 L13 22 L15 23 L13 24 L12 26 L11 24 L9 23 L11 22 Z"
            fill="oklch(0.75 0.20 60)"
          />
          <path d="M62 24 L63 25 L64 24 L63 23 Z" fill="oklch(0.75 0.20 60)" />
        </>
      )}

      {/* Sleep zzz */}
      {variant === 'sleeping' && (
        <g opacity="0.6">
          <text
            x="58"
            y="22"
            fontSize="8"
            fill="oklch(0.50 0.02 220)"
            fontFamily="serif"
            fontStyle="italic"
          >
            z
          </text>
          <text
            x="64"
            y="16"
            fontSize="10"
            fill="oklch(0.50 0.02 220)"
            fontFamily="serif"
            fontStyle="italic"
          >
            z
          </text>
          <text
            x="70"
            y="10"
            fontSize="12"
            fill="oklch(0.50 0.02 220)"
            fontFamily="serif"
            fontStyle="italic"
          >
            Z
          </text>
        </g>
      )}
    </svg>
  )
}

/**
 * Animated floating variant for dashboard header
 */
export function FloatingDumplingMascot(props: DumplingMascotProps) {
  return (
    <div
      className="animate-float"
      style={{
        animation: 'float 3s ease-in-out infinite',
      }}
    >
      <DumplingMascot {...props} />
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
