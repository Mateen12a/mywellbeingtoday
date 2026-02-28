import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const NEXT_PLAN: Record<string, { name: string; limits: Record<string, number> }> = {
  free: {
    name: "Starter",
    limits: { activityLogs: 10, moodLogs: 10, reportDownloads: 3, directoryAccess: 10, aiInteractions: 10 },
  },
  starter: {
    name: "Pro",
    limits: { activityLogs: -1, moodLogs: -1, reportDownloads: -1, directoryAccess: -1, aiInteractions: -1 },
  },
  pro: {
    name: "Premium",
    limits: { activityLogs: -1, moodLogs: -1, reportDownloads: -1, directoryAccess: -1, aiInteractions: -1 },
  },
};

const FEATURE_LABELS: Record<string, string> = {
  activityLogs: "activity logs",
  moodLogs: "mood logs",
  reportDownloads: "report downloads",
  directoryAccess: "directory searches",
  aiInteractions: "AI interactions",
};

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  limit: number;
  className?: string;
}

export function UpgradePrompt({ feature, currentPlan, limit, className }: UpgradePromptProps) {
  const featureLabel = FEATURE_LABELS[feature] || feature;
  const next = NEXT_PLAN[currentPlan];
  const nextLimit = next?.limits[feature];
  const nextLimitLabel = nextLimit === -1 ? "unlimited" : `${nextLimit}`;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Limit Reached</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          You've reached your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan limit of{" "}
          <strong>{limit}</strong> {featureLabel} this month.
        </p>
        {next && (
          <p className="text-sm">
            Upgrade to <strong>{next.name}</strong> for {nextLimitLabel} {featureLabel} per month.
          </p>
        )}
        <Link href="/subscription">
          <Button size="sm" className="gap-1 mt-1">
            Upgrade Plan <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
