import { useState, useMemo } from "react";
import { formatLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Printer, TrendingUp, TrendingDown, Minus, Loader2, Clock, Sun, Sunrise, Moon, Info, HelpCircle, Activity, Heart, Zap, Brain, Sparkles, ChevronDown, Lightbulb, Target, BedDouble } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, Legend } from "recharts";
import { format } from "date-fns";
import { AIService } from "@/services/ai";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const getMoodEmoji = (mood: string) => {
  const moods: Record<string, string> = {
    'happy': '😊',
    'calm': '😌',
    'tired': '😴',
    'stressed': '😰',
    'sad': '😢',
    'anxious': '😟',
    'excited': '🎉',
    'neutral': '😐',
    'content': '🙂',
    'energetic': '⚡',
    'focused': '🎯',
    'relaxed': '😇',
  };
  return moods[mood?.toLowerCase()] || '🙂';
};

const getScoreLevel = (score: number, maxScore: number = 10) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return { level: 'good', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100', emoji: '✨' };
  if (percentage >= 40) return { level: 'moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100', emoji: '🌤️' };
  return { level: 'low', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100', emoji: '💪' };
};

const getWellbeingBadge = (score: number, maxScore: number = 10) => {
  const { level, textColor, bgColor, emoji } = getScoreLevel(score, maxScore);
  const labels: Record<string, string> = {
    'good': 'Great',
    'moderate': 'Moderate',
    'low': 'Needs Attention'
  };
  return (
    <Badge className={`${bgColor} ${textColor} border-0 font-medium`}>
      {emoji} {labels[level]}
    </Badge>
  );
};

const getScoreExplanation = (type: 'mood' | 'stress' | 'energy' | 'wellbeing', score: number, maxScore: number = 10) => {
  const percentage = (score / maxScore) * 100;
  
  const explanations: Record<string, Record<string, string>> = {
    mood: {
      high: "You've been feeling positive and emotionally balanced. Keep doing what works for you!",
      moderate: "Your mood has been fairly stable. Consider activities that bring you joy.",
      low: "Your mood could use some attention. Try connecting with friends or doing something you enjoy."
    },
    stress: {
      high: "Your stress levels have been elevated. Consider relaxation techniques like deep breathing or meditation.",
      moderate: "Your stress is manageable. Keep monitoring and take breaks when needed.",
      low: "Great job managing stress! Your stress levels are low and healthy."
    },
    energy: {
      high: "Your energy levels are fantastic! You're likely getting good sleep and staying active.",
      moderate: "Your energy is at a moderate level. Consider more sleep or physical activity.",
      low: "Your energy seems low. Focus on rest, nutrition, and gentle movement."
    },
    wellbeing: {
      high: "Excellent overall wellbeing! You're taking great care of yourself.",
      moderate: "Your wellbeing is balanced. There's room for improvement in some areas.",
      low: "Your wellbeing needs attention. Focus on small, consistent self-care habits."
    }
  };

  const level = percentage >= 70 ? 'high' : percentage >= 40 ? 'moderate' : 'low';
  const stressLevel = percentage >= 70 ? 'low' : percentage >= 40 ? 'moderate' : 'high';
  
  return type === 'stress' ? explanations[type][stressLevel] : explanations[type][level];
};

const getActivityEmoji = (category: string) => {
  const emojis: Record<string, string> = {
    'exercise': '🏃',
    'meditation': '🧘',
    'sleep': '😴',
    'social': '👥',
    'work': '💼',
    'hobby': '🎨',
    'nutrition': '🥗',
    'outdoors': '🌳',
    'reading': '📚',
    'music': '🎵',
    'other': '✨'
  };
  return emojis[category?.toLowerCase()] || '✨';
};

const ScoreProgressBar = ({ score, maxScore = 10, label, showTooltip = true, tooltipText }: { 
  score: number; 
  maxScore?: number; 
  label: string;
  showTooltip?: boolean;
  tooltipText?: string;
}) => {
  const percentage = Math.round((score / maxScore) * 100);
  const { color } = getScoreLevel(score, maxScore);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1">
          {label}
          {showTooltip && tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
        <span className="font-medium">{score.toFixed(1)}/{maxScore}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const WhatThisMeansCard = ({ type, score, maxScore = 10 }: { type: 'mood' | 'stress' | 'energy' | 'wellbeing'; score: number; maxScore?: number }) => {
  const explanation = getScoreExplanation(type, score, maxScore);
  const { emoji } = getScoreLevel(score, maxScore);
  
  const icons: Record<string, any> = {
    mood: Heart,
    stress: Brain,
    energy: Zap,
    wellbeing: Activity
  };
  
  const Icon = icons[type];
  
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-full bg-white">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm font-medium text-slate-700">What this means</span>
            <span>{emoji}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
};

interface AIInsight {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'mood' | 'activity' | 'sleep' | 'stress';
  priority: 'high' | 'medium' | 'low';
}

const generateAIInsights = (
  avgMood: number,
  avgStress: number | null,
  avgEnergy: number | null,
  totalActivities: number,
  moodTrend: string | undefined,
  stressTrend: string | undefined,
  sleepTrend: string | undefined,
  activityTrend: string | undefined,
  latestReport: any
): AIInsight[] => {
  const insights: AIInsight[] = [];

  if (moodTrend === 'improving') {
    insights.push({
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      title: 'Mood on the Rise',
      description: 'Your mood has been improving! Whatever you\'ve been doing is working. Keep up with activities that bring you joy and maintain your current positive habits.',
      type: 'mood',
      priority: 'low'
    });
  } else if (moodTrend === 'declining') {
    insights.push({
      icon: <Heart className="h-4 w-4 text-rose-600" />,
      title: 'Mood Needs Attention',
      description: 'Your mood has been declining recently. Consider scheduling enjoyable activities, connecting with friends, or practicing self-care. Small positive actions can help turn things around.',
      type: 'mood',
      priority: 'high'
    });
  } else if (avgMood > 0 && avgMood < 5) {
    insights.push({
      icon: <Heart className="h-4 w-4 text-amber-600" />,
      title: 'Focus on Mood Boosters',
      description: 'Your mood score is below average. Try incorporating activities you enjoy, spending time outdoors, or reaching out to loved ones for support.',
      type: 'mood',
      priority: 'medium'
    });
  }

  if (avgStress && avgStress > 7) {
    insights.push({
      icon: <Brain className="h-4 w-4 text-red-600" />,
      title: 'High Stress Detected',
      description: 'Your stress levels are elevated. Consider incorporating relaxation techniques like deep breathing, meditation, or gentle exercise. Taking regular breaks can also help reduce stress.',
      type: 'stress',
      priority: 'high'
    });
  } else if (avgStress && avgStress > 5) {
    insights.push({
      icon: <Brain className="h-4 w-4 text-amber-600" />,
      title: 'Manage Your Stress',
      description: 'Your stress is at a moderate level. Continue monitoring and try to identify triggers. Regular physical activity and adequate sleep can help keep stress in check.',
      type: 'stress',
      priority: 'medium'
    });
  } else if (avgStress && avgStress <= 4 && stressTrend !== 'increasing') {
    insights.push({
      icon: <Brain className="h-4 w-4 text-green-600" />,
      title: 'Great Stress Management',
      description: 'You\'re doing an excellent job managing stress. Your levels are low and healthy. Keep up with whatever techniques are working for you!',
      type: 'stress',
      priority: 'low'
    });
  }

  if (sleepTrend === 'declining') {
    insights.push({
      icon: <BedDouble className="h-4 w-4 text-indigo-600" />,
      title: 'Sleep Quality Declining',
      description: 'Your sleep quality seems to be declining. Try establishing a consistent bedtime routine, limiting screen time before bed, and creating a relaxing sleep environment.',
      type: 'sleep',
      priority: 'high'
    });
  } else if (sleepTrend === 'improving') {
    insights.push({
      icon: <BedDouble className="h-4 w-4 text-green-600" />,
      title: 'Sleep Improving',
      description: 'Your sleep patterns are improving! Quality sleep is essential for wellbeing. Continue with your current sleep habits to maintain this positive trend.',
      type: 'sleep',
      priority: 'low'
    });
  }

  if (totalActivities < 5) {
    insights.push({
      icon: <Activity className="h-4 w-4 text-blue-600" />,
      title: 'Increase Activity Logging',
      description: 'You have few activities logged. Regular activity tracking helps identify patterns. Try logging at least one activity per day to get better insights.',
      type: 'activity',
      priority: 'medium'
    });
  } else if (activityTrend === 'improving') {
    insights.push({
      icon: <Target className="h-4 w-4 text-green-600" />,
      title: 'Activity Levels Rising',
      description: 'Your activity levels are increasing! Physical activity positively impacts mood, energy, and stress. Keep building on this momentum.',
      type: 'activity',
      priority: 'low'
    });
  } else if (activityTrend === 'declining') {
    insights.push({
      icon: <Activity className="h-4 w-4 text-amber-600" />,
      title: 'Activity Levels Dropping',
      description: 'Your activity has decreased recently. Even short walks or light exercises can help maintain energy and mood. Try setting small, achievable activity goals.',
      type: 'activity',
      priority: 'medium'
    });
  }

  if (avgEnergy && avgEnergy < 4) {
    insights.push({
      icon: <Zap className="h-4 w-4 text-orange-600" />,
      title: 'Boost Your Energy',
      description: 'Your energy levels are low. Focus on getting adequate sleep, staying hydrated, and eating nutritious foods. Short bursts of physical activity can also help increase energy.',
      type: 'mood',
      priority: 'high'
    });
  }

  if (latestReport?.analysis?.areasForImprovement?.length > 0) {
    const area = latestReport.analysis.areasForImprovement[0];
    insights.push({
      icon: <Lightbulb className="h-4 w-4 text-purple-600" />,
      title: 'Focus Area',
      description: `Based on your data: ${area}. Working on this area can have a positive impact on your overall wellbeing.`,
      type: 'mood',
      priority: 'medium'
    });
  }

  if (insights.length === 0) {
    if (avgMood >= 7 && (!avgStress || avgStress < 5)) {
      insights.push({
        icon: <Sparkles className="h-4 w-4 text-green-600" />,
        title: 'You\'re Thriving!',
        description: 'Your wellbeing metrics look great! Your mood is positive and stress is well-managed. Continue your current habits and keep logging to track your progress.',
        type: 'mood',
        priority: 'low'
      });
    } else {
      insights.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        title: 'Keep Tracking',
        description: 'Continue logging your mood and activities to receive personalized AI insights. The more data you provide, the better we can understand your patterns and offer helpful suggestions.',
        type: 'mood',
        priority: 'low'
      });
    }
  }

  return insights.slice(0, 4).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

const AISuggestionsCard = ({
  avgMood,
  avgStress,
  avgEnergy,
  totalActivities,
  moodTrend,
  stressTrend,
  sleepTrend,
  activityTrend,
  latestReport,
  isLoading
}: {
  avgMood: number;
  avgStress: number | null;
  avgEnergy: number | null;
  totalActivities: number;
  moodTrend: string | undefined;
  stressTrend: string | undefined;
  sleepTrend: string | undefined;
  activityTrend: string | undefined;
  latestReport: any;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const insights = useMemo(() => 
    generateAIInsights(avgMood, avgStress, avgEnergy, totalActivities, moodTrend, stressTrend, sleepTrend, activityTrend, latestReport),
    [avgMood, avgStress, avgEnergy, totalActivities, moodTrend, stressTrend, sleepTrend, activityTrend, latestReport]
  );

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/50';
      default:
        return 'border-l-green-500 bg-green-50/50';
    }
  };

  if (isLoading) {
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
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-violet-900 flex items-center gap-2">
                    AI Suggestions
                    <Badge className="bg-violet-100 text-violet-700 border-0 text-xs font-normal">
                      Personalized
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-violet-700/70">
                    Smart insights based on your wellbeing patterns
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
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getPriorityStyles(insight.priority)} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-white shadow-sm">
                      {insight.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
                        {insight.priority === 'high' && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">Priority</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-violet-100/50 border border-violet-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-700">
                  These suggestions are generated based on your logged mood, activities, and trends. 
                  The more consistently you log, the more personalized your insights become.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default function History() {
  const [timeRange, setTimeRange] = useState("week");
  
  const days = timeRange === "today" ? 1 : timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
  const isToday = timeRange === "today";
  
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
    emoji: getActivityEmoji(cat.category),
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
  const totalActivityMinutes = latestReport?.dataPoints?.totalActivityMinutes || activityStats?.totalMinutes || 0;
  const latestReportScore = latestReport?.overallScore;
  const moodTrend = latestReport?.analysis?.trends?.mood;
  const activityTrend = latestReport?.analysis?.trends?.activity;
  const sleepTrend = latestReport?.analysis?.trends?.sleep;
  const stressTrend = latestReport?.analysis?.trends?.stress;
  const reportDate = latestReport?.createdAt ? new Date(latestReport.createdAt) : null;
  
  const getTrendDisplay = (trend: string | undefined, numericValue?: number | null) => {
    const baseDisplay = { icon: <Minus className="h-4 w-4" />, text: 'stable', color: 'text-gray-600', label: 'Stable', emoji: '➡️' };
    
    if (!trend) return baseDisplay;
    if (trend === 'improving' || trend === 'increasing') {
      return { 
        icon: <TrendingUp className="h-4 w-4" />, 
        text: 'improving', 
        color: 'text-green-600',
        label: numericValue ? `Improving (${numericValue.toFixed(1)}/10)` : 'Improving',
        emoji: '📈'
      };
    }
    if (trend === 'declining' || trend === 'decreasing') {
      return { 
        icon: <TrendingDown className="h-4 w-4" />, 
        text: 'declining', 
        color: 'text-red-600',
        label: numericValue ? `Declining (${numericValue.toFixed(1)}/10)` : 'Declining',
        emoji: '📉'
      };
    }
    return { 
      ...baseDisplay, 
      label: numericValue ? `Stable (${numericValue.toFixed(1)}/10)` : 'Stable'
    };
  };

  const moodTrendDisplay = getTrendDisplay(moodTrend, avgMood);
  const activityTrendDisplay = getTrendDisplay(activityTrend);
  const stressTrendDisplay = getTrendDisplay(stressTrend, avgStress);

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground">Wellbeing History</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track your trends and patterns over time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs sm:text-sm">
              <Printer className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Print
            </Button>
            <ReportDownloadButton size="sm" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-secondary/30 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mood">Mood Trends</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {isToday ? (
              <>
                <AISuggestionsCard
                  avgMood={todayMood?.summary?.avgScore || avgMood}
                  avgStress={todayMood?.summary?.avgStress || avgStress}
                  avgEnergy={todayMood?.summary?.avgEnergy || avgEnergy}
                  totalActivities={todayActivities?.activities?.length || totalActivities}
                  moodTrend={moodTrend}
                  stressTrend={stressTrend}
                  sleepTrend={sleepTrend}
                  activityTrend={activityTrend}
                  latestReport={latestReport}
                  isLoading={isLoading}
                />

                <div className="grid md:grid-cols-3 gap-6">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-40" />
                      <Skeleton className="h-40" />
                      <Skeleton className="h-40" />
                    </>
                  ) : (
                    <>
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-green-900 flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Today's Mood
                            </CardTitle>
                            {todayMood?.summary?.avgScore && getWellbeingBadge(todayMood.summary.avgScore)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-green-700">
                              {todayMood?.summary?.avgScore ? todayMood.summary.avgScore.toFixed(1) : '—'}
                            </span>
                            <span className="text-sm text-green-600">/10</span>
                            {todayMood?.summary?.latestMood && (
                              <span className="text-2xl ml-2">{getMoodEmoji(todayMood.summary.latestMood)}</span>
                            )}
                          </div>
                          {todayMood?.summary?.avgScore && (
                            <Progress 
                              value={(todayMood.summary.avgScore / 10) * 100} 
                              className="h-2 bg-green-100"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {todayMood?.summary?.logsCount 
                              ? `📊 ${todayMood.summary.logsCount} log${todayMood.summary.logsCount > 1 ? 's' : ''} today`
                              : '📝 No mood logged yet today'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-blue-900 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Today's Activities
                            </CardTitle>
                            {(todayActivities?.activities?.length || 0) > 0 && (
                              <Badge className="bg-blue-100 text-blue-700 border-0">
                                🎯 Active
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-blue-700">
                              {todayActivities?.activities?.length || 0}
                            </span>
                            <span className="text-sm text-blue-600">activities</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {todayActivities?.summary?.totalDuration 
                              ? `⏱️ ${todayActivities.summary.totalDuration} mins total`
                              : '🚀 Start logging activities'}
                          </p>
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 <span className="font-medium">Tip:</span> Regular activity logging helps track your wellness patterns
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-orange-900 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Energy Level
                            </CardTitle>
                            {todayMood?.summary?.avgEnergy && getWellbeingBadge(todayMood.summary.avgEnergy)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-orange-700">
                              {todayMood?.summary?.avgEnergy ? todayMood.summary.avgEnergy.toFixed(1) : '—'}
                            </span>
                            <span className="text-sm text-orange-600">/10</span>
                            <span className="text-xl ml-2">
                              {todayMood?.summary?.avgEnergy >= 7 ? '⚡' : todayMood?.summary?.avgEnergy >= 4 ? '🔋' : '🪫'}
                            </span>
                          </div>
                          {todayMood?.summary?.avgEnergy && (
                            <Progress 
                              value={(todayMood.summary.avgEnergy / 10) * 100} 
                              className="h-2 bg-orange-100"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            Average energy today
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Today's Mood Timeline
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Track how your mood changes throughout the day</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Your mood entries throughout the day - see patterns in your emotions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (todayMood?.moodLogs?.length ?? 0) > 0 ? (
                      <div className="space-y-6">
                        {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                          const logs = groupedTodayMoods[period];
                          const { label, icon: Icon, color } = getTimeOfDayLabel(period);
                          
                          return (
                            <div key={period} className="space-y-3">
                              <div className={`flex items-center gap-2 ${color}`}>
                                <Icon className="h-4 w-4" />
                                <h4 className="font-medium">{label}</h4>
                                {logs.length > 0 && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                                  </Badge>
                                )}
                              </div>
                              
                              {logs.length > 0 ? (
                                <div className="grid gap-3 pl-6">
                                  {logs.map((log: any) => (
                                    <div 
                                      key={log._id} 
                                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border hover:bg-secondary/50 transition-colors"
                                    >
                                      <div className="flex flex-col items-center min-w-[60px]">
                                        <span className="text-lg font-semibold">
                                          {format(new Date(log.date), 'h:mm')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(log.date), 'a')}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                                          <span className="font-medium capitalize">{log.mood}</span>
                                          {getWellbeingBadge(log.moodScore || 5)}
                                        </div>
                                        {log.notes && (
                                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                            💭 {log.notes}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-xs space-y-1">
                                        {log.energyLevel && (
                                          <p className="flex items-center justify-end gap-1">
                                            <Zap className="h-3 w-3 text-orange-500" />
                                            Energy: {log.energyLevel}/10
                                          </p>
                                        )}
                                        {log.stressLevel && (
                                          <p className="flex items-center justify-end gap-1">
                                            <Brain className="h-3 w-3 text-purple-500" />
                                            Stress: {log.stressLevel}/10
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground pl-6">No entries</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-2">No mood entries yet today</p>
                        <p className="text-sm text-muted-foreground">📝 Log your mood to track how you feel throughout the day</p>
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
                  sleepTrend={sleepTrend}
                  activityTrend={activityTrend}
                  latestReport={latestReport}
                  isLoading={isLoading}
                />

                <div className="grid md:grid-cols-3 gap-6">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                      <Skeleton className="h-48" />
                    </>
                  ) : (
                    <>
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-green-900 flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Average Mood
                            </CardTitle>
                            {avgMood > 0 && getWellbeingBadge(avgMood)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-green-700">
                              {avgMood > 0 ? avgMood.toFixed(1) : '—'}
                            </span>
                            <span className="text-sm text-green-600">/10</span>
                            {avgMood > 0 && (
                              <span className={`text-xs font-medium flex items-center ml-2 px-2 py-0.5 rounded-full ${moodTrendDisplay.color} bg-white/50`}>
                                {moodTrendDisplay.emoji} {moodTrendDisplay.text}
                              </span>
                            )}
                          </div>
                          {avgMood > 0 && (
                            <Progress 
                              value={(avgMood / 10) * 100} 
                              className="h-2 bg-green-100"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {avgMood > 7 ? '🌟 Feeling positive!' : avgMood > 5 ? '🌤️ Stable mood this period' : avgMood > 0 ? '💪 Room for improvement' : 'No mood data yet'}
                          </p>
                          {totalMoodLogs > 0 && (
                            <p className="text-xs text-green-700 font-medium">
                              📊 Based on {totalMoodLogs} mood log{totalMoodLogs !== 1 ? 's' : ''}
                            </p>
                          )}
                          {avgMood > 0 && <WhatThisMeansCard type="mood" score={avgMood} />}
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-blue-900 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Activities Logged
                            </CardTitle>
                            {totalActivities > 10 && (
                              <Badge className="bg-blue-100 text-blue-700 border-0">
                                🏆 Consistent
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-blue-700">{totalActivities}</span>
                            <span className="text-sm text-blue-600">sessions</span>
                            <span className="text-xl ml-2">
                              {totalActivities >= 20 ? '🏆' : totalActivities >= 10 ? '🎯' : totalActivities > 0 ? '🚀' : '📝'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {totalActivities > 10 ? '🌟 Great consistency!' : totalActivities > 0 ? '💪 Keep logging activities' : '🚀 Start logging activities'}
                          </p>
                          {totalActivityMinutes > 0 && (
                            <p className="text-xs text-blue-700 font-medium">
                              ⏱️ {totalActivityMinutes} total minutes active
                            </p>
                          )}
                          <div className="text-xs text-blue-600 bg-blue-50/50 p-2 rounded">
                            💡 <span className="font-medium">What this means:</span> Regular activity tracking helps identify what activities boost your wellbeing most.
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-purple-900 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Wellbeing Score
                            </CardTitle>
                            {latestReportScore && getWellbeingBadge(latestReportScore, 100)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-purple-700">
                              {latestReportScore || '—'}
                            </span>
                            {latestReportScore && <span className="text-sm text-purple-600">/100</span>}
                            {latestReportScore && (
                              <span className="text-xl ml-2">
                                {latestReportScore >= 70 ? '🌟' : latestReportScore >= 40 ? '🌤️' : '💪'}
                              </span>
                            )}
                          </div>
                          {latestReportScore && (
                            <Progress 
                              value={latestReportScore} 
                              className="h-2 bg-purple-100"
                            />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {latestReportScore ? `Level: ${latestReport?.wellbeingLevel}` : '📊 Generate a report to see your score'}
                          </p>
                          {reportDate && (
                            <p className="text-xs text-purple-700 font-medium">
                              📅 Report from {format(reportDate, 'MMM d, yyyy')} at {format(reportDate, 'h:mm a')}
                            </p>
                          )}
                          {latestReportScore && <WhatThisMeansCard type="wellbeing" score={latestReportScore} maxScore={100} />}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Wellness Snapshot
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>This chart shows how your mood and stress levels have changed over time. Higher mood is better, while lower stress is healthier.</p>
                            </TooltipContent>
                          </Tooltip>
                        </CardTitle>
                        <CardDescription>Mood and stress levels over time - see your patterns at a glance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <div className="h-[250px] sm:h-[300px] md:h-[350px] w-full">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                            <XAxis dataKey="date" stroke="#888888" fontSize={window.innerWidth < 640 ? 10 : 12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={window.innerWidth < 640 ? 10 : 12} tickLine={false} axisLine={false} domain={[0, 10]} tickFormatter={(value) => `${value}`} width={window.innerWidth < 640 ? 20 : 30} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" name="😊 Mood (1-10)" />
                            <Area type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorStress)" name="😰 Stress (1-10)" />
                            <Legend verticalAlign="top" height={36}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <p className="text-muted-foreground mb-2">📊 No mood data available for this period</p>
                          <p className="text-sm text-muted-foreground">Start logging your daily mood to see trends here</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-slate-500 mt-0.5" />
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">How to read this chart:</span> The <span className="text-green-600 font-medium">green line</span> shows your mood (higher is better). The <span className="text-amber-600 font-medium">yellow line</span> shows stress (lower is healthier). Look for patterns to understand what affects your wellbeing.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {latestReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Detailed Wellbeing Analysis
                        {reportDate && (
                          <Badge variant="outline" className="ml-auto font-normal text-xs">
                            📅 {format(reportDate, 'MMM d, yyyy')} at {format(reportDate, 'h:mm a')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Comprehensive breakdown of your wellbeing metrics with explanations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${moodTrendDisplay.color}`}>{moodTrendDisplay.icon}</span>
                            <span className="text-sm font-medium text-green-900">Mood</span>
                            <span className="ml-auto">{moodTrendDisplay.emoji}</span>
                          </div>
                          <div className="text-2xl font-bold text-green-700">
                            {avgMood > 0 ? avgMood.toFixed(1) : '—'}
                            <span className="text-sm font-normal text-green-600">/10</span>
                          </div>
                          <Progress value={avgMood > 0 ? (avgMood / 10) * 100 : 0} className="h-1.5 mt-2 bg-green-100" />
                          <p className="text-xs text-green-700 mt-2 capitalize">{moodTrendDisplay.text}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${stressTrendDisplay.color}`}>{stressTrendDisplay.icon}</span>
                            <span className="text-sm font-medium text-orange-900">Stress</span>
                            <span className="ml-auto">{avgStress && avgStress < 4 ? '😌' : avgStress && avgStress < 7 ? '😐' : '😰'}</span>
                          </div>
                          <div className="text-2xl font-bold text-orange-700">
                            {avgStress ? avgStress.toFixed(1) : '—'}
                            <span className="text-sm font-normal text-orange-600">/10</span>
                          </div>
                          <Progress value={avgStress ? (avgStress / 10) * 100 : 0} className="h-1.5 mt-2 bg-orange-100" />
                          <p className="text-xs text-orange-700 mt-2 capitalize">{stressTrendDisplay.text}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-cyan-600" />
                            <span className="text-sm font-medium text-cyan-900">Energy</span>
                            <span className="ml-auto">{avgEnergy && avgEnergy >= 7 ? '⚡' : avgEnergy && avgEnergy >= 4 ? '🔋' : '🪫'}</span>
                          </div>
                          <div className="text-2xl font-bold text-cyan-700">
                            {avgEnergy ? avgEnergy.toFixed(1) : '—'}
                            <span className="text-sm font-normal text-cyan-600">/10</span>
                          </div>
                          <Progress value={avgEnergy ? (avgEnergy / 10) * 100 : 0} className="h-1.5 mt-2 bg-cyan-100" />
                          <p className="text-xs text-cyan-700 mt-2">Average level</p>
                        </div>

                        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${activityTrendDisplay.color}`}>{activityTrendDisplay.icon}</span>
                            <span className="text-sm font-medium text-indigo-900">Activity</span>
                            <span className="ml-auto">{totalActivities >= 10 ? '🏆' : totalActivities > 0 ? '🎯' : '📝'}</span>
                          </div>
                          <div className="text-2xl font-bold text-indigo-700">
                            {totalActivityMinutes}
                            <span className="text-sm font-normal text-indigo-600"> min</span>
                          </div>
                          <p className="text-xs text-indigo-700 mt-2">{totalActivities} sessions logged</p>
                        </div>
                      </div>

                      {latestReport.analysis?.summary && (
                        <div className="p-4 rounded-lg bg-gray-50 border mb-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            📋 Summary
                          </h4>
                          <p className="text-sm text-muted-foreground">{latestReport.analysis.summary}</p>
                        </div>
                      )}

                      {latestReport.recommendations && latestReport.recommendations.length > 0 && (
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                          <h4 className="font-medium text-sm mb-3 text-amber-900 flex items-center gap-2">
                            💡 Personalized Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {latestReport.recommendations.slice(0, 4).map((rec: any, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-amber-600 mt-0.5">✓</span>
                                <div>
                                  <span className="font-medium text-amber-900">
                                    {typeof rec === 'string' ? rec : rec.title || rec.description}
                                  </span>
                                  {typeof rec === 'object' && rec.description && rec.title && (
                                    <p className="text-xs text-amber-700 mt-0.5">{rec.description}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="mood">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      😊 Detailed Mood Analysis
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Track your mood and energy patterns over time to identify what activities and factors influence your emotional wellbeing.</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Daily breakdown of your emotional state - understand your patterns</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                        <XAxis dataKey="date" stroke="#888888" fontSize={window.innerWidth < 640 ? 10 : 12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={window.innerWidth < 640 ? 10 : 12} tickLine={false} axisLine={false} domain={[0, 10]} width={window.innerWidth < 640 ? 20 : 30} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoodDetailed)" name="💜 Mood Level" />
                        <Area type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" name="⚡ Energy Level" />
                        <Legend verticalAlign="top" height={36}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground mb-2">📊 No mood data available</p>
                      <p className="text-sm text-muted-foreground">Log your mood daily to see detailed analysis</p>
                    </div>
                  )}
                </div>
                {chartData.length > 0 && (
                  <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-start gap-2">
                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-purple-700">
                          <span className="font-medium">Understanding Mood:</span> Your mood score (purple) reflects your overall emotional state. Scores above 7 indicate positive emotions, while scores below 4 may suggest you need extra self-care.
                        </div>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                      <div className="flex items-start gap-2">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-cyan-700">
                          <span className="font-medium">Understanding Energy:</span> Your energy level (cyan) shows how physically and mentally energized you feel. Low energy might indicate need for rest or physical activity.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      🎯 Activity Breakdown
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>See which activities you engage in most frequently. Regular activity variety is key to balanced wellbeing.</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>What you've been doing to stay well - track your wellness activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="h-[250px] sm:h-[350px] md:h-[400px] w-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : activityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData} layout="vertical" margin={{ top: 5, right: 10, left: window.innerWidth < 640 ? 60 : 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2}/>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={window.innerWidth < 640 ? 60 : 100} tick={{fontSize: window.innerWidth < 640 ? 11 : 14}} interval={0} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={window.innerWidth < 640 ? 20 : 30} name="Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground mb-2">📊 No activity data available</p>
                      <p className="text-sm text-muted-foreground">Log your activities to see what keeps you well</p>
                    </div>
                  )}
                </div>
                {activityChartData.length > 0 && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-start gap-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-700">
                        <span className="font-medium">Activity Insights:</span> A balanced mix of different activities (exercise, social, relaxation) typically leads to better overall wellbeing. Try to include variety in your daily routine for optimal health benefits.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
