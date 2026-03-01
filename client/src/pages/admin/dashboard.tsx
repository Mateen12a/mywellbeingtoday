import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Users, Activity, UserCheck, AlertCircle, Loader2, Award, TrendingUp, Heart, Clock, Shield, BarChart3, Brain, ChevronDown, ChevronUp, Lightbulb, Bell, CheckCircle, ArrowUp, ArrowDown, Minus, RefreshCw, CreditCard, Crown, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-200',
  starter: 'bg-blue-100 text-blue-700 border-blue-200',
  pro: 'bg-purple-100 text-purple-700 border-purple-200',
  premium: 'bg-amber-100 text-amber-700 border-amber-200',
  team: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  franchise: 'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  trial: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [aiInsightsOpen, setAiInsightsOpen] = useState(true);
  const [subAnalyticsOpen, setSubAnalyticsOpen] = useState(true);
  const currentUser = api.getUser();
  const isSuperAdmin = currentUser?.role === 'admin';

  const { data: subAnalytics, isLoading: subAnalyticsLoading } = useQuery({
    queryKey: ["admin", "subscription-analytics"],
    queryFn: async () => {
      const response = await api.getSubscriptionAnalytics();
      return response.data;
    },
    enabled: isSuperAdmin,
    staleTime: 2 * 60 * 1000,
  });

  const { data: aiInsightsData, isLoading: aiInsightsLoading, refetch: refetchAiInsights } = useQuery({
    queryKey: ["admin", "ai-insights"],
    queryFn: async () => {
      const response = await api.getAdminAIInsights();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const response = await api.getAdminDashboard();
      return response.data;
    },
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const { data: superAdminStats, isLoading: superAdminStatsLoading } = useQuery({
    queryKey: ["admin", "superadminStats"],
    queryFn: async () => {
      const response = await api.getSuperAdminStats();
      return response.data;
    },
    enabled: isSuperAdmin,
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const baseStats = dashboardData
    ? [
        {
          title: "Total Users",
          value: dashboardData.users?.total?.toLocaleString() || "0",
          change: `${dashboardData.users?.newThisWeek || 0} new this week`,
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-100",
          action: () => setLocation("/admin/users"),
        },
        {
          title: "Verified Providers",
          value: dashboardData.providers?.verified?.toLocaleString() || "0",
          change: `${dashboardData.providers?.total || 0} total providers`,
          icon: UserCheck,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          action: () => setLocation("/admin/providers"),
        },
        {
          title: "Total Appointments",
          value: dashboardData.appointments?.total?.toLocaleString() || "0",
          change: `${dashboardData.appointments?.pending || 0} pending`,
          icon: Activity,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-100",
          action: () => {},
        },
        {
          title: "Pending Verifications",
          value: (
            (dashboardData.providers?.total || 0) -
            (dashboardData.providers?.verified || 0)
          ).toString(),
          change: "Requires attention",
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-100",
          action: () => setLocation("/admin/providers?filter=pending"),
        },
      ]
    : [];

  const superAdminStatsCards = isSuperAdmin && dashboardData
    ? [
        {
          title: "Certificates Issued",
          value: dashboardData.certificates?.total?.toLocaleString() || "0",
          change: "All time",
          icon: Award,
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-100",
          action: () => {},
        },
        {
          title: "Activities Logged",
          value: dashboardData.activities?.total?.toLocaleString() || "0",
          change: "User activities",
          icon: TrendingUp,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
          border: "border-cyan-100",
          action: () => {},
        },
        {
          title: "Mood Logs",
          value: dashboardData.moodLogs?.total?.toLocaleString() || "0",
          change: "All time",
          icon: Heart,
          color: "text-pink-600",
          bg: "bg-pink-50",
          border: "border-pink-100",
          action: () => {},
        },
        {
          title: "Audit Logs",
          value: dashboardData.auditLogs?.total?.toLocaleString() || "0",
          change: "System events",
          icon: Clock,
          color: "text-slate-600",
          bg: "bg-slate-50",
          border: "border-slate-100",
          action: () => setLocation("/admin/audit-logs"),
        },
      ]
    : [];

  const stats = [...baseStats, ...superAdminStatsCards];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome back, {currentUser?.profile?.firstName || "Admin"}
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening on your platform today.
          </p>
        </div>

        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, i) => (
                <Card
                  key={i}
                  onClick={stat.action}
                  className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border ${stat.border} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <Badge
                        variant="outline"
                        className="font-normal text-xs bg-background/50"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {stat.value}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                        {stat.title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Collapsible open={aiInsightsOpen} onOpenChange={setAiInsightsOpen}>
              <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            AI Dashboard Insights
                            {aiInsightsData?.insights?.source === 'ai' && (
                              <Badge variant="secondary" className="text-xs font-normal">AI-Powered</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Intelligent analysis and recommendations for platform management
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            refetchAiInsights();
                          }}
                          disabled={aiInsightsLoading}
                        >
                          <RefreshCw className={`h-4 w-4 ${aiInsightsLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        {aiInsightsOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {aiInsightsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                        <span className="ml-2 text-sm text-muted-foreground">Analyzing platform data...</span>
                      </div>
                    ) : aiInsightsData?.insights ? (
                      <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-500" />
                              Platform Health
                            </h4>
                            <Badge 
                              variant={aiInsightsData.insights.platformHealth?.status === 'healthy' ? 'default' : aiInsightsData.insights.platformHealth?.status === 'critical' ? 'destructive' : 'secondary'}
                              className={aiInsightsData.insights.platformHealth?.status === 'healthy' ? 'bg-emerald-500' : ''}
                            >
                              {aiInsightsData.insights.platformHealth?.status?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {aiInsightsData.insights.platformHealth?.summary}
                          </p>
                          {aiInsightsData.insights.platformHealth?.metrics && aiInsightsData.insights.platformHealth.metrics.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                              {aiInsightsData.insights.platformHealth.metrics.map((metric: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{metric.value}</span>
                                    {metric.trend === 'up' && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                                    {metric.trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                                    {metric.trend === 'stable' && <Minus className="h-3 w-3 text-muted-foreground" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {aiInsightsData.insights.suggestions && aiInsightsData.insights.suggestions.length > 0 && (
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              Suggestions for Improvement
                            </h4>
                            <div className="space-y-3">
                              {aiInsightsData.insights.suggestions.map((suggestion: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs shrink-0 ${
                                      suggestion.priority === 'high' ? 'border-red-500 text-red-600' : 
                                      suggestion.priority === 'medium' ? 'border-amber-500 text-amber-600' : 
                                      'border-blue-500 text-blue-600'
                                    }`}
                                  >
                                    {suggestion.priority}
                                  </Badge>
                                  <div>
                                    <p className="text-sm font-medium">{suggestion.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {aiInsightsData.insights.userAlerts && aiInsightsData.insights.userAlerts.length > 0 && (
                            <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <Bell className="h-4 w-4 text-red-500" />
                                User Alerts
                              </h4>
                              <div className="space-y-2">
                                {aiInsightsData.insights.userAlerts.map((alert: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-medium">{alert.count} users</span>
                                      <span className="text-muted-foreground"> - {alert.type?.replace(/_/g, ' ')}</span>
                                      <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiInsightsData.insights.providerRecommendations && aiInsightsData.insights.providerRecommendations.length > 0 && (
                            <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                                Provider Recommendations
                              </h4>
                              <div className="space-y-2">
                                {aiInsightsData.insights.providerRecommendations.map((rec: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                      <Badge variant="outline" className="text-xs mb-1">{rec.type}</Badge>
                                      <p className="text-xs text-muted-foreground">{rec.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground text-right">
                          Generated {aiInsightsData.insights.generatedAt ? new Date(aiInsightsData.insights.generatedAt).toLocaleString() : 'recently'}
                          {aiInsightsData.insights.source === 'fallback' && ' (offline mode)'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Unable to load AI insights. Please try again.</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchAiInsights()}>
                          Retry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {isSuperAdmin && <Collapsible open={subAnalyticsOpen} onOpenChange={setSubAnalyticsOpen}>
              <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Subscription Analytics</CardTitle>
                          <CardDescription>How users are subscribing across plans</CardDescription>
                        </div>
                      </div>
                      {subAnalyticsOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {subAnalyticsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading subscription data...</span>
                      </div>
                    ) : subAnalytics ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40 text-center">
                            <p className="text-2xl font-bold text-foreground">{subAnalytics.overview?.total || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Subscriptions</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40 text-center">
                            <p className="text-2xl font-bold text-emerald-600">{subAnalytics.overview?.paid || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Paid Users</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40 text-center">
                            <p className="text-2xl font-bold text-blue-600">{subAnalytics.overview?.trial || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">On Trial</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40 text-center">
                            <p className="text-2xl font-bold text-gray-600">{subAnalytics.overview?.free || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Free Plan</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Crown className="h-4 w-4 text-amber-500" />
                              Plan Distribution
                            </h4>
                            <div className="space-y-3">
                              {subAnalytics.planDistribution?.map((plan: any) => {
                                const total = subAnalytics.overview?.total || 1;
                                const pct = Math.round((plan.count / total) * 100);
                                return (
                                  <div key={plan._id} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Badge className={`text-xs ${PLAN_COLORS[plan._id] || 'bg-gray-100 text-gray-700'}`}>
                                        {plan._id}
                                      </Badge>
                                      <span className="text-sm font-medium">{plan.count} ({pct}%)</span>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Activity className="h-4 w-4 text-blue-500" />
                              Status Breakdown
                            </h4>
                            <div className="space-y-3">
                              {subAnalytics.statusDistribution?.map((status: any) => (
                                <div key={status._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                  <Badge className={`text-xs ${STATUS_COLORS[status._id] || 'bg-gray-100 text-gray-600'}`}>
                                    {status._id}
                                  </Badge>
                                  <span className="text-sm font-medium">{status.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {subAnalytics.recentUpgrades?.length > 0 && (
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              Recent Upgrades (Last 30 Days)
                            </h4>
                            <div className="space-y-2">
                              {subAnalytics.recentUpgrades.slice(0, 10).map((upgrade: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{upgrade.name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{upgrade.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${PLAN_COLORS[upgrade.plan] || ''}`}>
                                      {upgrade.plan}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(upgrade.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {subAnalytics.recentCancellations?.length > 0 && (
                          <div className="p-4 rounded-lg bg-background/80 border border-red-200/60">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              Recent Cancellations
                            </h4>
                            <div className="space-y-2">
                              {subAnalytics.recentCancellations.map((cancel: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{cancel.name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{cancel.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs border-red-200 text-red-600">{cancel.plan}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {cancel.cancelledAt ? new Date(cancel.cancelledAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {subAnalytics.topUsers?.length > 0 && (
                          <div className="p-4 rounded-lg bg-background/80 border border-border/40">
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <TrendingUp className="h-4 w-4 text-cyan-500" />
                              Most Active Paid Users
                            </h4>
                            <div className="space-y-2">
                              {subAnalytics.topUsers.slice(0, 5).map((user: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge className={`text-xs ${PLAN_COLORS[user.plan] || ''}`}>{user.plan}</Badge>
                                    <div className="text-xs text-muted-foreground text-right">
                                      <span>{user.usage?.activityLogs || 0} acts</span>
                                      <span className="mx-1">·</span>
                                      <span>{user.usage?.moodLogs || 0} moods</span>
                                      <span className="mx-1">·</span>
                                      <span>{user.usage?.aiInteractions || 0} AI</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No subscription data available</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>}

            {dashboardData?.userGrowth && dashboardData.userGrowth.length > 0 && (
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>User Growth (Last 30 Days)</CardTitle>
                  <CardDescription>
                    New user registrations over the past month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData.userGrowth.slice(-7).map((day: any) => (
                      <div
                        key={day._id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {formatDate(day._id)}
                        </span>
                        <Badge variant="secondary">
                          {day.count} new users
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isSuperAdmin && superAdminStats && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-border/60 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">This Week Activity</CardTitle>
                      <CardDescription>Platform activity over the past 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-cyan-500" />
                          <span className="text-sm">Activities Logged</span>
                        </div>
                        <Badge variant="secondary">{superAdminStats.thisWeek?.activities || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="text-sm">Mood Logs</span>
                        </div>
                        <Badge variant="secondary">{superAdminStats.thisWeek?.moodLogs || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">Certificates Issued</span>
                        </div>
                        <Badge variant="secondary">{superAdminStats.thisWeek?.certificates || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Login Attempts</span>
                        </div>
                        <Badge variant="secondary">{superAdminStats.thisWeek?.loginAttempts || 0}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/60 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Provider Approvals</CardTitle>
                      <CardDescription>Latest provider verifications with approver info</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {superAdminStats.providerApprovals?.length > 0 ? (
                        <div className="space-y-3">
                          {superAdminStats.providerApprovals.slice(0, 5).map((log: any) => (
                            <div key={log._id} className="flex items-start justify-between py-2 border-b border-border/40 last:border-0">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {log.details?.providerName || 'Unknown Provider'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Approved by: {log.details?.approverName || log.userId?.email || 'Unknown'}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No provider approvals yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Audit Actions (Last 30 Days)</CardTitle>
                    <CardDescription>Most common actions performed on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {superAdminStats.auditActionCounts?.slice(0, 8).map((action: any) => (
                        <div key={action._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <Badge variant="outline" className="font-mono text-xs truncate max-w-[120px]">
                            {action._id?.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm font-medium ml-2">{action.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
