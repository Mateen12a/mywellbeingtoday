import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Clock, Crown, CircleAlert, Loader, LogIn,
  Activity, Brain, Search, Bot, Users, Building2, Star, Bolt, Mail,
  CircleCheckBig, ArrowUp, CreditCard, Plus, Trash2, ExternalLink, ShieldCheck, RotateCcw, CalendarDays,
} from "lucide-react";
import { CLIENT_PLAN_LIMITS } from "@/hooks/useSubscription";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: "$0",
    period: "/month",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    features: [
      "2 basic activity logs",
      "2 basic mood track & insight",
      "Free report downloads",
      "2 directory access",
      "2 AI interactions",
    ],
  },
  starter: {
    name: "Starter",
    price: "$5",
    period: "/month",
    icon: Bolt,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    features: [
      "10 activity logs per day",
      "10 mood tracking entries",
      "3 report downloads",
      "10 directory searches",
      "10 AI interactions",
    ],
  },
  pro: {
    name: "Pro",
    price: "$12",
    period: "/month",
    icon: Star,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    popular: true,
    features: [
      "Unlimited activity logging",
      "Unlimited mood tracking & analysis",
      "Unlimited wellbeing reports",
      "Unlimited directory access",
      "Unlimited AI interactions",
      "Self-care virtual class Part 1",
    ],
  },
  premium: {
    name: "Premium",
    price: "$20",
    period: "/month",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
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
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
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
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
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

const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro", "premium", "team", "franchise"];
const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, premium: 3, team: 4, franchise: 5 };

