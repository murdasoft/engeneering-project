import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [totalAnalyses, pendingReviews, confirmedDefects, generatedReports, recentProjects, totalFindings, severityRows, activityRows, thisWeekAnalyses, lastWeekAnalyses, thisWeekFindings, lastWeekFindings] =
    await Promise.all([
      prisma.analysis.count({ where: { userId } }),
      prisma.finding.count({ where: { reviewStatus: "PENDING", analysis: { userId } } }),
      prisma.finding.count({ where: { reviewStatus: "CONFIRMED", analysis: { userId } } }),
      prisma.report.count({ where: { project: { userId } } }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { _count: { select: { assets: true } } },
      }),
      prisma.finding.count({ where: { analysis: { userId } } }),
      prisma.finding.groupBy({
        by: ["severity"],
        where: { analysis: { userId } },
        _count: { severity: true },
      }),
      prisma.analysis.groupBy({
        by: ["createdAt"],
        where: { userId },
        _count: { id: true },
      }),
      prisma.analysis.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.analysis.count({ where: { userId, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      prisma.finding.count({ where: { analysis: { userId }, createdAt: { gte: weekAgo } } }),
      prisma.finding.count({ where: { analysis: { userId }, createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    ]);

  const severityDistribution: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  severityRows.forEach((r) => { severityDistribution[r.severity] = r._count.severity; });

  const today = new Date();
  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return { date: d.toISOString(), count: 0 };
  });
  activityRows.forEach((r) => {
    const date = new Date(r.createdAt);
    date.setHours(0, 0, 0, 0);
    const entry = activity.find((a) => new Date(a.date).getTime() === date.getTime());
    if (entry) entry.count += r._count.id;
  });

  const analysisTrend = lastWeekAnalyses > 0
    ? `${thisWeekAnalyses > lastWeekAnalyses ? "+" : ""}${Math.round(((thisWeekAnalyses - lastWeekAnalyses) / lastWeekAnalyses) * 100)}%`
    : thisWeekAnalyses > 0 ? "+100%" : "—";
  const findingsTrend = lastWeekFindings > 0
    ? `${thisWeekFindings > lastWeekFindings ? "+" : ""}${Math.round(((thisWeekFindings - lastWeekFindings) / lastWeekFindings) * 100)}%`
    : thisWeekFindings > 0 ? "+100%" : "—";
  const pendingTrend = pendingReviews > 10 ? "HIGH ATTENTION" : pendingReviews > 0 ? "NEEDS REVIEW" : "ALL CLEAR";
  const reportsTrend = generatedReports > 0 ? "SYNCED" : "—";

  return NextResponse.json({
    totalAnalyses,
    pendingReviews,
    confirmedDefects,
    generatedReports,
    totalFindings,
    severityDistribution,
    activity,
    trends: {
      analyses: analysisTrend,
      pending: pendingTrend,
      confirmed: findingsTrend,
      reports: reportsTrend,
    },
    recentProjects: recentProjects.map((p) => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}
