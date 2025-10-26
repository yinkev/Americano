/**
 * LearningArticleReader Component
 * Story 5.6: Behavioral Insights Dashboard - Task 6 (Learning Science Education)
 *
 * Epic 5 UI Transformation:
 * - OKLCH colors for category badges and reading indicators (no gradients)
 * - Design tokens from /lib/design-tokens.ts
 * - Typography system (font-heading, precise text sizes)
 * - Glassmorphism effects (bg-card )
 *
 * Displays learning science articles with personalized content.
 * Features:
 * - Article selector dropdown (5 articles)
 * - Reading time indicator
 * - Personalized markdown content rendering
 * - Expandable sources section
 * - Related patterns chips
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { typography, colors } from '@/lib/design-tokens'

type ArticleCategory =
  | 'MEMORY'
  | 'ATTENTION'
  | 'MOTIVATION'
  | 'METACOGNITION'
  | 'LEARNING_STRATEGIES'

interface LearningArticle {
  id: string
  title: string
  category: ArticleCategory
  content: string
  readingTime: number
  sources: string[]
  relatedPatterns: string[]
  personalizedContent: string
}

interface LearningArticleReaderProps {
  userId: string
  isLoading?: boolean
}

// Seed article IDs
const SEED_ARTICLES = [
  { id: 'spacing-effect-science', label: 'The Spacing Effect' },
  { id: 'cognitive-load-theory', label: 'Cognitive Load Theory' },
  { id: 'forgetting-curve-application', label: 'Forgetting Curve Application' },
  { id: 'metacognitive-awareness', label: 'Metacognitive Awareness' },
  { id: 'interleaved-practice-benefits', label: 'Interleaved Practice Benefits' },
]

// Category styling
const CATEGORY_CONFIG: Record<ArticleCategory, { label: string; color: string }> = {
  MEMORY: {
    label: 'Memory',
    color: 'bg-blue-600 text-white',
  },
  ATTENTION: {
    label: 'Attention',
    color: 'bg-purple-600 text-white',
  },
  MOTIVATION: {
    label: 'Motivation',
    color: 'bg-green-600 text-white',
  },
  METACOGNITION: {
    label: 'Metacognition',
    color: 'bg-orange-600 text-white',
  },
  LEARNING_STRATEGIES: {
    label: 'Learning Strategies',
    color: 'bg-pink-600 text-white',
  },
}

// Simple markdown-to-HTML renderer (basic support)
const renderMarkdown = (markdown: string): string => {
  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Lists
  html = html.replace(/^\* (.+)$/gim, '<li class="ml-4">$1</li>')
  html = html.replace(/^- (.+)$/gim, '<li class="ml-4">$1</li>')
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-2 my-4">$1</ul>')

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-4">')
  html = '<p class="mb-4">' + html + '</p>'

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  return html
}

export function LearningArticleReader({
  userId,
  isLoading: isLoadingProp = false,
}: LearningArticleReaderProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(SEED_ARTICLES[0].id)
  const [article, setArticle] = useState<LearningArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourcesExpanded, setSourcesExpanded] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/analytics/behavioral-insights/learning-science/${selectedArticleId}?userId=${userId}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch article')
        }

        const data = await response.json()
        if (data.success && data.article) {
          setArticle(data.article)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [selectedArticleId, userId])

  // Error state
  if (error) {
    return (
      <Card
        className="bg-card  shadow-none border"
        style={{ borderColor: colors.alert }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 mb-4" style={{ color: colors.alert }} />
          <h3 className={`${typography.heading.h3} mb-2`}>Error Loading Article</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center`}>{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading || isLoadingProp) {
    return (
      <Card className="bg-card  shadow-none animate-pulse">
        <CardHeader>
          <div className="h-8 rounded w-1/4 mb-4" style={{ backgroundColor: 'oklch(0.9 0.02 230)' }} />
          <div className="h-6 rounded w-1/3 mb-2" style={{ backgroundColor: 'oklch(0.91 0.02 230)' }} />
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
            <div className="h-4 rounded w-full" style={{ backgroundColor: 'oklch(0.93 0.02 230)' }} />
            <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'oklch(0.94 0.02 230)' }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!article) {
    return null
  }

  const categoryConfig = CATEGORY_CONFIG[article.category]
  const renderedContent = renderMarkdown(article.personalizedContent || article.content)

  return (
    <Card className="bg-card  shadow-none">
      <CardHeader>
        <div className="space-y-4">
          {/* Article Selector */}
          <div className="flex items-center gap-4">
            <BookOpen className="size-5 text-muted-foreground" />
            <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEED_ARTICLES.map((seedArticle) => (
                  <SelectItem key={seedArticle.id} value={seedArticle.id}>
                    {seedArticle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Article Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className={typography.heading.h2}>{article.title}</CardTitle>
              <Badge className={categoryConfig.color}>{categoryConfig.label}</Badge>
            </div>
            <div className={`flex items-center gap-2 ${typography.body.small} text-muted-foreground`}>
              <Clock className="size-4" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Article Content */}
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* Related Patterns */}
        {article.relatedPatterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Related Patterns</h3>
            <div className="flex flex-wrap gap-2">
              {article.relatedPatterns.map((pattern, index) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sources Section */}
        {article.sources.length > 0 && (
          <div className="border-t pt-4">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              {sourcesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Sources ({article.sources.length})
            </button>
            {sourcesExpanded && (
              <ol className="space-y-2 pl-6">
                {article.sources.map((source, index) => (
                  <li key={index} className="text-sm text-muted-foreground list-decimal">
                    {source}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
