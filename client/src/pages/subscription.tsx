import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Check, Clock, CreditCard, Crown, Sparkles, AlertCircle, Loader2, LogIn } from 'lucide-react';

export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const isAuthenticated = api.isAuthenticated();

  const { data, isLoading, error } = useQuery({
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

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await api.startTrial();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: 'Trial Started!',
        description: 'Your 15-day free trial has begun. Enjoy all premium features!',
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
    mutationFn: async (plan: 'monthly' | 'yearly') => {
      const response = await api.upgradeSubscription(plan);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('coming soon') || error.message.includes('pending')) {
        toast({
          title: 'Payment Coming Soon',
          description: 'Online payments will be available soon. Please check back later!',
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

  const defaultPricing = {
    monthly: { price: 19.99, interval: 'month', displayPrice: '$19.99/mo' },
    yearly: { price: 191.88, interval: 'year', monthlyEquivalent: 15.99, displayPrice: '$191.88/yr ($15.99/mo)' }
  };

  const pricing = data?.pricing || pricingData?.pricing || defaultPricing;
  const stripeConfigured = data?.stripeConfigured ?? pricingData?.stripeConfigured ?? false;
  const subscription = data?.subscription;
  const isTrialEligible = isAuthenticated && subscription && subscription.plan === 'free' && subscription.status !== 'trial' && !subscription.trialEndsAt;
  const isOnTrial = subscription?.status === 'trial';
  const isPremium = subscription?.plan !== 'free' && subscription?.isActive;
  const canCancel = isAuthenticated && (isOnTrial || isPremium) && subscription?.status !== 'cancelled';

  const features = [
    'Unlimited mood tracking',
    'Advanced AI wellness insights',
    'Priority provider matching',
    'Detailed analytics & reports',
    'Export your data anytime',
    'Priority support',
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
      <div className="text-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Subscription & Pricing</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Choose the plan that works best for your wellbeing journey</p>
      </div>

      {!isAuthenticated && (
        <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 text-sm sm:text-base">Sign in to manage your subscription</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs sm:text-sm">
            <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm" onClick={() => navigate('/auth/login')}>
              Log in
            </Button>
            {' '}or{' '}
            <Button variant="link" className="text-blue-700 underline text-xs sm:text-sm" onClick={() => navigate('/auth/register')}>
              create an account
            </Button>
            {' '}to start your free trial and access premium features.
          </AlertDescription>
        </Alert>
      )}

      {isOnTrial && subscription?.trialDaysRemaining && subscription.trialDaysRemaining > 0 && (
        <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 text-sm sm:text-base">Trial Active</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs sm:text-sm">
            You have <span className="font-semibold">{subscription.trialDaysRemaining} days</span> remaining in your free trial.
            Upgrade now to keep all your premium features!
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
            Online payments are coming soon! Start your free trial now and enjoy premium features.
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated && subscription && (
        <Card className="mb-4 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl flex-wrap">
                  Current Plan
                  <Badge variant={isPremium || isOnTrial ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                    {subscription.plan === 'free' ? (isOnTrial ? 'Trial' : 'Free') : subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Status: <span className="capitalize">{subscription.status}</span>
                </CardDescription>
              </div>
              {(isPremium || isOnTrial) && (
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

      {isTrialEligible && (
        <Card className="mb-4 sm:mb-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              Start Your Free Trial
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base">
              Try all premium features free for 15 days. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-4 sm:pb-6">
            <Button
              size="lg"
              onClick={() => startTrialMutation.mutate()}
              disabled={startTrialMutation.isPending}
              className="text-xs sm:text-sm md:text-base"
            >
              {startTrialMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Start 15-Day Free Trial
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <Card className={`relative ${selectedPlan === 'monthly' ? 'border-primary ring-2 ring-primary' : ''}`}>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Monthly
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Flexible month-to-month billing</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">${pricing.monthly.price}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-3 sm:pt-4">
            <Button
              className="w-full text-xs sm:text-sm"
              variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth/register');
                  return;
                }
                setSelectedPlan('monthly');
                upgradeMutation.mutate('monthly');
              }}
              disabled={upgradeMutation.isPending || (isPremium && subscription?.plan === 'monthly')}
            >
              {upgradeMutation.isPending && selectedPlan === 'monthly' ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
              ) : null}
              {!isAuthenticated ? 'Sign Up' : !stripeConfigured ? 'Coming Soon' : isPremium && subscription?.plan === 'monthly' ? 'Current Plan' : 'Choose Monthly'}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`relative ${selectedPlan === 'yearly' ? 'border-primary ring-2 ring-primary' : ''}`}>
          <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm">Save 20%</Badge>
          </div>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              Yearly
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Best value - save 2 months!</CardDescription>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <div className="mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">${pricing.yearly.price}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">/year</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              That's only ${pricing.yearly.monthlyEquivalent}/month
            </p>
            <ul className="space-y-2 sm:space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-3 sm:pt-4">
            <Button
              className="w-full text-xs sm:text-sm"
              variant={selectedPlan === 'yearly' ? 'default' : 'outline'}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth/register');
                  return;
                }
                setSelectedPlan('yearly');
                upgradeMutation.mutate('yearly');
              }}
              disabled={upgradeMutation.isPending || (isPremium && subscription?.plan === 'yearly')}
            >
              {upgradeMutation.isPending && selectedPlan === 'yearly' ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
              ) : null}
              {!isAuthenticated ? 'Sign Up' : !stripeConfigured ? 'Coming Soon' : isPremium && subscription?.plan === 'yearly' ? 'Current Plan' : 'Choose Yearly'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-medium mb-1 text-sm sm:text-base">What's included in the free trial?</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              The 15-day trial gives you full access to all premium features. No credit card required to start.
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
        </CardContent>
      </Card>
    </div>
  );
}
