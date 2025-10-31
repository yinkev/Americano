/**
 * First Aid Cross-Reference Components - Usage Examples
 *
 * This file contains practical examples of how to use the new First Aid components.
 * DO NOT import this file in production - it's for reference only.
 *
 * Epic 3 - Story 3.3
 * Created: 2025-10-17
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  FirstAidContextIndicator,
  FirstAidContextIndicatorGroup,
  FirstAidCrossReferencePanel,
  FirstAidCrossReferencePanelCompact,
  type FirstAidReference,
  FirstAidReferenceCard,
} from '@/components/first-aid'

// ============================================================================
// EXAMPLE 1: Complete Lecture Page with Sidebar Panel
// ============================================================================

export function ExampleLecturePage() {
  const router = useRouter()
  const conceptId = 'concept-cardiovascular-mi'

  // Mock data - replace with actual API call
  const references: FirstAidReference[] = [
    {
      guidelineId: 'fa-section-297',
      title: 'Myocardial Infarction',
      relevanceScore: 0.92,
      relatedConcepts: ['Coronary Artery Disease', 'Chest Pain', 'ECG Changes', 'Troponin'],
      pageNumber: 297,
      subsection: 'Cardiovascular > Pathology',
      isHighYield: true,
      system: 'Cardiology',
      snippet:
        'Acute coronary syndrome caused by thrombotic occlusion of coronary arteries leading to myocardial necrosis. Presents with crushing substernal chest pain...',
    },
    {
      guidelineId: 'fa-section-299',
      title: 'Heart Failure',
      relevanceScore: 0.73,
      relatedConcepts: ['Systolic Dysfunction', 'Diastolic Dysfunction', 'Edema'],
      pageNumber: 299,
      subsection: 'Cardiovascular > Pathology',
      isHighYield: false,
      system: 'Cardiology',
      snippet:
        'Inability of heart to meet metabolic demands of body. Can be left-sided or right-sided, systolic or diastolic...',
    },
    {
      guidelineId: 'fa-section-301',
      title: 'Acute Coronary Syndrome',
      relevanceScore: 0.88,
      relatedConcepts: ['Unstable Angina', 'NSTEMI', 'STEMI'],
      pageNumber: 301,
      subsection: 'Cardiovascular > Pathology',
      isHighYield: true,
      system: 'Cardiology',
      snippet:
        'Spectrum of conditions including unstable angina, NSTEMI, and STEMI. All caused by decreased blood flow to myocardium...',
    },
  ]

  return (
    <div className="flex gap-6 max-w-7xl mx-auto p-6">
      {/* Main Content Area */}
      <main className="flex-1">
        <article className="prose prose-sm max-w-none">
          <h1>Myocardial Infarction Lecture</h1>

          {/* Context Indicator Example - Inline */}
          <p>
            <FirstAidContextIndicator
              guidelineId="fa-section-297"
              title="Myocardial Infarction"
              pageNumber={297}
              isHighYield
              variant="badge"
              previewSnippet="Acute coronary syndrome caused by thrombotic occlusion..."
              onExpand={() => router.push('/first-aid/sections/fa-section-297')}
              className="mr-2"
            />
            is a life-threatening medical emergency characterized by the death of cardiac muscle
            tissue.
          </p>

          <h2>Pathophysiology</h2>
          <p>
            The underlying cause is typically atherosclerotic plaque rupture leading to thrombotic
            occlusion of a coronary artery.
          </p>

          <h2>Clinical Presentation</h2>
          <p>
            Patients typically present with severe substernal chest pain, often described as
            crushing or pressure-like, radiating to the left arm, jaw, or back.
          </p>

          {/* Context Indicator Group Example */}
          <div className="my-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <p className="text-sm font-medium mb-2">Related First Aid Topics:</p>
            <FirstAidContextIndicatorGroup
              indicators={references.map((ref) => ({
                guidelineId: ref.guidelineId,
                title: ref.title,
                pageNumber: ref.pageNumber,
                isHighYield: ref.isHighYield,
                relevanceScore: ref.relevanceScore,
                previewSnippet: ref.snippet,
                onExpand: () => router.push(`/first-aid/sections/${ref.guidelineId}`),
              }))}
              maxVisible={3}
              variant="badge"
              onViewAll={() => console.log('View all references')}
            />
          </div>

          <h2>Diagnosis</h2>
          <p>
            Diagnosis is confirmed through ECG changes (ST-segment elevation or depression) and
            elevated cardiac biomarkers (troponin, CK-MB).
          </p>

          <h2>Treatment</h2>
          <p>
            Immediate treatment includes MONA (Morphine, Oxygen, Nitroglycerin, Aspirin) followed by
            reperfusion therapy (PCI or thrombolytics).
          </p>
        </article>
      </main>

      {/* Sidebar with First Aid References */}
      <aside className="w-96 shrink-0">
        <FirstAidCrossReferencePanel
          conceptId={conceptId}
          position="sidebar"
          references={references}
          isLoading={false}
          onReferenceClick={(guidelineId) => {
            router.push(`/first-aid/sections/${guidelineId}`)
          }}
        />
      </aside>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Individual Reference Card Usage
