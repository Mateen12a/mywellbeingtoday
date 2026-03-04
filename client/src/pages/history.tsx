import { useState, useMemo } from "react";
import { formatLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Printer, TrendingUp, TrendingDown, Minus, Loader2, Clock, Sun, Sunrise, Moon, Activity, Heart, Zap, Brain, Sparkles, ChevronDown, BedDouble } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, Legend } from "recharts";
import { format } from "date-fns";
import { AIService } from "@/services/ai";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReportDownloadButton } from "@/components/report-download-button";

const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getTimeOfDayLabel = (timeOfDay: string) => {
  switch (timeOfDay) {
    case 'morning': return { label: 'Morning', icon: Sunrise, color: 'text-amber-600' };
    case 'afternoon': return { label: 'Afternoon', icon: Sun, color: 'text-yellow-600' };
    case 'evening': return { label: 'Evening', icon: Moon, color: 'text-indigo-600' };
    default: return { label: 'Other', icon: Clock, color: 'text-gray-600' };
  }
};

const getMoodEmoji = (score: number) => {
  if (score >= 8) return '😊';
  if (score >= 6) return '🙂';
  if (score >= 4) return '😐';
  if (score >= 2) return '😟';
  return '😢';
};

const getMoodWord = (score: number) => {
  if (score >= 8) return 'Great';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Okay';
  if (score >= 2) return 'Low';
  return 'Struggling';
};

const getMoodColor = (score: number) => {
  if (score >= 7) return 'text-green-600';
  if (score >= 4) return 'text-yellow-600';
  return 'text-red-600';
};

interface AIInsight {
  title: string;
  description: string;
  type: 'mood' | 'activity' | 'sleep' | 'stress';
  priority: 'high' | 'medium' | 'low';
}

const insightTypeIcons: Record<string, React.ReactNode> = {
  mood: <Heart className="h-4 w-4 text-rose-600" />,
  activity: <Activity className="h-4 w-4 text-blue-600" />,
  stress: <Brain className="h-4 w-4 text-amber-600" />,
  sleep: <BedDouble className="h-4 w-4 text-indigo-600" />,
};

