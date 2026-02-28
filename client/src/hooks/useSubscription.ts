import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const FEATURE_LABELS: Record<string, string> = {
  activityLogs: "Activity Logs",
  moodLogs: "Mood Tracking",
  reportDownloads: "Report Downloads",
  directoryAccess: "Directory Access",
  aiInteractions: "AI Interactions",
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
  team: "Team",
  franchise: "Franchise",
};

export const CLIENT_PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    activityLogs: 2,
    moodLogs: 2,
    reportDownloads: 1,
    directoryAccess: 2,
    aiInteractions: 2,
  },
  starter: {
    activityLogs: 10,
    moodLogs: 10,
    reportDownloads: 3,
    directoryAccess: 10,
    aiInteractions: 10,
  },
  pro: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1,
  },
  premium: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1,
  },
  team: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1,
  },
  franchise: {
    activityLogs: -1,
    moodLogs: -1,
    reportDownloads: -1,
    directoryAccess: -1,
    aiInteractions: -1,
  },
};

export function useSubscription() {
  const { isAuthenticated, user } = useAuth();

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.getSubscription(),
    enabled: isAuthenticated && user?.role === "user",
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: () => api.getUsage(),
    enabled: isAuthenticated && user?.role === "user",
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const isLoading = subLoading || usageLoading;
  const hasData = !!subData?.data?.subscription && !!usageData?.data;

  const subscription = subData?.data?.subscription;
  const planLimits = subData?.data?.planLimits;
  const plan = subscription?.plan || "free";
  const status = subscription?.status || "active";
  const isOnTrial = status === "trial" && (subscription?.trialDaysRemaining ?? 0) > 0;
  const trialDaysRemaining = subscription?.trialDaysRemaining ?? 0;
  const isFreePlan = plan === "free";
  const isPaidPlan = ["starter", "pro", "premium", "team", "franchise"].includes(plan);

  const usage = usageData?.data?.usage || {
    activityLogs: 0,
    moodLogs: 0,
    reportDownloads: 0,
    directoryAccess: 0,
    aiInteractions: 0,
  };

  const limits = usageData?.data?.limits ||
    planLimits?.[plan] ||
    CLIENT_PLAN_LIMITS[plan] ||
    CLIENT_PLAN_LIMITS.free;

  function getLimit(feature: string): number {
    return (limits as Record<string, number>)[feature] ?? CLIENT_PLAN_LIMITS.free[feature] ?? 2;
  }

  function getUsed(feature: string): number {
    return (usage as Record<string, number>)[feature] ?? 0;
  }

  function getRemaining(feature: string): number {
    const limit = getLimit(feature);
    if (limit === -1) return Infinity;
    return Math.max(0, limit - getUsed(feature));
  }

  function canUseFeature(feature: string): boolean {
    if (!hasData) return true;
    const limit = getLimit(feature);
    if (limit === -1) return true;
    return getUsed(feature) < limit;
  }

  function usagePercentage(feature: string): number {
    const limit = getLimit(feature);
    if (limit === -1 || limit === 0) return 0;
    return Math.min(100, Math.round((getUsed(feature) / limit) * 100));
  }

  function isNearLimit(feature: string): boolean {
    if (!hasData) return false;
    const limit = getLimit(feature);
    if (limit === -1) return false;
    return usagePercentage(feature) >= 75;
  }

  function isAtLimit(feature: string): boolean {
    if (!hasData) return false;
    return !canUseFeature(feature);
  }

  const featuresNearLimit = hasData
    ? Object.keys(FEATURE_LABELS).filter((f) => isNearLimit(f) && !isAtLimit(f))
    : [];

  const featuresAtLimit = hasData
    ? Object.keys(FEATURE_LABELS).filter((f) => isAtLimit(f))
    : [];

  return {
    plan,
    planName: PLAN_NAMES[plan] || plan,
    status,
    isOnTrial,
    trialDaysRemaining,
    isFreePlan,
    isPaidPlan,
    usage,
    limits,
    isLoading,
    hasData,
    canUseFeature,
    usagePercentage,
    isNearLimit,
    isAtLimit,
    getRemaining,
    getUsed,
    getLimit,
    featuresNearLimit,
    featuresAtLimit,
    featureLabels: FEATURE_LABELS,
    subscription,
  };
}
