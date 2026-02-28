import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Check, Clock, Crown, Sparkles, AlertCircle, Loader2, LogIn,
  Activity, Brain, FileText, Search, Bot, Users, Building2, Star, Zap, Mail
} from 'lucide-react';

const PLAN_DETAILS = {
  free: {
    name: 'Free Trial',
    price: '$0',
    period: '7-day trial',
    icon: Sparkles,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    features: [
      '2 basic activity logs',
      '2 basic mood track & insight',
      '1 report download',
      '2 directory access',
      '2 AI interactions',
    ],
  },
  starter: {
    name: 'Starter',
    price: '$5',
    period: '/month',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      'Activity logging',
      'Mood tracking & insight',
      'Limited reports',
      'Directory access',
      'AI interaction',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$12',
    period: '/month',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    popular: true,
    features: [
      'Full activity logging',
      'Full mood tracking & analysis',
      'Unlimited wellbeing reports',
      'Full directory access',
      'Full AI interactions',
      'Self-care virtual class Part 1',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$20',
    period: '/month',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    features: [
      'Everything in Pro',
      'Priority support',
      'Exported wellbeing plan',
      'Self-care virtual class Part 1',
    ],
  },
  team: {
    name: 'Team / Enterprise',
    price: 'On request',
    period: '',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    contact: true,
    features: [
      'All Premium features',
      'Group features',
      '6-6-4 wellbeing pathways',
      'Team analytics',
    ],
  },
  franchise: {
    name: 'Franchise',
    price: 'On request',
    period: '',
    icon: Building2,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    contact: true,
    features: [
      'Full platform setup',
      'All certifications',
      'Custom branding',
      'Dedicated support',
    ],
  },
};

type PlanKey = keyof typeof PLAN_DETAILS;

const USAGE_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  activityLogs: { label: 'Activity Logs', icon: Activity },
  moodLogs: { label: 'Mood Tracking', icon: Brain },
  reportDownloads: { label: 'Report Downloads', icon: FileText },
  directoryAccess: { label: 'Directory Access', icon: Search },
  aiInteractions: { label: 'AI Interactions', icon: Bot },
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const isAuthenticated = api.isAuthenticated();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.getSubscription();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const { data: pricingData } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const response = await api.getSubscriptionPricing();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !isAuthenticated,
  });

  const { data: usageData } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const response = await api.getUsage();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await api.startTrial();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      toast({
        title: 'Trial Started!',
        description: 'Your 7-day free trial has begun. Explore all features!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('coming soon') || error.message.includes('pending') || error.message.includes('Payment processing')) {
        toast({
          title: 'Payment Coming Soon',
          description: 'Online payments will be available soon. Please check back later!',
        });
      } else if (error.message.includes('contact')) {
        toast({
          title: 'Contact Us',
          description: 'Please contact us for Team and Franchise plans.',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
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
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading && isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subscription = data?.subscription;
  const stripeConfigured = data?.stripeConfigured ?? pricingData?.stripeConfigured ?? false;
  const isTrialEligible = isAuthenticated && subscription && subscription.plan === 'free' && subscription.status !== 'trial' && !subscription.trialEndsAt;
  const isOnTrial = subscription?.status === 'trial';
  const isPaid = subscription && subscription.plan !== 'free' && subscription.isActive;
  const canCancel = isAuthenticated && (isOnTrial || isPaid) && subscription?.status !== 'cancelled';
  const currentPlan = subscription?.plan || 'free';

  const planOrder: PlanKey[] = ['free', 'starter', 'pro', 'premium', 'team', 'franchise'];

  function getButtonLabel(planKey: PlanKey) {
    if (!isAuthenticated) return 'Sign Up';
    const detail = PLAN_DETAILS[planKey];
    if ((detail as any).contact) return 'Contact Us';
    if (currentPlan === planKey && subscription?.isActive) return 'Current Plan';
    if (!stripeConfigured && planKey !== 'free') return 'Coming Soon';
    if (planKey === 'free') return isTrialEligible ? 'Start Free Trial' : 'Free Plan';
    const currentIdx = planOrder.indexOf(currentPlan as PlanKey);
    const targetIdx = planOrder.indexOf(planKey);
    return targetIdx > currentIdx ? 'Upgrade' : 'Switch Plan';
  }

  function handlePlanClick(planKey: PlanKey) {
    if (!isAuthenticated) {
      navigate('/auth/register');
      return;
    }
    const detail = PLAN_DETAILS[planKey];
    if ((detail as any).contact) {
      toast({ title: 'Contact Us', description: 'Please reach out to discuss Team and Franchise plans.' });
      return;
    }
    if (planKey === 'free') {
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
    if (planKey === 'free' && !isTrialEligible) return true;
    if (upgradeMutation.isPending && upgradingPlan === planKey) return true;
    if (startTrialMutation.isPending && planKey === 'free') return true;
    return false;
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Subscription & Pricing</h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that works best for your wellbeing journey. Start free and upgrade as you grow.
        </p>
      </div>

      {!isAuthenticated && (
        <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 text-sm sm:text-base">Sign in to manage your subscription</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs sm:text-sm">
            <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm p-0 h-auto" onClick={() => navigate('/auth/login')}>
              Log in
            </Button>
            {' '}or{' '}
            <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm p-0 h-auto" onClick={() => navigate('/auth/register')}>
              create an account
            </Button>
            {' '}to start your free trial and access all features.
          </AlertDescription>
        </Alert>
      )}

      {isOnTrial && subscription?.trialDaysRemaining != null && subscription.trialDaysRemaining > 0 && (
        <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 text-sm sm:text-base">Trial Active</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs sm:text-sm">
            You have <span className="font-semibold">{subscription.trialDaysRemaining} days</span> remaining in your free trial.
            Upgrade now to keep all your features!
          </AlertDescription>
        </Alert>
      )}

      {subscription?.status === 'cancelled' && (
        <Alert className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 text-sm sm:text-base">Subscription Cancelled</AlertTitle>
          <AlertDescription className="text-yellow-700 text-xs sm:text-sm">
            Your subscription has been cancelled. You can start a new subscription anytime.
          </AlertDescription>
        </Alert>
      )}

      {!stripeConfigured && isAuthenticated && (
        <Alert className="mb-4 sm:mb-6 border-purple-200 bg-purple-50">
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          <AlertTitle className="text-purple-800 text-sm sm:text-base">Coming Soon</AlertTitle>
          <AlertDescription className="text-purple-700 text-xs sm:text-sm">
            Online payments are coming soon! Start your free trial now and enjoy the platform.
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated && subscription && (
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl flex-wrap">
                  Current Plan
                  <Badge variant={isPaid || isOnTrial ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                    {isOnTrial ? 'Trial' : PLAN_DETAILS[currentPlan as PlanKey]?.name || currentPlan}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Status: <span className="capitalize">{subscription.status}</span>
                </CardDescription>
              </div>
              {(isPaid || isOnTrial) && (
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          {canCancel && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                ) : null}
                Cancel Subscription
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {isAuthenticated && usageData && (
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(USAGE_LABELS).map(([key, { label, icon: Icon }]) => {
                const used = usageData.usage?.[key] || 0;
                const limit = usageData.limits?.[key];
                const isUnlimited = limit === -1;
                const percentage = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs sm:text-sm">{label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <Progress value={percentage} className="h-2" />
                    )}
                    {isUnlimited && (
                      <div className="h-2 bg-green-100 rounded-full">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {planOrder.map((planKey) => {
          const detail = PLAN_DETAILS[planKey];
          const IconComp = detail.icon;
          const isPopular = (detail as any).popular;
          const isContact = (detail as any).contact;
          const isCurrent = isAuthenticated && currentPlan === planKey && subscription?.isActive;

          return (
            <Card
              key={planKey}
              className={`relative flex flex-col ${isCurrent ? 'border-primary ring-2 ring-primary' : ''} ${isPopular ? 'border-purple-400 ring-1 ring-purple-200' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm">Most Popular</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-2 sm:-top-3 right-3 z-10">
                  <Badge className="bg-primary text-xs">Current</Badge>
                </div>
              )}
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {planKey !== 'free' && <IconComp className={`h-4 w-4 sm:h-5 sm:w-5 ${detail.color}`} />}
                  {detail.name}
                </CardTitle>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-bold">{detail.price}</span>
                  {detail.period && <span className="text-xs sm:text-sm text-muted-foreground">{detail.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="pb-3 sm:pb-4 flex-1">
                <ul className="space-y-2">
                  {detail.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-3 sm:pt-4">
                <Button
                  className="w-full text-xs sm:text-sm"
                  variant={isPopular ? 'default' : isCurrent ? 'secondary' : 'outline'}
                  onClick={() => handlePlanClick(planKey)}
                  disabled={isButtonDisabled(planKey)}
                >
                  {((upgradeMutation.isPending && upgradingPlan === planKey) || (startTrialMutation.isPending && planKey === 'free')) && (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                  )}
                  {isContact && <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                  {getButtonLabel(planKey)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">What's included in the free trial?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              The 7-day trial gives you limited access to core features including 2 activity logs, 2 mood insights, 1 report download, 2 directory accesses, and 2 AI interactions.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">Can I cancel anytime?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">What happens when my trial ends?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You'll be moved to the free plan unless you upgrade. Your data is always safe and accessible.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">How do usage limits work?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Each plan has monthly usage limits for features like activity logs, mood tracking, and AI interactions. Usage counters reset at the start of each month. Pro and above plans have unlimited access.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">How do I get a Team or Franchise plan?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Team and Franchise plans are customized to your organization's needs. Contact us to discuss pricing, features, and setup.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
