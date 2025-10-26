'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  lectureId: string
  fileName: string
}

export function PDFViewer({ lectureId, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>('1')
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)

  const pdfUrl = `/api/content/lectures/${lectureId}/pdf`

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
    setPageInput('1')
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => {
      const newPage = Math.max(1, prev - 1)
      setPageInput(newPage.toString())
      return newPage
    })
  }

  const goToNextPage = () => {
    setPageNumber((prev) => {
      const newPage = Math.min(numPages, prev + 1)
      setPageInput(newPage.toString())
      return newPage
    })
  }

  const handlePageInputChange = (value: string) => {
    setPageInput(value)
    const pageNum = parseInt(value, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum)
    }
  }

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInput, 10)
    if (isNaN(pageNum) || pageNum < 1 || pageNum > numPages) {
      setPageInput(pageNumber.toString())
    }
  }

  const handleZoomChange = (value: number[]) => {
    setScale(value[0])
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.1))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.1))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const fitToWidth = () => {
    setScale(1.5)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Enhanced Controls Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b bg-background/95  supports-[backdrop-filter]:bg-card">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous page</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onBlur={handlePageInputBlur}
                className="w-14 h-9 text-center text-sm"
                disabled={numPages === 0}
              />
              <span className="text-sm text-muted-foreground">/ {numPages}</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next page</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 flex-1">
              <Slider
                value={[scale]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={2.0}
                step={0.1}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={resetZoom} className="text-xs h-7 px-2">
                {Math.round(scale * 100)}%
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 2.0}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={rotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rotate clockwise</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fitToWidth}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to width</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-card p-4">
          <div className="flex justify-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96">
                  <p className="text-destructive">Failed to load PDF</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-none"
              />
            </Document>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
