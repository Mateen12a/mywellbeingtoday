import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Clock, Crown, AlertCircle, Loader2, LogIn,
  Activity, Brain, FileText, Search, Bot, Users, Building2, Star, Zap, Mail, X,
} from "lucide-react";

const PLAN_DETAILS = {
  free: {
    name: "Free Trial",
    price: "$0",
    period: "7-day trial",
    color: "text-gray-600",
    features: [
      "2 basic activity logs",
      "2 basic mood track & insight",
      "1 report download",
      "2 directory access",
      "2 AI interactions",
    ],
  },
  starter: {
    name: "Starter",
    price: "$5",
    period: "/month",
    icon: Zap,
    color: "text-blue-600",
    features: [
      "Activity logging",
      "Mood tracking & insight",
      "Limited reports",
      "Directory access",
      "AI interaction",
    ],
  },
  pro: {
    name: "Pro",
    price: "$12",
    period: "/month",
    icon: Star,
    color: "text-purple-600",
    popular: true,
    features: [
      "Full activity logging",
      "Full mood tracking & analysis",
      "Unlimited wellbeing reports",
      "Full directory access",
      "Full AI interactions",
      "Self-care virtual class Part 1",
    ],
  },
  premium: {
    name: "Premium",
    price: "$20",
    period: "/month",
    icon: Crown,
    color: "text-amber-600",
    features: [
      "Everything in Pro",
      "Priority support",
      "Exported wellbeing plan",
      "Self-care virtual class Part 1",
    ],
  },
  team: {
    name: "Team / Enterprise",
    price: "On request",
    period: "",
    icon: Users,
    color: "text-emerald-600",
    contact: true,
    features: [
      "All Premium features",
      "Group features",
      "6-6-4 wellbeing pathways",
      "Team analytics",
    ],
  },
  franchise: {
    name: "Franchise",
    price: "On request",
    period: "",
    icon: Building2,
    color: "text-rose-600",
    contact: true,
    features: [
      "Full platform setup",
      "All certifications",
      "Custom branding",
      "Dedicated support",
    ],
  },
};

type PlanKey = keyof typeof PLAN_DETAILS;