const USAGE_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  activityLogs: { label: "Activity Logs", icon: Activity },
  moodLogs: { label: "Mood Tracking", icon: Brain },
  reportDownloads: { label: "Report Downloads", icon: Activity },
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
  const [activeTab, setActiveTab] = useState<"plans" | "cards">("plans");
  const [usageView, setUsageView] = useState<"daily" | "monthly">("daily");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactPlan, setContactPlan] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const isAuthenticated = api.isAuthenticated();

  const { data, isLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await api.getSubscription();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated && open,
    staleTime: 0,
    refetchOnMount: "always",
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

  const { data: usageData, refetch: refetchUsage } = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: async () => {
      const response = await api.getUsage();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated && open,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: cardsData, isLoading: cardsLoading, refetch: refetchCards } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const response = await api.getPaymentMethods();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated && open && activeTab === "cards",
    staleTime: 30000,
  });

  const refreshAll = () => {
    refetchSubscription();
    refetchUsage();
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["subscription-usage"] });
    queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
  };

  const contactMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const response = await api.createSupportTicket(subject, message, { category: "billing", priority: "medium" });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      setContactDialogOpen(false);
      setContactSubject("");
      setContactMessage("");
      toast({ title: "Inquiry Sent!", description: "We'll get back to you shortly about your subscription inquiry." });
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
    onSuccess: async (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.requiresAction && data?.clientSecret) {
        try {
          const keyRes = await fetch("/api/subscription/stripe-key");
          const keyData = await keyRes.json();
          const stripeKey = keyData?.data?.publishableKey;
          if (stripeKey) {
            const { loadStripe } = await import("@stripe/stripe-js");
            const stripe = await loadStripe(stripeKey);
            if (stripe) {
              const { error } = await stripe.confirmCardPayment(data.clientSecret);
              if (error) {
                setUpgradingPlan(null);
                toast({ title: "Authentication Failed", description: error.message || "Card authentication failed. Please try again.", variant: "destructive" });
                return;
              }
            }
          }
          setUpgradingPlan(null);
          refreshAll();
          toast({ title: "Plan Updated!", description: "Your subscription has been activated after authentication." });
          setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
          setUpgradingPlan(null);
          toast({ title: "Error", description: err.message || "Payment authentication failed.", variant: "destructive" });
        }
      } else if (data?.reactivated) {
        setUpgradingPlan(null);
        refreshAll();
        toast({ title: "Plan Reactivated!", description: "Your subscription has been reactivated successfully." });
        setTimeout(() => window.location.reload(), 1500);
      } else if (data?.upgraded) {
        setUpgradingPlan(null);
        refreshAll();
        toast({ title: "Plan Updated!", description: "Your subscription has been updated using your saved card." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setUpgradingPlan(null);
        refreshAll();
        toast({ title: "Plan Updated", description: "Your subscription has been updated." });
        setTimeout(() => window.location.reload(), 1500);
      }
    },
    onError: (error: Error) => {
      setUpgradingPlan(null);
      if (error.message.includes("contact")) {
        toast({ title: "Contact Us", description: "Please contact us for Team and Franchise plans." });
      } else if (error.message.includes("coming soon")) {
        toast({ title: "Coming Soon", description: "Payment processing is coming soon. Please check back later." });
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
      refreshAll();
      toast({ title: "Subscription Cancelled", description: "Your subscription has been cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async () => {
      const response = await api.addPaymentMethod();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultCardMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await api.setDefaultPaymentMethod(paymentMethodId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      refetchCards();
      toast({ title: "Default Card Updated", description: "Your default payment method has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeCardMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await api.removePaymentMethod(paymentMethodId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      refetchCards();
      refreshAll();
      toast({ title: "Card Removed", description: "Your payment method has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await api.openBillingPortal();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data?.portalUrl) {
        window.open(data.portalUrl, '_blank');
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const subscription = data?.subscription;
  const stripeConfigured = data?.stripeConfigured ?? pricingData?.stripeConfigured ?? false;
  const hasPaymentMethod = (data as any)?.hasPaymentMethod ?? false;
  const planLimits = data?.planLimits ?? pricingData?.planLimits ?? {};
  const currentPlan = (subscription?.plan || "free") as PlanKey;
  const previousPlan = (subscription as any)?.previousPlan as PlanKey | null;
  const currentRank = PLAN_RANK[currentPlan] ?? 0;
  const isOnTrial = subscription?.status === "trial";
  const isActive = subscription?.isActive;
  const isPaid = currentPlan !== "free" && isActive;
  const isCancelled = subscription?.status === "cancelled";
  const isExpired = subscription?.status === "expired";
  const canCancel = isAuthenticated && (isOnTrial || isPaid) && !isCancelled;
  const billingPeriod = (subscription as any)?.billingPeriod;
  const hasBillingTimeLeft = isPaid && isActive && billingPeriod && billingPeriod.daysRemaining > 0;

  function getButtonConfig(planKey: PlanKey): { label: string; disabled: boolean; variant: "default" | "secondary" | "outline" | "ghost"; icon?: typeof Check } {
    if (!isAuthenticated) return { label: "Sign Up", disabled: false, variant: "default" };

    const detail = PLAN_DETAILS[planKey] as any;
    const targetRank = PLAN_RANK[planKey] ?? 0;

    if (detail.contact) return { label: "Contact Us", disabled: false, variant: "outline" };

    if (planKey === "free") {
      if (currentPlan === "free" && !isOnTrial) return { label: "Current Plan", disabled: true, variant: "secondary", icon: CircleCheckBig };
      if (isOnTrial) return { label: "Active Trial", disabled: true, variant: "secondary", icon: CircleCheckBig };
      return { label: "Free Plan", disabled: true, variant: "ghost" };
    }

    if (currentPlan === planKey && isActive) {
      return { label: "Current Plan", disabled: true, variant: "secondary", icon: CircleCheckBig };
    }

    if (isCancelled || isExpired) {
      const previousRank = previousPlan ? (PLAN_RANK[previousPlan] ?? 0) : 0;
      const hasBillingTimeOnPrevious = billingPeriod && billingPeriod.daysRemaining > 0;

      if (previousPlan && planKey === previousPlan && hasBillingTimeOnPrevious) {
        return { label: "Reactivate", disabled: false, variant: "default", icon: RotateCcw };
      }
      if (previousPlan && hasBillingTimeOnPrevious && targetRank > previousRank) {
        return { label: hasPaymentMethod ? "Upgrade Instantly" : "Upgrade", disabled: false, variant: "default", icon: ArrowUp };
      }
      if (previousPlan && hasBillingTimeOnPrevious && targetRank < previousRank && (planKey as string) !== "free") {
        return { label: `Available after ${new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, disabled: true, variant: "ghost", icon: Clock };
      }
      return { label: "Subscribe", disabled: false, variant: "default" };
    }

    if (targetRank > currentRank) {
      return { label: hasPaymentMethod ? "Upgrade Instantly" : "Upgrade", disabled: false, variant: "default", icon: ArrowUp };
    }

    if (targetRank < currentRank) {
      if (hasBillingTimeLeft) {
        return { label: `Available in ${billingPeriod.daysRemaining}d`, disabled: true, variant: "ghost", icon: Clock };
      }
      return { label: "Switch Plan", disabled: false, variant: "outline" };
    }

    return { label: "Switch Plan", disabled: false, variant: "outline" };
  }

  function handlePlanClick(planKey: PlanKey) {
    if (!isAuthenticated) {
      onOpenChange(false);
      navigate("/auth/register");
      return;
    }
    const detail = PLAN_DETAILS[planKey] as any;
    if (detail.contact) {
      const planName = detail.name || planKey;
      setContactPlan(planName);
      setContactSubject(`${planName} Subscription Inquiry`);
      setContactMessage(`Hi, I'm interested in the ${planName} plan. Please provide more information about pricing, features, and setup.`);
      setContactDialogOpen(true);
      return;
    }
    if (planKey === "free") {
      return;
    }
    if (currentPlan === planKey && isActive) return;

    const targetRank = PLAN_RANK[planKey] ?? 0;
    if (targetRank < currentRank && hasBillingTimeLeft) {
      const endDate = new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      toast({
        title: "Downgrade not available yet",
        description: `Your ${PLAN_DETAILS[currentPlan]?.name} plan is active until ${endDate}. You can switch to a lower plan after your current billing period ends.`,
        variant: "destructive",
      });
      return;
    }

    setUpgradingPlan(planKey);
    upgradeMutation.mutate(planKey);
  }

  const isButtonLoading = (planKey: PlanKey) => {
    return (upgradeMutation.isPending && upgradingPlan === planKey);
  };

  const cards = cardsData?.paymentMethods || [];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 w-[calc(100vw-16px)] sm:w-auto">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            {isAuthenticated && isPaid ? "Manage Subscription" : "Subscription & Pricing"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground text-center">
            {isAuthenticated && isPaid
              ? "View your plan, manage cards, and control your subscription."
              : "Choose the plan that works best for your wellbeing journey."}
          </DialogDescription>
        </DialogHeader>

        {isAuthenticated && (
          <div className="px-4 sm:px-6">
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
              <button
                onClick={() => setActiveTab("plans")}
                className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === "plans"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Plans
              </button>
              <button
                onClick={() => setActiveTab("cards")}
                className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-1.5 ${
                  activeTab === "cards"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Payment Methods</span>
                <span className="sm:hidden">Cards</span>
              </button>
            </div>
          </div>
        )}

        <div className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4">
          {isLoading && isAuthenticated && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && activeTab === "plans" && (
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
                    {" "}to access all features.
                  </AlertDescription>
                </Alert>
              )}


              {isCancelled && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <CircleAlert className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800 text-sm">Subscription Cancelled</AlertTitle>
                  <AlertDescription className="text-yellow-700 text-xs sm:text-sm space-y-1">
                    <p>
                      Your {previousPlan ? PLAN_DETAILS[previousPlan]?.name : ''} subscription has been cancelled.
                      {previousPlan && billingPeriod && billingPeriod.daysRemaining > 0
                        ? ` You still have ${billingPeriod.daysRemaining} day${billingPeriod.daysRemaining !== 1 ? 's' : ''} left — reactivate to resume your plan.`
                        : previousPlan ? ` Choose a plan to get started again.` : ''}
                    </p>
                    {billingPeriod && (
                      <p className="flex items-center gap-1 text-yellow-600">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(billingPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {isExpired && (
                <Alert className="border-red-200 bg-red-50">
                  <CircleAlert className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  <AlertTitle className="text-red-800 text-sm">Subscription Expired</AlertTitle>
                  <AlertDescription className="text-red-700 text-xs sm:text-sm space-y-1">
                    <p>
                      Your {previousPlan ? `${PLAN_DETAILS[previousPlan]?.name} ` : ''}subscription has expired. Reactivate or choose a new plan to continue using premium features.
                    </p>
                    {billingPeriod && (
                      <p className="flex items-center gap-1 text-red-500">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(billingPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {isAuthenticated && subscription && (
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {(isCancelled || isExpired) && previousPlan ? "Previous Plan:" : "Current Plan:"}
                      </span>
                      <Badge variant={isPaid || isOnTrial ? "default" : "secondary"} className="text-xs">
                        {(isCancelled || isExpired) && previousPlan
                          ? PLAN_DETAILS[previousPlan]?.name || previousPlan
                          : PLAN_DETAILS[currentPlan]?.name || currentPlan}
                      </Badge>
                      {isOnTrial && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {subscription.trialDaysRemaining} days left
                        </Badge>
                      )}
                      {isPaid && isActive && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                          <CircleCheckBig className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs">Cancelled</Badge>
                      )}
                      {isExpired && (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 text-xs">Expired</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="text-xs text-red-600 hover:text-red-700 min-h-[36px]"
                        >
                          {cancelMutation.isPending && <Loader className="h-3 w-3 animate-spin mr-1" />}
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                  {isPaid && isActive && billingPeriod && (
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="sub-dialog-billing-text">
                        Subscribed since {new Date(billingPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Renews {new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {billingPeriod.daysRemaining > 0 && ` (${billingPeriod.daysRemaining} days left)`}
                      </span>
                    </div>
                  )}
                  {(isCancelled || isExpired) && billingPeriod && (
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="sub-dialog-billing-text">
                        Was active {new Date(billingPeriod.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              )}


              {isAuthenticated && usageData && (
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => setUsageView("daily")}
                      className={`text-sm font-semibold flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                        usageView === "daily"
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Today
                    </button>
                    <button
                      onClick={() => setUsageView("monthly")}
                      className={`text-sm font-semibold flex items-center gap-1.5 pb-1 border-b-2 transition-colors ${
                        usageView === "monthly"
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      This Month
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sub-dialog-usage-grid">
                    {Object.entries(USAGE_LABELS).map(([key, { label, icon: Icon }]) => {
                      const isDirectoryAccess = key === "directoryAccess";
                      const dailyUsed = usageData.usage?.[key] ?? 0;
                      const monthlyUsed = usageData.monthlyUsage?.[key] ?? 0;
                      const used = isDirectoryAccess
                        ? ((subscription as any)?.monthlyUsage?.directoryAccess ?? monthlyUsed)
                        : usageView === "daily" ? dailyUsed : monthlyUsed;
                      const monthlyPlanLimits = (data as any)?.monthlyPlanLimits;
                      const limit = isDirectoryAccess
                        ? (monthlyPlanLimits?.directoryAccess ?? usageData.limits?.[key] ?? planLimits?.[currentPlan]?.[key] ?? CLIENT_PLAN_LIMITS[currentPlan]?.[key] ?? CLIENT_PLAN_LIMITS.free[key])
                        : (usageData.limits?.[key] ?? planLimits?.[currentPlan]?.[key] ?? CLIENT_PLAN_LIMITS[currentPlan]?.[key] ?? CLIENT_PLAN_LIMITS.free[key]);
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
                              {isUnlimited
                                ? `${used} used`
                                : isDirectoryAccess
                                ? `${used} / ${limit} this month`
                                : usageView === "daily"
                                ? `${used} / ${limit}`
                                : `${used} this month`}
                            </span>
                          </div>
                          {!isUnlimited && (usageView === "daily" || isDirectoryAccess) && (
                            <Progress
                              value={percentage}
                              className={`h-1.5 ${percentage >= 100 ? '[&>div]:bg-red-500' : percentage >= 75 ? '[&>div]:bg-amber-500' : ''}`}
                            />
                          )}
                          {!isUnlimited && usageView === "monthly" && !isDirectoryAccess && (
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary/60 transition-all"
                                style={{ width: `${Math.min(100, used > 0 ? Math.max(8, (used / Math.max(used, limit * 30)) * 100) : 0)}%` }}
                              />
                            </div>
                          )}
                          {isUnlimited && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CircleCheckBig className="h-3 w-3" />
                              <span>{usageView === "daily" ? "Unlimited" : `${used} total this month`}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sub-dialog-plans-grid">
                {PLAN_ORDER.map((planKey) => {
                  const detail = PLAN_DETAILS[planKey] as any;
                  const IconComp = detail.icon;
                  const isPopular = detail.popular;
                  const isContact = detail.contact;
                  const isCurrent = isAuthenticated && currentPlan === planKey && isActive;
                  const isPreviousPlan = isAuthenticated && (isCancelled || isExpired) && previousPlan === planKey;
                  const btnConfig = getButtonConfig(planKey);
                  const BtnIcon = btnConfig.icon;

                  return (
                    <Card
                      key={planKey}
                      className={`relative flex flex-col transition-all ${
                        isCurrent
                          ? "border-primary ring-2 ring-primary shadow-md"
                          : isPreviousPlan
                          ? "border-amber-400 ring-1 ring-amber-200"
                          : isPopular && !isCurrent
                          ? "border-purple-400 ring-1 ring-purple-200"
                          : ""
                      }`}
                    >
                      {isPopular && !isCurrent && !isPreviousPlan && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-purple-600 hover:bg-purple-700 text-xs">Most Popular</Badge>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-primary text-xs">
                            <CircleCheckBig className="h-3 w-3 mr-1" />
                            Your Plan
                          </Badge>
                        </div>
                      )}
                      {isPreviousPlan && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Previous Plan
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2 pt-4 px-2 sm:px-4">
                        <CardTitle className="flex items-center gap-1.5 text-xs sm:text-sm">
                          {IconComp && <IconComp className={`h-3.5 w-3.5 ${detail.color}`} />}
                          {detail.name}
                        </CardTitle>
                        <div className="mt-1">
                          <span className="text-xl font-bold">{detail.price}</span>
                          {detail.period && <span className="text-xs text-muted-foreground">{detail.period}</span>}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 px-2 sm:px-4 flex-1">
                        <ul className="space-y-1">
                          {detail.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-2 pb-3 px-2 sm:px-4">
                        <Button
                          className={`w-full text-xs min-h-[36px] sm:h-8 ${
                            isCurrent ? "opacity-70" : ""
                          }`}
                          variant={isCurrent ? "secondary" : isPopular ? "default" : btnConfig.variant}
                          onClick={() => handlePlanClick(planKey)}
                          disabled={btnConfig.disabled || isButtonLoading(planKey)}
                          size="sm"
                        >
                          {isButtonLoading(planKey) && (
                            <Loader className="h-3 w-3 animate-spin mr-1" />
                          )}
                          {!isButtonLoading(planKey) && BtnIcon && (
                            <BtnIcon className="h-3 w-3 mr-1" />
                          )}
                          {isContact && !isButtonLoading(planKey) && <Mail className="h-3 w-3 mr-1" />}
                          {btnConfig.label}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && activeTab === "cards" && isAuthenticated && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Saved Payment Methods
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage your saved cards. Your default card will be used for automatic billing.
                  </p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCardMutation.mutate()}
                    disabled={addCardMutation.isPending || !stripeConfigured}
                    className="text-xs min-h-[36px]"
                  >
                    {addCardMutation.isPending ? (
                      <Loader className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    Add Card
                  </Button>
                  {stripeConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => billingPortalMutation.mutate()}
                      disabled={billingPortalMutation.isPending}
                      className="text-xs min-h-[36px]"
                    >
                      {billingPortalMutation.isPending ? (
                        <Loader className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <ExternalLink className="h-3 w-3 mr-1" />
                      )}
                      Billing Portal
                    </Button>
                  )}
                </div>
              </div>

              {!stripeConfigured && (
                <Alert className="border-amber-200 bg-amber-50">
                  <CircleAlert className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 text-sm">Payment Not Configured</AlertTitle>
                  <AlertDescription className="text-amber-700 text-xs sm:text-sm">
                    Payment processing is not yet set up. Card management will be available once Stripe is configured.
                  </AlertDescription>
                </Alert>
              )}

              {cardsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!cardsLoading && stripeConfigured && cards.length === 0 && (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-foreground mb-1">No saved cards</h4>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                    Add a card to enable seamless plan upgrades and automatic billing — no need to enter your details each time.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => addCardMutation.mutate()}
                    disabled={addCardMutation.isPending}
                    className="text-xs"
                  >
                    {addCardMutation.isPending ? (
                      <Loader className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    Add Your First Card
                  </Button>
                </div>
              )}

              {!cardsLoading && cards.length > 0 && (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        card.isDefault ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`w-8 sm:w-10 h-6 sm:h-7 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase shrink-0 ${
                          card.brand === "visa" ? "bg-blue-100 text-blue-700" :
                          card.brand === "mastercard" ? "bg-red-100 text-red-700" :
                          card.brand === "amex" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {card.brand === "visa" ? "VISA" :
                           card.brand === "mastercard" ? "MC" :
                           card.brand === "amex" ? "AMEX" :
                           card.brand.toUpperCase().slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-medium">
                              •••• {card.last4}
                            </span>
                            {card.isDefault && (
                              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary px-1.5 py-0">
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!card.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultCardMutation.mutate(card.id)}
                            disabled={setDefaultCardMutation.isPending}
                            className="text-xs h-7 px-2"
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCardMutation.mutate(card.id)}
                          disabled={removeCardMutation.isPending}
                          className="text-xs h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="rounded-lg bg-muted/30 border p-3 space-y-2">
                <h4 className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                  How saved cards work
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                    Your card details are stored securely by Stripe — we never see your full card number
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                    Upgrade or switch plans instantly without re-entering card details
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                    Monthly billing is charged to your default card automatically
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                    You can remove your card at any time
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

    </Dialog>

      {contactDialogOpen && (
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="max-w-md w-[calc(100vw-16px)] sm:w-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{contactPlan} Inquiry</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Submit your inquiry and our team will get back to you shortly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-subject" className="text-xs sm:text-sm">Subject</Label>
                <Input
                  id="contact-subject"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="text-xs sm:text-sm">Message</Label>
                <Textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContactDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => contactMutation.mutate({ subject: contactSubject, message: contactMessage })}
                disabled={contactMutation.isPending || !contactSubject.trim() || !contactMessage.trim()}
                className="text-xs"
              >
                {contactMutation.isPending && <Loader className="h-3 w-3 animate-spin mr-1" />}
                <Mail className="h-3 w-3 mr-1" />
                Send Inquiry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
