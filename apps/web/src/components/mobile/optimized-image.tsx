'use client'

import Image, { type ImageProps } from 'next/image'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string
  alt: string
  className?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number
  blur?: boolean
}

/**
 * OptimizedImage - Performance-optimized image component for mobile
 *
 * Features:
 * - Next.js Image optimization (WebP/AVIF)
 * - Lazy loading by default
 * - Blur placeholder for better UX
 * - Responsive sizing
 * - Low quality image placeholder (LQIP)
 */
export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  loading = 'lazy',
  quality = 75,
  blur = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        {...props}
        priority={priority}
        loading={priority ? undefined : loading}
        quality={quality}
        placeholder={blur ? 'blur' : 'empty'}
        blurDataURL={
          blur
            ? 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=='
            : undefined
        }
        onLoad={() => setIsLoading(false)}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-sm' : 'scale-100 blur-0',
        )}
      />
    </div>
  )
}

/**
 * LazyImage - Intersection Observer based lazy loading
 */
export function LazyImage({
  src,
  alt,
  className,
  threshold = 0.1,
  ...props
}: OptimizedImageProps & { threshold?: number }) {
  const [isInView, setIsInView] = React.useState(false)
  const imgRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={imgRef} className={className}>
      {isInView ? (
        <OptimizedImage src={src} alt={alt} {...props} />
      ) : (
        <div className="w-full h-full bg-muted/20 animate-pulse" />
      )}
    </div>
  )
}
