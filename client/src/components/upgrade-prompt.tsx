import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Lock } from "lucide-react";
import { useSubscriptionDialog } from "@/contexts/SubscriptionDialogContext";

const NEXT_PLAN: Record<string, { name: string; limits: Record<string, number> }> = {
  free: {
    name: "Starter",
    limits: { activityLogs: 10, moodLogs: 10, directoryAccess: 10, aiInteractions: 10 },
  },
  starter: {
    name: "Pro",
    limits: { activityLogs: -1, moodLogs: -1, directoryAccess: -1, aiInteractions: -1 },
  },
  pro: {
    name: "Premium",
    limits: { activityLogs: -1, moodLogs: -1, directoryAccess: -1, aiInteractions: -1 },
  },
};

const FEATURE_LABELS: Record<string, string> = {
  activityLogs: "activity logs",
  moodLogs: "mood logs",
  directoryAccess: "provider searches",
  aiInteractions: "AI interactions",
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  directoryAccess: "You've used up your provider directory searches for this period on the",
  activityLogs: "You've reached your activity log limit for today on the",
  moodLogs: "You've reached your mood log limit for today on the",
  aiInteractions: "You've used up your AI interactions for today on the",
};

interface UpgradePromptProps {
  feature: string;
  currentPlan?: string;
  limit?: number;
  featureLabel?: string;
  className?: string;
}

export function UpgradePrompt({ feature, currentPlan, limit, className }: UpgradePromptProps) {
  const { openSubscriptionDialog } = useSubscriptionDialog();
  const plan = (currentPlan || 'free').toLowerCase();
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const featureLabel = FEATURE_LABELS[feature] || feature;
  const next = NEXT_PLAN[plan];
  const nextLimit = next?.limits[feature];
  const nextLimitLabel = nextLimit === -1 ? "unlimited" : nextLimit != null ? `${nextLimit}` : null;
  const featureDescription = FEATURE_DESCRIPTIONS[feature];

  return (
    <Alert className={`border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-100 ${className || ''}`}>
      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-bold">
        {planName} Plan Limit Reached
      </AlertTitle>
      <AlertDescription className="space-y-2 mt-1">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          {featureDescription
            ? <>{featureDescription} <strong>{planName}</strong> plan.</>
            : <>You've reached your <strong>{planName}</strong> plan limit</>}
          {limit != null && limit > 0 && (
            <> The limit is <strong>{limit}</strong> {featureLabel}.</>
          )}
        </p>
        {next && nextLimitLabel && (
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            Upgrade to <strong>{next.name}</strong> to get {nextLimitLabel} {featureLabel} and more.
          </p>
        )}
        <Button
          size="sm"
          className="gap-1 mt-1 bg-amber-600 hover:bg-amber-700 text-white border-0"
          onClick={openSubscriptionDialog}
        >
          Upgrade Plan <ArrowRight className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