// ============================================================================

export function ExampleReferenceCardGrid() {
  const router = useRouter()

  const references: FirstAidReference[] = [
    {
      guidelineId: 'fa-1',
      title: 'Myocardial Infarction',
      relevanceScore: 0.92,
      relatedConcepts: ['CAD', 'Chest Pain', 'ECG'],
      pageNumber: 297,
      isHighYield: true,
      system: 'Cardiology',
      snippet: 'Acute coronary syndrome...',
    },
    {
      guidelineId: 'fa-2',
      title: 'Heart Failure',
      relevanceScore: 0.73,
      relatedConcepts: ['Systolic Dysfunction', 'Edema'],
      pageNumber: 299,
      isHighYield: false,
      system: 'Cardiology',
      snippet: 'Inability of heart...',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      {references.map((ref) => (
        <FirstAidReferenceCard
          key={ref.guidelineId}
          guidelineId={ref.guidelineId}
          title={ref.title}
          relevanceScore={ref.relevanceScore}
          relatedConcepts={ref.relatedConcepts}
          pageNumber={ref.pageNumber}
          subsection={ref.subsection}
          isHighYield={ref.isHighYield}
          system={ref.system}
          snippet={ref.snippet}
          onNavigate={() => router.push(`/first-aid/sections/${ref.guidelineId}`)}
        />
      ))}
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Context Indicator Variants
// ============================================================================

export function ExampleContextIndicatorVariants() {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <div className="space-y-8 p-6">
      {/* Badge Variant */}
      <div>
        <h3 className="text-sm font-medium mb-2">Badge Variant</h3>
        <FirstAidContextIndicator
          guidelineId="fa-297"
          title="Myocardial Infarction"
          pageNumber={297}
          isHighYield
          variant="badge"
          showTooltip
          previewSnippet="Acute coronary syndrome caused by thrombotic occlusion of coronary arteries leading to myocardial necrosis."
          onExpand={() => setShowPanel(true)}
        />
      </div>

      {/* Icon Variant */}
      <div>
        <h3 className="text-sm font-medium mb-2">Icon Variant</h3>
        <FirstAidContextIndicator
          guidelineId="fa-299"
          title="Heart Failure"
          pageNumber={299}
          isHighYield={false}
          relevanceScore={0.73}
          variant="icon"
          showTooltip
          previewSnippet="Inability of heart to meet metabolic demands of body. Can be left-sided or right-sided."
          onExpand={() => setShowPanel(true)}
        />
      </div>

      {/* Inline Variant */}
      <div>
        <h3 className="text-sm font-medium mb-2">Inline Variant</h3>
        <p className="text-sm">
          Patients with acute coronary syndrome{' '}
          <FirstAidContextIndicator
            guidelineId="fa-301"
            title="Acute Coronary Syndrome"
            pageNumber={301}
            isHighYield
            variant="inline"
            showTooltip
            previewSnippet="Spectrum of conditions including unstable angina, NSTEMI, and STEMI."
            onExpand={() => setShowPanel(true)}
          />{' '}
          require immediate medical attention.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: Mobile Compact View
// ============================================================================

export function ExampleMobileView() {
  const router = useRouter()
  const conceptId = 'concept-mi'

  const references: FirstAidReference[] = [
    {
      guidelineId: 'fa-1',
      title: 'Myocardial Infarction',
      relevanceScore: 0.92,
      relatedConcepts: ['CAD', 'Chest Pain'],
      pageNumber: 297,
      isHighYield: true,
    },
    {
      guidelineId: 'fa-2',
      title: 'Heart Failure',
      relevanceScore: 0.73,
      relatedConcepts: ['Edema'],
      pageNumber: 299,
      isHighYield: false,
    },
  ]

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Myocardial Infarction</h2>

      {/* Lecture content */}
      <div className="mb-6">
        <p className="text-sm">Acute coronary syndrome caused by thrombotic occlusion...</p>
      </div>

      {/* Compact panel for mobile */}
      <FirstAidCrossReferencePanelCompact
        conceptId={conceptId}
        references={references}
        isLoading={false}
        onReferenceClick={(guidelineId) => {
          router.push(`/first-aid/sections/${guidelineId}`)
        }}
      />
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: With Loading States
// ============================================================================

export function ExampleLoadingStates() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold">Loading State Example</h2>

      {/* Panel with loading state */}
      <FirstAidCrossReferencePanel
        conceptId="concept-loading"
        position="sidebar"
        isLoading={isLoading}
        className="w-96"
      />

      <button
        onClick={() => setIsLoading(!isLoading)}
        className="px-4 py-2 bg-primary text-white rounded-md"
      >
        Toggle Loading
      </button>
    </div>
  )
}

// ============================================================================
// EXAMPLE 6: With Error States
// ============================================================================

export function ExampleErrorStates() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold">Error State Example</h2>

      {/* Panel with error state */}
      <FirstAidCrossReferencePanel
        conceptId="concept-error"
        position="sidebar"
        error="Failed to load First Aid references. Please try again."
        className="w-96"
      />
    </div>
  )
}

// ============================================================================
// EXAMPLE 7: With Empty States
// ============================================================================

export function ExampleEmptyStates() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold">Empty State Example</h2>

      {/* Panel with no references */}
      <FirstAidCrossReferencePanel
        conceptId="concept-empty"
        position="sidebar"
        references={[]}
        isLoading={false}
        className="w-96"
      />
    </div>
  )
}

