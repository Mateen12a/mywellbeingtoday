import { useState, useMemo } from "react";
import { formatLabel } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Activity,
  Heart,
  Sun,
  Calendar,
  ChevronRight,
  Plus,
  MapPin,
  FileText,
  Lightbulb,
  Bell,
  AlertCircle,
  Loader2,
  TrendingUp,
  MessageCircle,
  Sparkles,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageLoader } from "@/components/ui/page-loader";
import { SkeletonCard, FadeInContent } from "@/components/ui/skeleton-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { ReportDownloadButton } from "@/components/report-download-button";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";

function isValidDate(date: any): boolean {
  if (!date) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

function formatDayLabel(dateValue: any): string | null {
  if (!isValidDate(dateValue)) {
    return null;
  }
  return new Date(dateValue).toLocaleDateString('en-US', { weekday: 'short' });
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getWellbeingStatus(score: number): { text: string; color: string; bgColor: string; borderColor: string; indicatorColor: string } {
  if (score >= 70) {
    return { 
      text: "You're doing great!", 
      color: "text-green-700", 
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      indicatorColor: "bg-green-500"
    };
  } else if (score >= 40) {
    return { 
      text: "Room for improvement", 
      color: "text-amber-700", 
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      indicatorColor: "bg-amber-500"
    };
  } else {
    return { 
      text: "Consider seeking support", 
      color: "text-red-700", 
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      indicatorColor: "bg-red-500"
    };
  }
}

function getWellbeingTips(score: number): string[] {
  if (score >= 70) {
    return [
      "Keep up your healthy habits!",
      "Consider sharing your wellness journey with others"
    ];
  } else if (score >= 40) {
    return [
      "Try adding one more healthy activity to your routine",
      "Consider talking to someone about how you're feeling"
    ];
  } else {
    return [
      "Reach out to a mental health professional",
      "Small steps matter - try one self-care activity today"
    ];
  }
}

function getLatestTimestamp(items: any[]): Date | null {
  if (!items || items.length === 0) return null;
  const timestamps = items
    .map((item: any) => item.createdAt || item.loggedAt || item.date)
    .filter(Boolean)
    .map((ts: string) => new Date(ts))
    .filter((d: Date) => !isNaN(d.getTime()));
  if (timestamps.length === 0) return null;
  return timestamps.reduce((latest: Date, current: Date) => 
    current > latest ? current : latest
  );
}

function getMinutesSince(timestamp: Date | null): number | null {
  if (!timestamp) return null;
  return Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60));
}

interface DynamicGreetingParams {
  hasLoggedActivityToday: boolean;
  hasLoggedMoodToday: boolean;
  todayActivities: any[] | null;
  todayMoodLogs: any[] | null;
  recentActivities: any[];
  recentMoods: any[];
  currentHour: number;
}

function getDynamicGreeting(params: DynamicGreetingParams): string {
  const {
    hasLoggedActivityToday,
    hasLoggedMoodToday,
    todayActivities,
    todayMoodLogs,
    recentActivities,
    recentMoods,
    currentHour,
  } = params;

  const latestActivityTime = getLatestTimestamp(todayActivities || []);
  const latestMoodTime = getLatestTimestamp(todayMoodLogs || []);
  const minutesSinceActivity = getMinutesSince(latestActivityTime);
  const minutesSinceMood = getMinutesSince(latestMoodTime);

  const justLoggedActivity = minutesSinceActivity !== null && minutesSinceActivity <= 30;
  const justLoggedMood = minutesSinceMood !== null && minutesSinceMood <= 30;

  if (justLoggedActivity && justLoggedMood) {
    return "You're on track! Your wellbeing insights are building up.";
  }
  if (justLoggedActivity) {
    return "Great job logging your activity! What's next on your wellness journey?";
  }
  if (justLoggedMood) {
    return "Thanks for checking in! Keep tracking to see your patterns.";
  }

  if (hasLoggedActivityToday && hasLoggedMoodToday) {
    return "You're on track! Your wellbeing insights are building up.";
  }
  if (hasLoggedActivityToday && !hasLoggedMoodToday) {
    return "You've logged an activity. How about checking in with your mood?";
  }
  if (hasLoggedMoodToday && !hasLoggedActivityToday) {
    return "You've checked in today. Consider logging your activities too.";
  }

  const latestAnyLogTime = latestActivityTime && latestMoodTime
    ? (latestActivityTime > latestMoodTime ? latestActivityTime : latestMoodTime)
    : latestActivityTime || latestMoodTime;
  const minutesSinceAnyLog = getMinutesSince(latestAnyLogTime);

  if (minutesSinceAnyLog !== null && minutesSinceAnyLog >= 60) {
    return "Let's take a moment to check and reflect on what happened to you today.";
  }

  const consecutiveDays = calculateLoggingStreak(recentActivities, recentMoods);
  if (consecutiveDays >= 7) {
    return `Amazing ${consecutiveDays}-day streak! Keep up your consistent wellness tracking.`;
  }
  if (consecutiveDays >= 3) {
    return `Great ${consecutiveDays}-day streak! You're building healthy habits.`;
  }

  const morningLogs = countMorningLogs(recentActivities, recentMoods);
  const totalLogs = (recentActivities?.length || 0) + (recentMoods?.length || 0);
  const isMorningLogger = totalLogs > 0 && morningLogs / totalLogs > 0.5;
  
  if (isMorningLogger && currentHour < 12) {
    return "Good to see you this morning! Ready to log your wellness activities?";
  }

  const topActivity = getMostCommonActivity(recentActivities);
  if (topActivity) {
    return `Ready for something new today?`;
  }

  return "Ready to start your wellness journey today? Log an activity or mood to begin.";
}

