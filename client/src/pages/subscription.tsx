import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSubscriptionDialog } from "@/contexts/SubscriptionDialogContext";
import { api } from "@/lib/api";

export default function SubscriptionPage() {
  const { openSubscriptionDialog } = useSubscriptionDialog();
  const [, navigate] = useLocation();
  const isAuthenticated = api.isAuthenticated();

  useEffect(() => {
    openSubscriptionDialog();
    const target = isAuthenticated ? "/dashboard" : "/";
    navigate(target, { replace: true });
  }, []);

  return null;
}
