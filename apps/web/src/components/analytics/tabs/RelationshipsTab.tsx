/**
 * RelationshipsTab Component
 * Story 4.6 Task 7: Cross-Objective Understanding Relationships
 *
 * Visualizes how understanding in one learning objective affects others through:
 * - Correlation Heatmap: Interactive matrix showing relationship strength
 * - Foundational Objectives: High-correlation concepts that enable others
 * - Bottleneck Objectives: Low-performing concepts that block progress
 * - Network Graph: Force-directed visualization of dependencies
 * - Strategic Study Sequence: AI-recommended study order
 *
 * Design: Glassmorphism cards with OKLCH colors, responsive layout
 * Charts: Recharts for heatmap, D3.js for network graph
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCorrelations } from '@/hooks/use-understanding-analytics';
import { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as d3 from 'd3';
import { AlertCircle, TrendingUp, Link2, ArrowRight } from 'lucide-react';

export default function RelationshipsTab() {
  const { data, isLoading, error } = useCorrelations();
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
    correlation: number;
  } | null>(null);

  if (isLoading) {
    return <RelationshipsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-[oklch(0.65_0.20_25)]">
          <AlertCircle className="w-6 h-6" />
          <p>Failed to load relationship data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Correlation Heatmap */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Correlation Heatmap</CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Click cells to explore relationships between learning objectives
          </p>
        </CardHeader>
        <CardContent>
          <CorrelationHeatmap
            matrix={data.correlationMatrix}
            labels={data.objectiveNames}
            onCellClick={setSelectedCell}
          />

          {/* Selected Cell Details */}
          {selectedCell && (
            <div className="mt-4 p-4 rounded-xl bg-[oklch(0.95_0.05_240)] border border-[oklch(0.85_0.05_240)]">
              <p className="text-sm font-medium text-[oklch(0.4_0.05_240)]">
                <span className="font-bold">{data.objectiveNames[selectedCell.x]}</span>
                {' ↔ '}
                <span className="font-bold">{data.objectiveNames[selectedCell.y]}</span>
              </p>
              <p className="text-xs text-[oklch(0.5_0.05_240)] mt-1">
                Correlation: {selectedCell.correlation.toFixed(3)}{' '}
                {selectedCell.correlation > 0.7
                  ? '(Strong positive)'
                  : selectedCell.correlation > 0.4
                    ? '(Moderate positive)'
                    : selectedCell.correlation > 0
                      ? '(Weak positive)'
                      : selectedCell.correlation < -0.4
                        ? '(Negative)'
                        : '(Weak/None)'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Foundational & Bottleneck Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foundational Objectives */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[oklch(0.7_0.15_145)]" />
              <CardTitle className="text-lg font-semibold">Foundational Objectives</CardTitle>
            </div>
            <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
              Master these to unlock understanding in multiple areas
            </p>
          </CardHeader>
          <CardContent>
            {data.foundational.length === 0 ? (
              <p className="text-sm text-[oklch(0.6_0.05_240)] text-center py-4">
                No foundational objectives identified yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.foundational.map((obj) => (
                  <div
                    key={obj.objectiveId}
                    className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.97_0.05_145)] border border-[oklch(0.85_0.10_145)]"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[oklch(0.4_0.05_240)]">
                        {obj.objectiveName}
                      </p>
                      <p className="text-xs text-[oklch(0.5_0.05_240)] mt-0.5">
                        Enables {obj.outgoingCorrelations} other objectives
                      </p>
                    </div>
                    <Badge
                      className="bg-[oklch(0.7_0.15_145)] text-white border-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Foundational: ${obj.outgoingCorrelations} connections`}
                    >
                      +{obj.outgoingCorrelations}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottleneck Objectives */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[oklch(0.65_0.20_25)]" />
              <CardTitle className="text-lg font-semibold">Bottleneck Objectives</CardTitle>
            </div>
            <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
              Address these to unblock progress in dependent areas
            </p>
          </CardHeader>
          <CardContent>
            {data.bottlenecks.length === 0 ? (
              <p className="text-sm text-[oklch(0.6_0.05_240)] text-center py-4">
                No bottlenecks detected - great progress!
              </p>
            ) : (
              <div className="space-y-3">
                {data.bottlenecks.map((obj) => (
                  <div
                    key={obj.objectiveId}
                    className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.97_0.10_25)] border border-[oklch(0.85_0.15_25)]"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[oklch(0.4_0.05_240)]">
                        {obj.objectiveName}
                      </p>
                      <p className="text-xs text-[oklch(0.5_0.05_240)] mt-0.5">
                        Blocking {obj.blockingCount} dependent areas
                      </p>
                    </div>
                    <Badge
                      className="bg-[oklch(0.65_0.20_25)] text-white border-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Bottleneck: ${obj.blockingCount} blocked areas`}
                    >
                      !{obj.blockingCount}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Network Graph Visualization */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[oklch(0.6_0.18_230)]" />
            <CardTitle className="text-lg font-semibold">Understanding Network</CardTitle>
          </div>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Interactive visualization of objective dependencies (node size = importance, edge thickness = correlation)
          </p>
        </CardHeader>
        <CardContent>
          <NetworkGraph
            matrix={data.correlationMatrix}
            labels={data.objectiveNames}
            foundational={data.foundational.map((f) => f.objectiveId)}
            bottlenecks={data.bottlenecks.map((b) => b.objectiveId)}
          />
        </CardContent>
      </Card>

      {/* Strategic Study Sequence */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-[oklch(0.6_0.18_280)]" />
            <CardTitle className="text-lg font-semibold">Strategic Study Sequence</CardTitle>
          </div>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            AI-recommended learning order to maximize understanding
          </p>
        </CardHeader>
        <CardContent>
          {data.sequence.length === 0 ? (
            <p className="text-sm text-[oklch(0.6_0.05_240)] text-center py-4">
              Complete more objectives to generate study sequence recommendations
            </p>
          ) : (
            <div className="space-y-2">
              {data.sequence.map((step, idx) => (
                <div
                  key={step.objectiveId}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[oklch(0.98_0.02_240)] hover:bg-[oklch(0.96_0.03_240)] transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[oklch(0.6_0.18_280)] text-white font-bold text-sm flex-shrink-0">
                    {step.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[oklch(0.4_0.05_240)]">
                      {step.objectiveName}
                    </p>
                    <p className="text-xs text-[oklch(0.5_0.05_240)] mt-1">
                      {step.reasoning}
                    </p>
                  </div>
                  {idx < data.sequence.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-[oklch(0.7_0.05_240)] flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Correlation Heatmap Component
 *
 * Interactive scatter plot styled as heatmap using Recharts.
 * Color intensity represents correlation strength (red = strong, yellow = weak, blue = negative).
 */
interface CorrelationHeatmapProps {
  matrix: number[][];
  labels: string[];
  onCellClick: (cell: { x: number; y: number; correlation: number }) => void;
}

function CorrelationHeatmap({ matrix, labels, onCellClick }: CorrelationHeatmapProps) {
  // Transform matrix into scatter plot data
  const data = matrix.flatMap((row, y) =>
    row.map((correlation, x) => ({
      x,
      y,
      correlation,
      z: Math.abs(correlation) * 100, // Size based on magnitude
    }))
  );

  // Color scale: blue (negative) -> yellow (weak) -> red (strong positive)
  const getColor = (correlation: number) => {
    if (correlation < 0) return 'oklch(0.6 0.18 230)'; // Blue
    if (correlation < 0.3) return 'oklch(0.85 0.05 240)'; // Light gray
    if (correlation < 0.5) return 'oklch(0.75 0.12 85)'; // Yellow
    if (correlation < 0.7) return 'oklch(0.7 0.15 50)'; // Orange
    return 'oklch(0.65 0.20 25)'; // Red
  };

  return (
    <div className="w-full" style={{ height: Math.max(400, labels.length * 30) }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 100, bottom: 100, left: 100 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const payload = e.activePayload[0].payload;
              onCellClick({
                x: payload.x,
                y: payload.y,
                correlation: payload.correlation,
              });
            }
          }}
        >
          <XAxis
            type="number"
            dataKey="x"
            name="Objective"
            domain={[0, labels.length - 1]}
            ticks={labels.map((_, i) => i)}
            tickFormatter={(value) => labels[value] || ''}
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 11 }}
            stroke="oklch(0.6 0.05 240)"
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Objective"
            domain={[0, labels.length - 1]}
            ticks={labels.map((_, i) => i)}
            tickFormatter={(value) => labels[value] || ''}
            width={100}
            tick={{ fontSize: 11 }}
            stroke="oklch(0.6 0.05 240)"
          />
          <ZAxis type="number" dataKey="z" range={[100, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-xl px-3 py-2 rounded-lg shadow-lg border border-[oklch(0.85_0.05_240)]">
                    <p className="text-xs font-medium text-[oklch(0.4_0.05_240)]">
                      {labels[data.x]} ↔ {labels[data.y]}
                    </p>
                    <p className="text-xs text-[oklch(0.5_0.05_240)] mt-1">
                      Correlation: {data.correlation.toFixed(3)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data} shape="square">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.correlation)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'oklch(0.6 0.18 230)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Negative</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'oklch(0.75 0.12 85)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Weak</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'oklch(0.7 0.15 50)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Strong</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Network Graph Component
 *
 * Force-directed network graph using D3.js showing objective relationships.
 * - Nodes: Learning objectives (size = importance based on connections)
 * - Edges: Correlations (thickness = strength, only > 0.3 shown)
 * - Colors: Green (foundational), Red (bottleneck), Gray (neutral)
 */
interface NetworkGraphProps {
  matrix: number[][];
  labels: string[];
  foundational: string[];
  bottlenecks: string[];
}

function NetworkGraph({ matrix, labels, foundational, bottlenecks }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || matrix.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data
    const nodes = labels.map((name, i) => ({
      id: i.toString(),
      name,
      isFoundational: foundational.includes(i.toString()),
      isBottleneck: bottlenecks.includes(i.toString()),
    }));

    const links = [];
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        const correlation = matrix[i][j];
        if (correlation > 0.3) {
          // Only show meaningful correlations
          links.push({
            source: i.toString(),
            target: j.toString(),
            value: correlation,
          });
        }
      }
    }

    // Set up SVG dimensions
    const width = svgRef.current.clientWidth;
    const height = 500;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(30));

    // Draw links (edges)
    const link = svg
      .append('g')
      .attr('stroke', 'oklch(0.85 0.05 240)')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d: any) => d.value * 3); // Thickness based on correlation

    // Draw nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 12)
      .attr('fill', (d: any) =>
        d.isFoundational
          ? 'oklch(0.7 0.15 145)' // Green for foundational
          : d.isBottleneck
            ? 'oklch(0.65 0.20 25)' // Red for bottleneck
            : 'oklch(0.6 0.18 230)' // Blue for neutral
      )
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Add labels
    const label = svg
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: any) => d.name.substring(0, 15)) // Truncate long names
      .attr('font-size', 10)
      .attr('dx', 15)
      .attr('dy', 4)
      .attr('fill', 'oklch(0.4 0.05 240)');

    // Add tooltips
    node.append('title').text((d: any) => d.name);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [matrix, labels, foundational, bottlenecks]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" style={{ minHeight: 500 }} aria-label="Network graph of objective relationships" />
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Foundational</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Bottleneck</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'oklch(0.6 0.18 230)' }}
            aria-hidden="true"
          />
          <span className="text-[oklch(0.5_0.05_240)]">Neutral</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function RelationshipsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <div className="h-6 w-48 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-[oklch(0.95_0.05_240)] rounded animate-pulse" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card
            key={i}
            className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0"
          >
            <CardHeader>
              <div className="h-6 w-40 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-[oklch(0.95_0.05_240)] rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <div className="h-6 w-40 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[500px] bg-[oklch(0.95_0.05_240)] rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
