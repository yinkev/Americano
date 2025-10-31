import { prisma } from "@/lib/db";
import { MissionsClient } from "./missions-client";
import type { Mission } from "@/lib/mission-utils";

// Force dynamic rendering since this page requires database access
export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  // Fetch recent missions (default user: kevy@americano.dev)
  const user = await prisma.user.findUnique({
    where: { email: "kevy@americano.dev" },
  });

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">Please check your configuration</p>
        </div>
      </div>
    );
  }

  const missionsData = await prisma.mission.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 50, // Last 50 missions for better overview
  });

  // Transform to Mission type with explicit runtime-safe conversions
  const missions: Mission[] = missionsData.map((m) => ({
    id: m.id,
    date: m.date,
    status: m.status as Mission["status"],
    estimatedMinutes: m.estimatedMinutes,
    actualMinutes: m.actualMinutes,
    completedObjectivesCount: m.completedObjectivesCount,
    objectives:
      typeof m.objectives === "string"
        ? m.objectives
        : m.objectives != null
          ? JSON.stringify(m.objectives)
          : "[]",
    successScore: m.successScore,
    difficultyRating: m.difficultyRating,
  }));

  return <MissionsClient initialMissions={missions} />;
}