function calculateLoggingStreak(activities: any[], moods: any[]): number {
  const allDates = new Set<string>();
  
  [...(activities || []), ...(moods || [])].forEach((item: any) => {
    const dateStr = item.createdAt || item.loggedAt || item.date;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        allDates.add(date.toISOString().split('T')[0]);
      }
    }
  });

  const sortedDates = Array.from(allDates).sort().reverse();
  if (sortedDates.length === 0) return 0;

  const today = getTodayKey();
  let streak = 0;
  let expectedDate = new Date(today);

  for (const dateStr of sortedDates) {
    const expectedStr = expectedDate.toISOString().split('T')[0];
    if (dateStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  return streak;
}

function countMorningLogs(activities: any[], moods: any[]): number {
  let count = 0;
  [...(activities || []), ...(moods || [])].forEach((item: any) => {
    const dateStr = item.createdAt || item.loggedAt || item.date;
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getHours() < 12) {
        count++;
      }
    }
  });
  return count;
}

function getMostCommonActivity(activities: any[]): string | null {
  if (!activities || activities.length === 0) return null;
  
  const activityCounts: Record<string, number> = {};
  activities.forEach((activity: any) => {
    const name = activity.activityType || activity.category || activity.name;
    if (name) {
      activityCounts[name] = (activityCounts[name] || 0) + 1;
    }
  });

  const entries = Object.entries(activityCounts);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    planName,
    isOnTrial,
    trialDaysRemaining,
    isFreePlan,
    isPaidPlan,
    isLoading: subLoading,
    usagePercentage,
    getUsed,
    getLimit,
    featuresNearLimit,
    featureLabels,
  } = useSubscription();
  
  const firstName = user?.profile?.firstName || "there";
  const userInitials = (user?.profile?.firstName?.[0]?.toUpperCase() || "") + (user?.profile?.lastName?.[0]?.toUpperCase() || "");
  const avatarUrl = user?.profile?.avatarUrl;
  const userStatus = (user as any)?.status || "active";

  const isReady = !!user && !authLoading;

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["activities", user?._id],
    queryFn: async () => {
      const response = await api.getActivities({ limit: 5 });
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: moodsData, isLoading: moodsLoading } = useQuery({
    queryKey: ["moods", user?._id],
    queryFn: async () => {
      const response = await api.getMoods({ limit: 7 });
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: moodStats, isLoading: moodStatsLoading } = useQuery({
    queryKey: ["moodStats", user?._id],
    queryFn: async () => {
      const response = await api.getMoodStats(7);
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ["wellbeingReports", user?._id],
    queryFn: async () => {
      const response = await api.getWellbeingReports({ limit: 3 });
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ["dashboardSummary", user?._id],
    queryFn: async () => {
      const response = await api.getDashboardSummary();
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: todayActivities } = useQuery({
    queryKey: ["todayActivities", user?._id],
    queryFn: async () => {
      const response = await api.getTodayActivities();
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: todayMood } = useQuery({
    queryKey: ["todayMood", user?._id],
    queryFn: async () => {
      const response = await api.getTodayMood();
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: latestReportData } = useQuery({
    queryKey: ["latestReport", user?._id],
    queryFn: async () => {
      const response = await api.getLatestReport();
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: upcomingAppointmentData } = useQuery({
    queryKey: ["upcomingAppointment", user?._id],
    queryFn: async () => {
      const response = await api.getUpcomingAppointment();
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations", user?._id],
    queryFn: async () => {
      const response = await api.getConversations({ limit: 1 });
      return response.data;
    },
    enabled: isReady,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const hasLoggedActivityToday = (todayActivities?.activities?.length || 0) > 0;
  const hasLoggedMoodToday = (todayMood?.moodLogs?.length || 0) > 0;
  const showDailyPrompt = (!hasLoggedActivityToday || !hasLoggedMoodToday);

  const wellbeingScore = useMemo(() => {
    if (latestReportData?.report?.overallScore) {
      return latestReportData.report.overallScore;
    }
    if (moodStats?.averageScore) {
      return Math.round(moodStats.averageScore * 20);
    }
    const recentMoods = moodsData?.moodLogs?.slice(0, 7) || [];
    if (recentMoods.length > 0) {
      const avg = recentMoods.reduce((sum: number, m: any) => sum + (m.moodScore || 0), 0) / recentMoods.length;
      return Math.round(avg * 20);
    }
    return null;
  }, [latestReportData, moodStats, moodsData]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  const dynamicGreetingMessage = useMemo(() => {
    return getDynamicGreeting({
      hasLoggedActivityToday,
      hasLoggedMoodToday,
      todayActivities: todayActivities?.activities || null,
      todayMoodLogs: todayMood?.moodLogs || null,
      recentActivities: activitiesData?.activities || [],
      recentMoods: moodsData?.moodLogs || [],
      currentHour,
    });
  }, [hasLoggedActivityToday, hasLoggedMoodToday, todayActivities, todayMood, activitiesData, moodsData, currentHour]);

  const hasUpcomingAppointment = !!upcomingAppointmentData?.appointment;
  const hasUsedAIAssistant = (conversationsData?.conversations?.length || 0) > 0;
  const hasReports = (reportsData?.reports?.length || 0) > 0;
  const isHighStress = wellbeingScore !== null && wellbeingScore < 40;

  interface Suggestion {
    id: string;
    title: string;
    description: string;
    href: string;
    buttonText: string;
    icon: React.ElementType;
    priority: number;
    gradient: string;
    borderColor: string;
    textColor: string;
    buttonBorderColor: string;
    buttonTextColor: string;
  }

  const personalizedSuggestions = useMemo(() => {
    const suggestions: Suggestion[] = [];


    if (isHighStress) {
      suggestions.push({
        id: 'relaxation',
        title: 'Try a relaxation exercise',
        description: 'Your stress levels seem elevated. Consider trying a breathing or mindfulness exercise.',
        href: '/ai-assistant',
        buttonText: 'Get Guided Help',
        icon: Sparkles,
        priority: 3,
        gradient: 'from-violet-50 to-purple-50',
        borderColor: 'border-violet-100',
        textColor: 'text-violet-900',
        buttonBorderColor: 'border-violet-200',
        buttonTextColor: 'text-violet-700',
      });
    }

    if (hasUpcomingAppointment) {
      const appointment = upcomingAppointmentData?.appointment;
      const appointmentDate = appointment?.dateTime ? new Date(appointment.dateTime) : null;
      const formattedDate = appointmentDate 
        ? appointmentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        : 'soon';
      suggestions.push({
        id: 'appointment',
        title: 'You have an appointment coming up',
        description: `Your next appointment is scheduled for ${formattedDate}. Make sure you're prepared!`,
        href: '/appointments',
        buttonText: 'View Appointments',
        icon: Clock,
        priority: 4,
        gradient: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-100',
        textColor: 'text-amber-900',
        buttonBorderColor: 'border-amber-200',
        buttonTextColor: 'text-amber-700',
      });
    }

    if (!hasUsedAIAssistant) {
      suggestions.push({
        id: 'ai-assistant',
        title: 'Chat with your AI wellness companion',
        description: 'Get personalized support, wellness tips, and guidance from your AI assistant.',
        href: '/ai-assistant',
        buttonText: 'Start Chat',
        icon: MessageCircle,
        priority: 5,
        gradient: 'from-cyan-50 to-sky-50',
        borderColor: 'border-cyan-100',
        textColor: 'text-cyan-900',
        buttonBorderColor: 'border-cyan-200',
        buttonTextColor: 'text-cyan-700',
      });
    }

    suggestions.push({
      id: 'wellbeing-report',
      title: 'View your wellbeing report',
      description: hasReports 
        ? 'Review your latest wellbeing insights and personalized recommendations.'
        : 'Generate your first wellbeing report to get personalized insights.',
      href: '/history',
      buttonText: hasReports ? 'View Reports' : 'Get Started',
      icon: BarChart3,
      priority: 6,
      gradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-100',
      textColor: 'text-blue-900',
      buttonBorderColor: 'border-blue-200',
      buttonTextColor: 'text-blue-700',
    });

    if (hasUsedAIAssistant && hasLoggedMoodToday && hasLoggedActivityToday && !isHighStress) {
      suggestions.push({
        id: 'directory',
        title: 'Explore healthcare providers',
        description: 'Find specialists and healthcare providers near you for professional support.',
        href: '/directory',
        buttonText: 'Browse Directory',
        icon: MapPin,
        priority: 7,
        gradient: 'from-teal-50 to-emerald-50',
        borderColor: 'border-teal-100',
        textColor: 'text-teal-900',
        buttonBorderColor: 'border-teal-200',
        buttonTextColor: 'text-teal-700',
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [hasLoggedMoodToday, hasLoggedActivityToday, isHighStress, hasUpcomingAppointment, hasUsedAIAssistant, hasReports, upcomingAppointmentData]);


  const moodChartData = useMemo(() => {
    if (moodStats?.daily?.length > 0) {
      return moodStats.daily
        .map((item: any) => {
          const dayLabel = formatDayLabel(item.date);
          if (!dayLabel) return null;
          return {
            day: dayLabel,
            value: item.averageMood || 0,
          };
        })
        .filter(Boolean);
    }
    if ((moodsData?.moodLogs?.length ?? 0) > 0) {
      return moodsData!.moodLogs
        .slice(0, 7)
        .reverse()
        .map((log: any) => {
          const dayLabel = formatDayLabel(log.createdAt);
          if (!dayLabel) return null;
          return {
            day: dayLabel,
            value: log.moodScore || 0,
          };
        })
        .filter(Boolean);
    }
    return [];
  }, [moodStats, moodsData]);

  const recentActivities = activitiesData?.activities || [];
  const reports = reportsData?.reports || [];

  const isInitialLoading = authLoading || (activitiesLoading && moodsLoading && reportsLoading);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Preparing your wellbeing sanctuary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header - FIRST on mobile */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <Avatar className="hidden sm:flex h-12 w-12 border-2 border-primary/20 shrink-0">
              <AvatarImage src={avatarUrl} alt={firstName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {userInitials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-black leading-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-gray-800 font-medium text-xs sm:text-sm md:text-base line-clamp-2 mt-0.5 sm:mt-1">
                {dynamicGreetingMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-secondary-foreground shrink-0 border border-secondary whitespace-nowrap self-start sm:self-auto">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {!subLoading && user?.role === "user" && (
        <>
          {isOnTrial && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-900 shadow-sm p-3 sm:p-4">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600" />
              <AlertTitle className="font-bold ml-2 text-sm sm:text-base">
                You're on a free trial — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining
              </AlertTitle>
              <AlertDescription className="ml-6 mt-1 text-xs sm:text-sm">
                {featuresNearLimit.length > 0 && (
                  <span className="block mb-2">
                    {featuresNearLimit.map((f) => (
                      <span key={f} className="block text-amber-700 font-medium">
                        You've used {getUsed(f)} of {getLimit(f)} {featureLabels[f]} this month
                      </span>
                    ))}
                  </span>
                )}
                Explore all features before your trial ends.
                <div className="mt-2">
                  <Link href="/subscription">
                    <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 text-xs sm:text-sm">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!isOnTrial && isFreePlan && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm p-3 sm:p-4">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
              <AlertTitle className="font-bold ml-2 text-sm sm:text-base">
                You're on the Free plan
              </AlertTitle>
              <AlertDescription className="ml-6 mt-1 text-xs sm:text-sm">
                {featuresNearLimit.length > 0 && (
                  <span className="block mb-2">
                    {featuresNearLimit.map((f) => (
                      <span key={f} className="block text-amber-700 font-medium">
                        You've used {getUsed(f)} of {getLimit(f)} {featureLabels[f]} this month
                      </span>
                    ))}
                  </span>
                )}
                Upgrade to unlock more features and higher limits.
                <div className="mt-2">
                  <Link href="/subscription">
                    <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 text-xs sm:text-sm">
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isPaidPlan && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {planName} Plan
              </span>
            </div>
          )}

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-bold text-black">Monthly Usage</CardTitle>
                <Link href="/subscription">
                  <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold h-7">
                    Details <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {(["activityLogs", "moodLogs", "reportDownloads", "directoryAccess", "aiInteractions"] as const).map((feature) => {
                  const used = getUsed(feature);
                  const limit = getLimit(feature);
                  const pct = usagePercentage(feature);
                  const unlimited = limit === -1;
                  return (
                    <div key={feature} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-600 truncate">{featureLabels[feature]}</span>
                        <span className={`font-semibold tabular-nums ${pct >= 100 ? "text-red-600" : pct >= 75 ? "text-amber-600" : "text-gray-900"}`}>
                          {unlimited ? `${used} / ∞` : `${used} / ${limit}`}
                        </span>
                      </div>
                      <Progress
                        value={unlimited ? 0 : pct}
                        className={`h-1.5 ${pct >= 100 ? "[&>div]:bg-red-500 bg-red-100" : pct >= 75 ? "[&>div]:bg-amber-500 bg-amber-100" : "[&>div]:bg-primary bg-primary/20"}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {userStatus === "suspended" && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm p-3 sm:p-4">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <AlertTitle className="font-bold ml-2 text-sm sm:text-base">Account Suspended</AlertTitle>
          <AlertDescription className="ml-6 mt-1 text-xs sm:text-sm">
            Your account has been suspended. Please contact support for more information.
            <div className="mt-3">
              <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 text-xs sm:text-sm">
                Contact Support
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showDailyPrompt && (
        <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/20 to-primary/5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -ml-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/30 rounded-full blur-2xl -mr-16 -mb-16 pointer-events-none" />
          <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 sm:h-11 w-9 sm:w-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bell className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-black mb-0.5">
                    You haven't logged today yet!
                  </h3>
                  <p className="text-gray-700 text-xs sm:text-sm leading-snug">
                    {!hasLoggedMoodToday && !hasLoggedActivityToday 
                      ? "Track your mood and log your activity" 
                      : !hasLoggedMoodToday 
                        ? "Track your mood" 
                        : "Log your activity"} to stay on top of your wellbeing.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                {!hasLoggedActivityToday && (
                  <Link href="/activity" className="flex-1 min-w-0">
                    <Button size="sm" className="w-full rounded-full shadow-sm text-xs sm:text-sm h-9">
                      <Activity className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      <span>Log activity</span>
                    </Button>
                  </Link>
                )}
                {!hasLoggedMoodToday && (
                  <Link href="/mood" className="flex-1 min-w-0">
                    <Button variant="outline" size="sm" className="w-full rounded-full border-primary/30 text-xs sm:text-sm h-9">
                      <Heart className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      <span>Track your mood</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {wellbeingScore !== null && (
        <Card className={`${getWellbeingStatus(wellbeingScore).bgColor} ${getWellbeingStatus(wellbeingScore).borderColor} border shadow-sm`}>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
                <div className={`h-12 sm:h-16 w-12 sm:w-16 rounded-lg sm:rounded-2xl ${getWellbeingStatus(wellbeingScore).indicatorColor} flex items-center justify-center shadow-sm shrink-0`}>
                  <TrendingUp className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-black">Your Wellbeing Status</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className={`text-2xl sm:text-3xl font-bold ${getWellbeingStatus(wellbeingScore).color}`}>
                        {wellbeingScore}
                      </span>
                      <span className="text-gray-500 text-xs sm:text-sm">/100</span>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getWellbeingStatus(wellbeingScore).bgColor} ${getWellbeingStatus(wellbeingScore).color} border ${getWellbeingStatus(wellbeingScore).borderColor} whitespace-nowrap`}>
                      {getWellbeingStatus(wellbeingScore).text}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="order-last sm:order-first">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tips for you</p>
                  <ul className="space-y-1">
                    {getWellbeingTips(wellbeingScore).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                        <Lightbulb className="h-3 sm:h-4 w-3 sm:w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-end">
                  <ReportDownloadButton 
                    variant="outline" 
                    size="sm"
                    className="bg-white/80 hover:bg-white border-gray-300 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Check-in Card - only show when daily prompt is not visible */}
      {!showDailyPrompt && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/30 overflow-hidden relative shadow-sm">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-2xl sm:blur-3xl -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 pointer-events-none" />
          <CardContent className="p-5 sm:p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 relative z-10">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 text-xs sm:text-sm font-bold text-primary tracking-wide uppercase border border-primary/20">
                <Sun className="w-3.5 h-3.5" /> Daily Check-in
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-black">
                How are you feeling right now?
              </h2>
              <p className="text-gray-800 font-medium text-sm sm:text-base">
                Taking a moment to reflect can help you understand your patterns better.
              </p>
            </div>
            <Link href="/mood" className="w-full sm:w-auto">
              <Button
                size="default"
                className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 font-bold text-sm sm:text-base"
              >
                <Heart className="mr-2 w-5 h-5" /> Track Mood
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            title: "Directory of Health and Social Care Providers",
            icon: MapPin,
            href: "/directory",
            color: "text-emerald-700",
            bg: "bg-emerald-100",
          },
          {
            title: "My History",
            icon: Calendar,
            href: "/history",
            color: "text-purple-700",
            bg: "bg-purple-100",
          },
          {
            title: "Certificates",
            icon: FileText,
            href: "/certificates",
            color: "text-amber-700",
            bg: "bg-amber-100",
          },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <Card className="hover-elevate cursor-pointer h-full bg-white border border-gray-100">
              <CardContent className="p-4 sm:p-5 lg:p-6 flex flex-col items-center text-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl ${action.bg} ${action.color} flex items-center justify-center border border-transparent`}
                >
                  <action.icon className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <span className="font-bold text-black text-sm">{action.title}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Personalized Suggestions For You */}
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-black mb-4 sm:mb-5 flex items-center gap-2">
          <Lightbulb className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500" /> Suggestions for You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {reportsLoading || moodsLoading || activitiesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-gray-50 border-gray-100">
                <CardContent className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="h-8 sm:h-10 w-8 sm:w-10 rounded-lg sm:rounded-xl" />
                    <Skeleton className="h-4 sm:h-5 w-2/3 sm:w-3/4" />
                  </div>
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-2/3" />
                  <Skeleton className="h-8 sm:h-9 w-full mt-2" />
                </CardContent>
              </Card>
            ))
          ) : (
            personalizedSuggestions.map((suggestion) => {
              const IconComponent = suggestion.icon;
              return (
                <Card 
                  key={suggestion.id} 
                  className={`bg-gradient-to-br ${suggestion.gradient} ${suggestion.borderColor} transition-all`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-xl ${suggestion.gradient.replace('from-', 'bg-').split(' ')[0]} flex items-center justify-center shrink-0`}>
                        <IconComponent className={`w-5 h-5 ${suggestion.textColor}`} />
                      </div>
                      <h3 className={`font-bold ${suggestion.textColor} text-sm leading-tight`}>
                        {suggestion.title}
                      </h3>
                    </div>
                    <p className={`text-sm ${suggestion.textColor.replace('900', '800')} mb-4 line-clamp-2`}>
                      {suggestion.description}
                    </p>
                    <Link href={suggestion.href}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`w-full ${suggestion.buttonBorderColor} ${suggestion.buttonTextColor} font-medium text-sm`}
                      >
                        {suggestion.buttonText}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Stats / Recent Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 min-h-0">
            <CardTitle className="text-lg sm:text-xl font-serif font-bold text-black truncate">
              Recent Activity
            </CardTitle>
            <Link href="/activity#recent">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold text-primary h-8 text-xs sm:text-sm shrink-0"
              >
                View All <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6">
            {activitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 3).map((activity: any) => (
                  <div
                    key={activity._id}
                    className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0 min-w-0"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-sm font-bold text-gray-700 border border-secondary shrink-0">
                      {activity.name?.[0]?.toUpperCase() || activity.activityType?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-black truncate">{activity.name || activity.activityType}</p>
                      <p className="text-sm font-medium text-gray-600 truncate">
                        {formatLabel(activity.category)} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activities logged yet</p>
              </div>
            )}
            <Link href="/activity" className="block mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed border-gray-300 font-semibold text-gray-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Add New Entry
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Weekly Mood Chart */}
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 min-h-0">
            <CardTitle className="text-lg sm:text-xl font-serif font-bold text-black truncate">
              Weekly Mood
            </CardTitle>
            <Link href="/history">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 font-medium text-gray-600 hover:text-black text-xs sm:text-sm shrink-0"
              >
                View History
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[300px] p-4 sm:p-5 lg:p-6">
            {moodStatsLoading || moodsLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : moodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={moodChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis domain={[0, 10]} hide={true} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMood)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Heart className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No mood data yet</p>
                <Link href="/mood">
                  <Button variant="link" className="mt-2 text-sm">
                    Log your first mood
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