// ============================================================================
// EXAMPLE 8: Custom API Integration Hook
// ============================================================================

/**
 * Example custom hook for fetching First Aid references
 * Replace with actual API implementation
 */
function useFirstAidReferences(conceptId: string) {
  const [references, setReferences] = useState<FirstAidReference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulated API call
  React.useEffect(() => {
    setIsLoading(true)

    // Replace with actual fetch
    fetch(`/api/first-aid/mappings/${conceptId}`)
      .then((res) => res.json())
      .then((data) => {
        setReferences(data.references)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [conceptId])

  return { references, isLoading, error }
}

export function ExampleWithAPIHook() {
  const router = useRouter()
  const conceptId = 'concept-cardiovascular-mi'

  const { references, isLoading, error } = useFirstAidReferences(conceptId)

  return (
    <div className="flex gap-6 p-6">
      <main className="flex-1">
        <h1>Lecture Content</h1>
        {/* Content here */}
      </main>

      <aside className="w-96">
        <FirstAidCrossReferencePanel
          conceptId={conceptId}
          position="sidebar"
          references={references}
          isLoading={isLoading}
          error={error}
          onReferenceClick={(guidelineId) => {
            router.push(`/first-aid/sections/${guidelineId}`)
          }}
        />
      </aside>
    </div>
  )
}

// ============================================================================
// EXAMPLE 9: Inline Panel in Content
// ============================================================================

export function ExampleInlinePanel() {
  const router = useRouter()

  const references: FirstAidReference[] = [
    {
      guidelineId: 'fa-1',
      title: 'Myocardial Infarction',
      relevanceScore: 0.92,
      relatedConcepts: ['CAD', 'Chest Pain', 'ECG'],
      pageNumber: 297,
      isHighYield: true,
      system: 'Cardiology',
      snippet: 'Acute coronary syndrome...',
    },
  ]

  return (
    <article className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Cardiovascular Pathology</h1>

      <p>Introduction to cardiovascular pathology...</p>

      {/* Inline panel within content */}
      <div className="my-8">
        <FirstAidCrossReferencePanel
          conceptId="concept-cardio"
          position="inline"
          references={references}
          maxHeight="400px"
          onReferenceClick={(guidelineId) => {
            router.push(`/first-aid/sections/${guidelineId}`)
          }}
        />
      </div>

      <p>Continued lecture content...</p>
    </article>
  )
}

// ============================================================================
// EXAMPLE 10: Dashboard Widget
// ============================================================================

export function ExampleDashboardWidget() {
  const router = useRouter()

  const topReferences: FirstAidReference[] = [
    {
      guidelineId: 'fa-1',
      title: 'Myocardial Infarction',
      relevanceScore: 0.92,
      relatedConcepts: ['CAD'],
      pageNumber: 297,
      isHighYield: true,
    },
    {
      guidelineId: 'fa-2',
      title: 'Heart Failure',
      relevanceScore: 0.88,
      relatedConcepts: ['Edema'],
      pageNumber: 299,
      isHighYield: true,
    },
    {
      guidelineId: 'fa-3',
      title: 'Arrhythmias',
      relevanceScore: 0.85,
      relatedConcepts: ['ECG'],
      pageNumber: 305,
      isHighYield: false,
    },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">High-Yield First Aid Topics</h3>
        <button
          onClick={() => router.push('/first-aid')}
          className="text-sm text-primary hover:underline"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {topReferences.slice(0, 3).map((ref) => (
          <div
            key={ref.guidelineId}
            className="flex items-center justify-between p-3 rounded-lg border border-white/40 hover:bg-white/60 cursor-pointer transition-colors"
            onClick={() => router.push(`/first-aid/sections/${ref.guidelineId}`)}
          >
            <div className="flex items-center gap-2">
              {ref.isHighYield && <span className="text-yellow-600">⭐</span>}
              <div>
                <p className="text-sm font-medium">{ref.title}</p>
                <p className="text-xs text-muted-foreground">
                  Page {ref.pageNumber} • {Math.round(ref.relevanceScore * 100)}% match
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