const USAGE_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  activityLogs: { label: "Activity Logs", icon: Activity },
  moodLogs: { label: "Mood Tracking", icon: Brain },
  reportDownloads: { label: "Report Downloads", icon: FileText },
  directoryAccess: { label: "Directory Access", icon: Search },
  aiInteractions: { label: "AI Interactions", icon: Bot },
};

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const isAuthenticated = api.isAuthenticated();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await api.getSubscription();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated && open,
  });

  const { data: pricingData } = useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      const response = await api.getSubscriptionPricing();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !isAuthenticated && open,
  });

  const { data: usageData } = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: async () => {
      const response = await api.getUsage();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated && open,
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await api.startTrial();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-usage"] });
      toast({ title: "Trial Started!", description: "Your 7-day free trial has begun. Explore all features!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await api.createCheckoutSession(plan);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["subscription-usage"] });
        toast({ title: "Plan Updated", description: "Your subscription has been updated." });
      }
    },
    onError: (error: Error) => {
      if (error.message.includes("contact")) {
        toast({ title: "Contact Us", description: "Please contact us for Team and Franchise plans." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.cancelSubscription();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({ title: "Subscription Cancelled", description: "Your subscription has been cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const subscription = data?.subscription;
  const stripeConfigured = data?.stripeConfigured ?? pricingData?.stripeConfigured ?? false;
  const planLimits = data?.planLimits ?? pricingData?.planLimits ?? {};
  const isTrialEligible = isAuthenticated && subscription && subscription.plan === "free" && subscription.status !== "trial" && !subscription.trialEndsAt;
  const isOnTrial = subscription?.status === "trial";
  const isPaid = subscription && subscription.plan !== "free" && subscription.isActive;
  const canCancel = isAuthenticated && (isOnTrial || isPaid) && subscription?.status !== "cancelled";
  const currentPlan = subscription?.plan || "free";

  const planOrder: PlanKey[] = ["free", "starter", "pro", "premium", "team", "franchise"];

  function getButtonLabel(planKey: PlanKey) {
    if (!isAuthenticated) return "Sign Up";
    const detail = PLAN_DETAILS[planKey];
    if ((detail as any).contact) return "Contact Us";
    if (currentPlan === planKey && subscription?.isActive) return "Current Plan";
    if (planKey === "free") return isTrialEligible ? "Start Free Trial" : "Free Plan";
    const currentIdx = planOrder.indexOf(currentPlan as PlanKey);
    const targetIdx = planOrder.indexOf(planKey);
    return targetIdx > currentIdx ? "Upgrade" : "Switch Plan";
  }

  function handlePlanClick(planKey: PlanKey) {
    if (!isAuthenticated) {
      onOpenChange(false);
      navigate("/auth/register");
      return;
    }
    const detail = PLAN_DETAILS[planKey];
    if ((detail as any).contact) {
      toast({ title: "Contact Us", description: "Please reach out to discuss Team and Franchise plans." });
      return;
    }
    if (planKey === "free") {
      if (isTrialEligible) startTrialMutation.mutate();
      return;
    }
    if (currentPlan === planKey && subscription?.isActive) return;
    setUpgradingPlan(planKey);
    upgradeMutation.mutate(planKey);
  }

  function isButtonDisabled(planKey: PlanKey) {
    if (!isAuthenticated) return false;
    if (currentPlan === planKey && subscription?.isActive) return true;
    if (planKey === "free" && !isTrialEligible) return true;
    if (upgradeMutation.isPending && upgradingPlan === planKey) return true;
    if (startTrialMutation.isPending && planKey === "free") return true;
    return false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Subscription & Pricing
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center">
            Choose the plan that works best for your wellbeing journey.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          {isLoading && isAuthenticated && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (
            <>
              {!isAuthenticated && (
                <Alert className="border-blue-200 bg-blue-50">
                  <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 text-sm">Sign in to manage your subscription</AlertTitle>
                  <AlertDescription className="text-blue-700 text-xs sm:text-sm">
                    <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm p-0 h-auto" onClick={() => { onOpenChange(false); navigate("/auth/login"); }}>
                      Log in
                    </Button>
                    {" "}or{" "}
                    <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm p-0 h-auto" onClick={() => { onOpenChange(false); navigate("/auth/register"); }}>
                      create an account
                    </Button>
                    {" "}to start your free trial and access all features.
                  </AlertDescription>
                </Alert>
              )}

              {isOnTrial && subscription?.trialDaysRemaining != null && subscription.trialDaysRemaining > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 text-sm">Trial Active</AlertTitle>
                  <AlertDescription className="text-blue-700 text-xs sm:text-sm">
                    You have <span className="font-semibold">{subscription.trialDaysRemaining} days</span> remaining in your free trial. Upgrade now to keep all your features!
                  </AlertDescription>
                </Alert>
              )}

              {subscription?.status === "cancelled" && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800 text-sm">Subscription Cancelled</AlertTitle>
                  <AlertDescription className="text-yellow-700 text-xs sm:text-sm">
                    Your subscription has been cancelled. You can start a new subscription anytime.
                  </AlertDescription>
                </Alert>
              )}

              {isAuthenticated && subscription && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Current Plan:</span>
                    <Badge variant={isPaid || isOnTrial ? "default" : "secondary"} className="text-xs">
                      {isOnTrial ? "Trial" : PLAN_DETAILS[currentPlan as PlanKey]?.name || currentPlan}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">({subscription.status})</span>
                  </div>
                  {canCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      {cancelMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      Cancel
                    </Button>
                  )}
                </div>
              )}

              {isAuthenticated && usageData && (
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Usage This Month
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(USAGE_LABELS).map(([key, { label, icon: Icon }]) => {
                      const used = usageData.usage?.[key] ?? 0;
                      const limit = usageData.limits?.[key] ?? planLimits?.[currentPlan]?.[key] ?? -1;
                      const isUnlimited = limit === -1;
                      const percentage = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3 w-3 text-muted-foreground" />
                              <span>{label}</span>
                            </div>
                            <span className="text-muted-foreground font-medium">
                              {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
                            </span>
                          </div>
                          {!isUnlimited && <Progress value={percentage} className="h-1.5" />}
                          {isUnlimited && (
                            <div className="h-1.5 bg-green-100 rounded-full">
                              <div className="h-full bg-green-500 rounded-full w-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {planOrder.map((planKey) => {
                  const detail = PLAN_DETAILS[planKey];
                  const IconComp = (detail as any).icon;
                  const isPopular = (detail as any).popular;
                  const isContact = (detail as any).contact;
                  const isCurrent = isAuthenticated && currentPlan === planKey && subscription?.isActive;

                  return (
                    <Card
                      key={planKey}
                      className={`relative flex flex-col ${isCurrent ? "border-primary ring-2 ring-primary" : ""} ${isPopular ? "border-purple-400 ring-1 ring-purple-200" : ""}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-purple-600 hover:bg-purple-700 text-xs">Most Popular</Badge>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-2 right-3 z-10">
                          <Badge className="bg-primary text-xs">Current</Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="flex items-center gap-1.5 text-sm">
                          {IconComp && <IconComp className={`h-3.5 w-3.5 ${detail.color}`} />}
                          {detail.name}
                        </CardTitle>
                        <div className="mt-1">
                          <span className="text-xl font-bold">{detail.price}</span>
                          {detail.period && <span className="text-xs text-muted-foreground">{detail.period}</span>}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-4 flex-1">
                        <ul className="space-y-1">
                          {detail.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-2 pb-3 px-4">
                        <Button
                          className="w-full text-xs h-8"
                          variant={isPopular ? "default" : isCurrent ? "secondary" : "outline"}
                          onClick={() => handlePlanClick(planKey)}
                          disabled={isButtonDisabled(planKey)}
                          size="sm"
                        >
                          {((upgradeMutation.isPending && upgradingPlan === planKey) || (startTrialMutation.isPending && planKey === "free")) && (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          )}
                          {isContact && <Mail className="h-3 w-3 mr-1" />}
                          {getButtonLabel(planKey)}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
