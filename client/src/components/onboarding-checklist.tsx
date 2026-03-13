import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionDialog } from "@/contexts/SubscriptionDialogContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CircleCheckBig,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  User,
  CreditCard,
  Activity,
  Heart,
} from "lucide-react";

const STORAGE_KEY_PREFIX = "onboarding_dismissed";

export function OnboardingChecklist() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { openSubscriptionDialog, isOpen: subDialogOpen } = useSubscriptionDialog();
  const storageKey = user?._id ? `${STORAGE_KEY_PREFIX}_${user._id}` : STORAGE_KEY_PREFIX;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')._id : null;
    const key = userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
    return localStorage.getItem(key) === "true";
  });
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exploredPlans, setExploredPlans] = useState(() => localStorage.getItem("explored_plans") === "true");

  useEffect(() => {
    if (localStorage.getItem("explored_plans") === "true") {
      setExploredPlans(true);
    }
  }, [subDialogOpen]);

  const { data: activitiesData } = useQuery({
    queryKey: ["onboarding-activities", user?._id],
    queryFn: async () => {
      const response = await api.getActivities({ limit: 1 });
      return response.data;
    },
    enabled: !!user && !dismissed,
    staleTime: 30000,
  });

  const { data: moodsData } = useQuery({
    queryKey: ["onboarding-moods", user?._id],
    queryFn: async () => {
      const response = await api.getMoods({ limit: 1 });
      return response.data;
    },
    enabled: !!user && !dismissed,
    staleTime: 30000,
  });

  const profileComplete =
    !!user?.profile?.firstName &&
    !!user?.profile?.lastName &&
    !!user?.profile?.avatarUrl;
  const hasActivities = (activitiesData?.activities?.length || 0) > 0;
  const hasMoods = (moodsData?.moodLogs?.length || 0) > 0;

  const items = [
    {
      id: "profile",
      label: "Complete your profile",
      icon: User,
      done: profileComplete,
      action: () => navigate("/settings"),
    },
    {
      id: "plans",
      label: "Explore subscription plans",
      icon: CreditCard,
      done: exploredPlans,
      action: () => openSubscriptionDialog(),
    },
    {
      id: "activity",
      label: "Log your first activity",
      icon: Activity,
      done: hasActivities,
      action: () => navigate("/activity"),
    },
    {
      id: "mood",
      label: "Check your mood",
      icon: Heart,
      done: hasMoods,
      action: () => navigate("/mood"),
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allComplete = completedCount === items.length;

  useEffect(() => {
    if (!dismissed && user) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [dismissed, user]);

  useEffect(() => {
    if (allComplete && !dismissed) {
      const timer = setTimeout(() => handleDismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, dismissed]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      localStorage.setItem(storageKey, "true");
    }, 300);
  }

  if (dismissed || !user || user.role !== "user") return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ maxWidth: "calc(100vw - 32px)", width: "320px" }}
    >
      <Card className="shadow-lg border-border/80 bg-card">
        <CardHeader className="pb-0 pt-3 px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold truncate">
              Getting Started
            </CardTitle>
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium mr-1">
                {completedCount}/{items.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setMinimized(!minimized)}
              >
                {minimized ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        {!minimized && (
          <CardContent className="pt-2 pb-3 px-3 sm:px-4">
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={item.done ? undefined : item.action}
                      disabled={item.done}
                      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs sm:text-sm transition-colors ${
                        item.done
                          ? "text-muted-foreground cursor-default"
                          : "hover:bg-muted/60 cursor-pointer text-foreground"
                      }`}
                    >
                      {item.done ? (
                        <CircleCheckBig className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className={`truncate ${item.done ? "line-through" : ""}`}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {allComplete && (
              <p className="text-xs text-green-600 font-medium mt-2 text-center">
                All done! You're all set.
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
