"use client";

import { Calendar, Download, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/missions/filter-bar";
import { MissionCard } from "@/components/missions/mission-card";
import { MissionStats } from "@/components/missions/mission-stats";
import { MissionTimeline } from "@/components/missions/mission-timeline";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Mission } from "@/lib/mission-utils";
import {
  calculateMissionStats,
  downloadCSV,
  exportMissionsToCSV,
  filterMissions,
  sortMissions,
} from "@/lib/mission-utils";
import { selectFilters, useMissionStore } from "@/stores/mission";
import { parseObjectives } from "@/lib/mission-utils";

interface MissionsClientProps {
  initialMissions: Mission[];
}

export function MissionsClient({ initialMissions }: MissionsClientProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar">("list");
  const filters = useMissionStore(selectFilters);

  // Apply filters and sorting
  const filteredMissions = useMemo(() => {
    // Convert store date strings -> Date objects for filtering
    const dateRange = filters.dateRange
      ? {
          start: filters.dateRange.start ? new Date(filters.dateRange.start) : null,
          end: filters.dateRange.end ? new Date(filters.dateRange.end) : null,
        }
      : { start: null, end: null };

    let result = filterMissions(initialMissions, {
      statuses: filters.statuses as any[],
      searchQuery: filters.searchQuery,
      dateRange,
    });

    // Sort by date (newest first) by default
    result = sortMissions(result, "date", "desc");

    return result;
  }, [initialMissions, filters]);

  // Calculate stats from filtered missions
  const stats = useMemo(() => calculateMissionStats(filteredMissions), [filteredMissions]);

  const handleExport = () => {
    const csv = exportMissionsToCSV(filteredMissions);
    const filename = `missions-export-${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Missions</span>
          </div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Missions Overview
              </h1>
              <p className="text-gray-600">
                Track your study missions, monitor progress, and analyze performance over time
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/missions/history">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  History
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6">
          <MissionStats stats={stats} />
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar onExport={handleExport} showExport={filteredMissions.length > 0} />
        </div>

        {/* View Tabs and Content */}
        <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredMissions.length} of {initialMissions.length} missions
            </p>
            <TabsList className="bg-white/60 border border-white/30">
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {filteredMissions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No missions found"
                description={
                  filters.searchQuery || filters.statuses.length > 0
                    ? "Try adjusting your filters to see more results"
                    : "Your study missions will appear here once created"
                }
              />
            ) : (
              filteredMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={{
                    ...mission,
                    // Ensure MissionCard always receives parsed objectives array
                    objectives: parseObjectives(mission.objectives),
                  }}
                  variant="default"
                  showActions={false}
                />
              ))
            )}
          </TabsContent>

          {/* Grid View */}
          <TabsContent value="grid">
            {filteredMissions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No missions found"
                description={
                  filters.searchQuery || filters.statuses.length > 0
                    ? "Try adjusting your filters to see more results"
                    : "Your study missions will appear here once created"
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={{
                      ...mission,
                      objectives: parseObjectives(mission.objectives),
                    }}
                    variant="compact"
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar">
            {filteredMissions.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No missions found"
                description={
                  filters.searchQuery || filters.statuses.length > 0
                    ? "Try adjusting your filters to see more results"
                    : "Your study missions will appear here once created"
                }
              />
            ) : (
              <MissionTimeline
                missions={filteredMissions.map((m) => ({
                  id: m.id,
                  // MissionTimeline expects ISO string
                  date: (m.date instanceof Date ? m.date : new Date(m.date)).toISOString(),
                  status: m.status,
                  completedObjectivesCount: m.completedObjectivesCount,
                  // Force array shape for objectives
                  objectives: parseObjectives(m.objectives) as any[],
                  // Normalize nullable to optional number
                  successScore: m.successScore ?? undefined,
                }))}
                onDateClick={(date, missions) => {
                  // Switch to list view and scroll to first mission
                  setViewMode("list");
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {filteredMissions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/missions/history" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full History
                </Button>
              </Link>
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
