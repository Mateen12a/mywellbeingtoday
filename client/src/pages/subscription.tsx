import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const { refreshUser, isAuthenticated: authReady } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isAuthenticated = api.isAuthenticated();
  const processed = useRef(false);
  const [state, setState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";
    const plan = params.get("plan");
    const sessionId = params.get("session_id");
    const isCancelled = params.get("cancelled") === "true";

    const cardAdded = params.get("card_added") === "true";
    const cardCancelled = params.get("card_cancelled") === "true";

    if (cardAdded) {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Card Saved!",
        description: "Your payment method has been saved. You can now upgrade plans instantly.",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    if (cardCancelled) {
      toast({
        title: "Card Setup Cancelled",
        description: "Card setup was cancelled. No changes were made.",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    if (isCancelled) {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No changes were made.",
      });
      navigate(isAuthenticated ? "/dashboard" : "/", { replace: true });
      return;
    }

    if (isSuccess && plan) {
      if (!isAuthenticated) {
        toast({
          title: "Please sign in",
          description: "Sign in to activate your new plan.",
        });
        navigate("/auth/login", { replace: true });
        return;
      }

      setState("processing");

      const applyUpgrade = async () => {
        let confirmed = false;

        try {
          const result = await api.confirmUpgrade(plan, sessionId || undefined);
          if (result.success) {
            confirmed = true;
          }
        } catch {
        }

        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["subscription-usage"] });

        try {
          const subResponse = await api.getSubscription();
          if (subResponse.success && subResponse.data?.subscription) {
            const activePlan = subResponse.data.subscription.plan;
            if (activePlan === plan) {
              confirmed = true;
            }
          }
        } catch {
        }

        if (confirmed) {
          const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
          setSuccessPlan(planLabel);
          setState("success");

          toast({
            title: "Payment Successful!",
            description: `Your plan has been upgraded to ${planLabel}.`,
          });

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 2000);
        } else {
          setState("error");
          setErrorMessage("We received your payment but couldn't verify the upgrade immediately. Your plan will be updated shortly.");

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 4000);
        }
      };

      applyUpgrade();
    } else {
      navigate(isAuthenticated ? "/dashboard" : "/", { replace: true });
    }
  }, []);

  if (state === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 p-6 max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Processing your payment...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we activate your plan.</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 p-6 max-w-md">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
          <p className="text-muted-foreground">
            Your plan has been upgraded to <span className="font-semibold text-foreground">{successPlan}</span>.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 p-6 max-w-md">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Almost There</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button onClick={() => navigate("/dashboard", { replace: true })}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