const AISuggestionsCard = ({
  avgMood,
  avgStress,
  avgEnergy,
  totalActivities,
  moodTrend,
  stressTrend,
  isLoading
}: {
  avgMood: number;
  avgStress: number | null;
  avgEnergy: number | null;
  totalActivities: number;
  moodTrend: string | undefined;
  stressTrend: string | undefined;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['simple-insights', avgMood, avgStress, avgEnergy, totalActivities, moodTrend, stressTrend],
    queryFn: async () => {
      const response = await api.getSimpleInsights({
        avgMood,
        avgStress,
        avgEnergy,
        totalActivities,
        moodTrend: moodTrend || undefined,
        stressTrend: stressTrend || undefined,
      });
      return (response.data as any)?.insights as AIInsight[] || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isLoading && avgMood > 0,
  });

  const insights: AIInsight[] = insightsData || [];

  if (isLoading || isLoadingInsights) {
    return (
      <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-violet-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-violet-100 overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-violet-100/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                <div className="p-1.5 xs:p-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shrink-0">
                  <Sparkles className="h-4 w-4 xs:h-5 xs:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm xs:text-lg font-semibold text-violet-900">
                    Tips For You
                  </CardTitle>
                  <CardDescription className="text-[10px] xs:text-sm text-violet-700/70">
                    Personalised suggestions based on your data
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-800 hover:bg-violet-100">
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-white/70 border border-violet-100"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded-full bg-white shadow-sm shrink-0 mt-0.5">
                      {insightTypeIcons[insight.type] || insightTypeIcons.mood}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default function History() {
  const [timeRange, setTimeRange] = useState("month");
  
  const days = timeRange === "today" ? 1 : timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
  const isToday = timeRange === "today";
  const timeLabel = timeRange === "today" ? "Today" : timeRange === "week" ? "This Week" : timeRange === "month" ? "This Month" : "This Year";
  
  const { data: moodStats, isLoading: isLoadingMoods } = useQuery({
    queryKey: ['mood-stats', days],
    queryFn: async () => {
      const response = await api.getMoodStats(days);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: todayMood, isLoading: isLoadingTodayMood } = useQuery({
    queryKey: ['today-mood'],
    queryFn: async () => {
      const response = await api.getTodayMood();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    enabled: isToday,
  });

  const { data: activityStats, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activity-stats', days],
    queryFn: async () => {
      const response = await api.getActivityStats(days);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: todayActivities, isLoading: isLoadingTodayActivities } = useQuery({
    queryKey: ['today-activities'],
    queryFn: async () => {
      const response = await api.getTodayActivities();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    enabled: isToday,
  });

  const { data: dashboardSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['wellbeing', 'dashboard-summary'],
    queryFn: () => AIService.getDashboardSummary(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: latestReport } = useQuery({
    queryKey: ['wellbeing', 'latest-report'],
    queryFn: () => AIService.getLatestReport(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingMoods || isLoadingActivities || isLoadingSummary || (isToday && (isLoadingTodayMood || isLoadingTodayActivities));

  const chartData = useMemo(() => {
    const dailyData = moodStats?.daily || moodStats?.dailyStats || [];
    return dailyData.map((stat: any) => ({
      date: format(new Date(stat._id || stat.date), "MMM dd"),
      mood: stat.avgMoodScore || 0,
      energy: stat.avgEnergy || stat.avgEnergyLevel || 0,
      stress: stat.avgStress || stat.avgStressLevel || 0,
    }));
  }, [moodStats]);

  const activityChartData = activityStats?.categoryBreakdown?.map((cat: any) => ({
    name: formatLabel(cat.category) || 'Other',
    value: cat.count || 0,
  })) || [];

  const groupedTodayMoods = useMemo(() => {
    if (!todayMood?.moodLogs) return { morning: [], afternoon: [], evening: [] };
    
    const grouped: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
    todayMood.moodLogs.forEach((log: any) => {
      const timeOfDay = getTimeOfDay(new Date(log.date));
      grouped[timeOfDay].push(log);
    });
    
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    return grouped;
  }, [todayMood]);

  const avgMood = dashboardSummary?.week?.avgMoodScore || moodStats?.averageMoodScore || 0;
  const avgEnergy = latestReport?.dataPoints?.averageEnergyLevel || moodStats?.averageEnergy || null;
  const avgStress = latestReport?.dataPoints?.averageStressLevel || moodStats?.averageStress || null;
  const totalActivities = dashboardSummary?.week?.totalActivities || activityStats?.totalActivities || 0;
  const totalMoodLogs = dashboardSummary?.week?.totalMoodLogs || moodStats?.totalLogs || 0;
  const moodTrend = latestReport?.analysis?.trends?.mood;
  const stressTrend = latestReport?.analysis?.trends?.stress;
  
  const getTrendIcon = (trend: string | undefined) => {
    if (!trend) return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    if (trend === 'improving' || trend === 'increasing') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
    if (trend === 'declining' || trend === 'decreasing') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 xs:space-y-5 sm:space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto px-2 xs:px-3 sm:px-4">
        <div className="flex flex-col gap-2 xs:gap-3">
          <div>
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground">Your Wellbeing</h1>
            <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-0.5">See how you've been feeling and what you've been doing.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 xs:gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="text-[10px] xs:text-xs sm:text-sm h-7 xs:h-9">
              <Printer className="mr-1 xs:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Print
            </Button>
            <ReportDownloadButton size="sm" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 xs:space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TabsList className="bg-secondary/30 p-0.5 xs:p-1 w-full xs:w-auto overflow-x-auto">
              <TabsTrigger value="overview" className="text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3">Overview</TabsTrigger>
              <TabsTrigger value="mood" className="text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3">Mood</TabsTrigger>
              <TabsTrigger value="activities" className="text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3">Activities</TabsTrigger>
            </TabsList>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[160px] text-xs xs:text-sm h-8 xs:h-9">
                <CalendarIcon className="mr-1 xs:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="space-y-4 xs:space-y-5">
            {isToday ? (
              <>
                <AISuggestionsCard
                  avgMood={todayMood?.summary?.avgScore || avgMood}
                  avgStress={todayMood?.summary?.avgStress || avgStress}
                  avgEnergy={todayMood?.summary?.avgEnergy || avgEnergy}
                  totalActivities={todayActivities?.activities?.length || totalActivities}
                  moodTrend={moodTrend}
                  stressTrend={stressTrend}
                  isLoading={isLoading}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 xs:gap-3">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-28" />
                      <Skeleton className="h-28" />
                      <Skeleton className="h-28 col-span-2 md:col-span-1" />
                    </>
                  ) : (
                    <>
                      <Card className="border-green-100">
                        <CardContent className="p-3 xs:p-4">
                          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Today's Mood</p>
                          <div className="flex items-center gap-1.5 xs:gap-2">
                            <span className="text-2xl xs:text-3xl">
                              {todayMood?.summary?.avgScore ? getMoodEmoji(todayMood.summary.avgScore) : '—'}
                            </span>
                            <div>
                              <p className={`text-lg xs:text-xl font-bold ${todayMood?.summary?.avgScore ? getMoodColor(todayMood.summary.avgScore) : 'text-muted-foreground'}`}>
                                {todayMood?.summary?.avgScore ? todayMood.summary.avgScore.toFixed(1) : '—'}
                              </p>
                              <p className="text-[10px] xs:text-xs text-muted-foreground">out of 10</p>
                            </div>
                          </div>
                          <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                            {todayMood?.summary?.logsCount 
                              ? `${todayMood.summary.logsCount} log${todayMood.summary.logsCount > 1 ? 's' : ''}`
                              : 'No logs yet'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-blue-100">
                        <CardContent className="p-3 xs:p-4">
                          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Activities</p>
                          <p className="text-2xl xs:text-3xl font-bold text-blue-700">
                            {todayActivities?.activities?.length || 0}
                          </p>
                          <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                            {todayActivities?.summary?.totalDuration 
                              ? `${todayActivities.summary.totalDuration} mins`
                              : 'Log something!'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-orange-100 col-span-2 md:col-span-1">
                        <CardContent className="p-3 xs:p-4">
                          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Energy</p>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <p className="text-2xl xs:text-3xl font-bold text-orange-700">
                              {todayMood?.summary?.avgEnergy ? todayMood.summary.avgEnergy.toFixed(1) : '—'}
                            </p>
                            {todayMood?.summary?.avgEnergy && (
                              <span className="text-[10px] xs:text-xs text-muted-foreground">/ 10</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                <Card>
                  <CardHeader className="pb-2 px-3 xs:px-5">
                    <CardTitle className="text-sm xs:text-base font-medium flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Your Day So Far
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 xs:px-5">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (todayMood?.moodLogs?.length ?? 0) > 0 ? (
                      <div className="space-y-4">
                        {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                          const logs = groupedTodayMoods[period];
                          const { label, icon: Icon, color } = getTimeOfDayLabel(period);
                          if (logs.length === 0) return null;
                          
                          return (
                            <div key={period} className="space-y-2">
                              <div className={`flex items-center gap-1.5 ${color}`}>
                                <Icon className="h-3.5 w-3.5" />
                                <span className="text-xs xs:text-sm font-medium">{label}</span>
                                <Badge variant="secondary" className="ml-auto text-[10px] xs:text-xs">
                                  {logs.length}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1.5 pl-2 xs:pl-5">
                                {logs.map((log: any) => (
                                  <div 
                                    key={log._id} 
                                    className="flex items-center gap-2 xs:gap-3 p-2 rounded-lg bg-secondary/20 border text-xs xs:text-sm"
                                  >
                                    <span className="text-base xs:text-lg">{getMoodEmoji(log.moodScore || 5)}</span>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium capitalize">{log.mood}</span>
                                      {log.notes && (
                                        <p className="text-[10px] xs:text-xs text-muted-foreground truncate">{log.notes}</p>
                                      )}
                                    </div>
                                    <span className="text-[10px] xs:text-xs text-muted-foreground whitespace-nowrap">
                                      {format(new Date(log.date), 'h:mm a')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No mood entries yet today</p>
                        <p className="text-xs text-muted-foreground mt-1">Log your mood to start tracking</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <AISuggestionsCard
                  avgMood={avgMood}
                  avgStress={avgStress}
                  avgEnergy={avgEnergy}
                  totalActivities={totalActivities}
                  moodTrend={moodTrend}
                  stressTrend={stressTrend}
                  isLoading={isLoading}
                />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 xs:gap-3">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24 col-span-2 md:col-span-1" />
                    </>
                  ) : (
                    <>
                      <Card className="border-green-100">
                        <CardContent className="p-3 xs:p-4">
                          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Your Mood {timeLabel}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl xs:text-2xl">{avgMood > 0 ? getMoodEmoji(avgMood) : ''}</span>
                            <span className={`text-xl xs:text-2xl font-bold ${avgMood > 0 ? getMoodColor(avgMood) : 'text-muted-foreground'}`}>
                              {avgMood > 0 ? avgMood.toFixed(1) : '—'}
                            </span>
                            <span className="text-[10px] xs:text-xs text-muted-foreground">/10</span>
                            {avgMood > 0 && getTrendIcon(moodTrend)}
                          </div>
                          <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                            {avgMood > 0 ? `${getMoodWord(avgMood)} · ${totalMoodLogs} log${totalMoodLogs !== 1 ? 's' : ''}` : 'No data yet'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-blue-100">
                        <CardContent className="p-3 xs:p-4">
                          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Activities {timeLabel}</p>
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 xs:h-5 xs:w-5 text-blue-500" />
                            <span className="text-xl xs:text-2xl font-bold text-blue-700">{totalActivities}</span>
                          </div>
                          <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                            {totalActivities > 0 ? 'sessions logged' : 'Start logging!'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-100 col-span-2 md:col-span-1">
                        <CardContent className="p-3 xs:p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Stress</p>
                              <div className="flex items-center gap-1.5">
                                <Brain className="h-4 w-4 text-purple-500" />
                                <span className="text-xl xs:text-2xl font-bold text-purple-700">
                                  {avgStress ? Number(avgStress).toFixed(1) : '—'}
                                </span>
                                {avgStress && <span className="text-[10px] xs:text-xs text-muted-foreground">/10</span>}
                                {getTrendIcon(stressTrend)}
                              </div>
                            </div>
                            {avgEnergy && (
                              <div>
                                <p className="text-[10px] xs:text-xs text-muted-foreground mb-1">Energy</p>
                                <div className="flex items-center gap-1.5">
                                  <Zap className="h-4 w-4 text-orange-500" />
                                  <span className="text-xl xs:text-2xl font-bold text-orange-700">
                                    {Number(avgEnergy).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                <Card>
                  <CardHeader className="pb-2 px-3 xs:px-5">
                    <CardTitle className="text-sm xs:text-base font-medium">
                      Your Mood {timeLabel}
                    </CardTitle>
                    <CardDescription className="text-[10px] xs:text-xs">
                      How your mood and stress have changed over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 xs:px-5 overflow-x-auto">
                    <div className="h-[220px] sm:h-[280px] md:h-[320px] w-full">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} width={25} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" name="Mood" />
                            <Area type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorStress)" name="Stress" />
                            <Legend verticalAlign="top" height={30} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <Heart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="text-sm text-muted-foreground">No mood data yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Log your mood daily to see trends here</p>
                        </div>
                      )}
                    </div>
                    {chartData.length > 0 && (
                      <p className="text-[10px] xs:text-xs text-muted-foreground mt-2">
                        <span className="text-green-600">●</span> Mood (higher = better) · <span className="text-amber-500">●</span> Stress (lower = better)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="mood">
            <Card>
              <CardHeader className="px-3 xs:px-5">
                <CardTitle className="text-sm xs:text-base font-medium">Your Mood Over Time</CardTitle>
                <CardDescription className="text-[10px] xs:text-xs">Track how your mood and energy change day to day</CardDescription>
              </CardHeader>
              <CardContent className="px-3 xs:px-5 overflow-x-auto">
                <div className="h-[230px] sm:h-[320px] md:h-[380px] w-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorMoodDetailed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} width={25} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoodDetailed)" name="Mood" />
                        <Area type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" name="Energy" />
                        <Legend verticalAlign="top" height={30} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-sm text-muted-foreground">No mood data yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Log your mood daily to see your patterns</p>
                    </div>
                  )}
                </div>
                {chartData.length > 0 && (
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-2">
                    <span className="text-purple-600">●</span> Mood score · <span className="text-cyan-500">●</span> Energy level · Both scored out of 10
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader className="px-3 xs:px-5">
                <CardTitle className="text-sm xs:text-base font-medium">Your Activities</CardTitle>
                <CardDescription className="text-[10px] xs:text-xs">What you've been doing {timeLabel.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent className="px-3 xs:px-5 overflow-x-auto">
                <div className="h-[230px] sm:h-[320px] md:h-[380px] w-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2}/>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 11}} interval={0} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={22} name="Times" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No activities logged yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Log activities to see what you do most</p>
                    </div>
                  )}
                </div>
                {activityChartData.length > 0 && (
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-2">
                    A mix of different activities helps improve overall wellbeing.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
