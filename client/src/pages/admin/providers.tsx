import { useState, useMemo } from "react";
import { formatLabel } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, Loader2, Bot, AlertTriangle, FileWarning, Eye, Ban, XCircle, CheckCircle, Mail, MapPin, Calendar, Briefcase, User, Filter, FileText, Clock, Globe, Languages, Award, ShieldCheck, ShieldOff, RotateCcw, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

type RiskLevel = "high" | "warning" | "info" | "none";

interface RiskIndicator {
  label: string;
  level: RiskLevel;
  description: string;
}

function analyzeProviderRisk(provider: any): RiskIndicator[] {
  const indicators: RiskIndicator[] = [];
  const now = new Date();
  
  const documents = provider.documents || [];
  const hasLicense = documents.some((d: any) => d.type === "license" || d.name?.toLowerCase().includes("license"));
  const hasInsurance = documents.some((d: any) => d.type === "insurance" || d.name?.toLowerCase().includes("insurance"));
  const hasCertification = documents.some((d: any) => d.type === "certification" || d.name?.toLowerCase().includes("certif"));
  
  if (documents.length === 0) {
    indicators.push({
      label: "Missing Documents",
      level: "high",
      description: "No documents uploaded for verification"
    });
  } else if (!hasLicense && !hasCertification) {
    indicators.push({
      label: "Missing Documents",
      level: "warning",
      description: "Missing license or certification documents"
    });
  }
  
  const hasSpecialties = provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0;
  const hasQualifications = provider.professionalInfo?.qualifications && provider.professionalInfo.qualifications.length > 0;
  const hasTitle = provider.professionalInfo?.title && provider.professionalInfo.title.trim() !== "";
  const hasBio = provider.professionalInfo?.bio && provider.professionalInfo.bio.trim() !== "";
  
  if (!hasSpecialties || !hasTitle) {
    indicators.push({
      label: "Incomplete Info",
      level: "warning",
      description: "Missing professional specialties or title"
    });
  } else if (!hasBio || !hasQualifications) {
    indicators.push({
      label: "Incomplete Info",
      level: "info",
      description: "Profile could benefit from more details"
    });
  }
  
  const createdAt = new Date(provider.createdAt);
  const registrationTimeMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const isVerified = provider.verification?.isVerified || false;
  
  if (isVerified && registrationTimeMinutes < 60) {
    indicators.push({
      label: "Fast Registration",
      level: "high",
      description: "Account verified unusually quickly - review recommended"
    });
  }
  
  const lastActivity = provider.lastActiveAt || provider.updatedAt || provider.createdAt;
  if (lastActivity) {
    const lastActivityDate = new Date(lastActivity);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity >= 60) {
      indicators.push({
        label: "Inactive",
        level: "warning",
        description: `No activity in ${daysSinceActivity} days`
      });
    }
  }
  
  if (!isVerified) {
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation > 7) {
      indicators.push({
        label: "Needs Review",
        level: "warning",
        description: `Pending verification for ${daysSinceCreation} days`
      });
    }
  }
  
  return indicators;
}

function getRiskBadgeStyles(level: RiskLevel): string {
  switch (level) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "info":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";
    default:
      return "";
  }
}

export default function AdminProvidersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [providerSearch, setProviderSearch] = useState("");
  const [providerPage, setProviderPage] = useState(1);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [viewProfileDialog, setViewProfileDialog] = useState<{
    open: boolean;
    provider: any | null;
  }>({
    open: false,
    provider: null,
  });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'reject' | 'suspend' | 'unverify' | null;
    provider: any | null;
  }>({
    open: false,
    type: null,
    provider: null,
  });
  const [actionReason, setActionReason] = useState("");

  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ["admin", "providers", providerPage, providerSearch, providerFilter],
    queryFn: async () => {
      const params: any = {
        page: providerPage,
        limit: 20,
        search: providerSearch || undefined,
      };
      if (providerFilter === "verified") params.verified = "true";
      if (providerFilter === "pending") params.verified = "false";
      const response = await api.getAdminProviders(params);
      return response.data;
    },
  });

  const filteredProviders = useMemo(() => {
    if (!providersData?.providers) return [];
    
    if (riskFilter === "all") return providersData.providers;
    
    return providersData.providers.filter((provider: any) => {
      const risks = analyzeProviderRisk(provider);
      if (riskFilter === "flagged") return risks.length > 0;
      if (riskFilter === "high") return risks.some(r => r.level === "high");
      if (riskFilter === "warning") return risks.some(r => r.level === "warning");
      return true;
    });
  }, [providersData?.providers, riskFilter]);

  const flaggedCount = useMemo(() => {
    if (!providersData?.providers) return 0;
    return providersData.providers.filter((provider: any) => analyzeProviderRisk(provider).length > 0).length;
  }, [providersData?.providers]);

  const verifyProviderMutation = useMutation({
    mutationFn: (providerId: string) => api.verifyProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setViewProfileDialog({ open: false, provider: null });
      toast({
        title: "Provider Verified",
        description: "The provider has been verified successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify provider",
        variant: "destructive",
      });
    },
  });

  const rejectProviderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectProvider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setActionDialog({ open: false, type: null, provider: null });
      setViewProfileDialog({ open: false, provider: null });
      setActionReason("");
      toast({
        title: "Provider Rejected",
        description: "The provider application has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject provider",
        variant: "destructive",
      });
    },
  });

  const suspendProviderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.suspendProvider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setActionDialog({ open: false, type: null, provider: null });
      setViewProfileDialog({ open: false, provider: null });
      setActionReason("");
      toast({
        title: "Provider Suspended",
        description: "The provider has been suspended.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend provider",
        variant: "destructive",
      });
    },
  });

  const unsuspendProviderMutation = useMutation({
    mutationFn: (id: string) => api.unsuspendProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setViewProfileDialog({ open: false, provider: null });
      toast({
        title: "Provider Unsuspended",
        description: "The provider has been reactivated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unsuspend provider",
        variant: "destructive",
      });
    },
  });

  const unverifyProviderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.unverifyProvider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setActionDialog({ open: false, type: null, provider: null });
      setViewProfileDialog({ open: false, provider: null });
      setActionReason("");
      toast({
        title: "Verification Revoked",
        description: "The provider's verification has been revoked.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke verification",
        variant: "destructive",
      });
    },
  });

  const handleActionSubmit = () => {
    if (!actionDialog.provider || !actionDialog.type) return;
    
    const id = actionDialog.provider._id;
    switch (actionDialog.type) {
      case 'reject':
        rejectProviderMutation.mutate({ id, reason: actionReason });
        break;
      case 'suspend':
        suspendProviderMutation.mutate({ id, reason: actionReason });
        break;
      case 'unverify':
        unverifyProviderMutation.mutate({ id, reason: actionReason });
        break;
    }
  };

  const getActionDialogTitle = () => {
    switch (actionDialog.type) {
      case 'reject': return 'Reject Provider';
      case 'suspend': return 'Suspend Provider';
      case 'unverify': return 'Revoke Verification';
      default: return '';
    }
  };

  const getActionDialogDescription = () => {
    const name = actionDialog.provider?.practice?.name || 
      `${actionDialog.provider?.userId?.profile?.firstName || ''} ${actionDialog.provider?.userId?.profile?.lastName || ''}`.trim() || 
      'this provider';
    switch (actionDialog.type) {
      case 'reject': return `You are about to reject the application for ${name}. Please provide a reason.`;
      case 'suspend': return `You are about to suspend ${name}. They will not be able to access their account. Please provide a reason.`;
      case 'unverify': return `You are about to revoke the verification for ${name}. They will need to be re-verified. Please provide a reason.`;
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout title="Provider Management">
      <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Provider Management</CardTitle>
              <CardDescription>Manage and verify healthcare providers.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search providers..."
                  className="pl-9 bg-background border-border/60"
                  value={providerSearch}
                  onChange={(e) => {
                    setProviderSearch(e.target.value);
                    setProviderPage(1);
                  }}
                  data-testid="input-provider-search"
                />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-risk-filter">
                  <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="flagged">
                    Flagged ({flaggedCount})
                  </SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {providersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Provider</th>
                    <th className="px-6 py-4 font-semibold">Specialty</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5" />
                        <span>AI Review</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No providers found
                      </td>
                    </tr>
                  ) : (
                    filteredProviders.map((provider: any) => {
                      const providerName = provider.practice?.name || provider.professionalInfo?.title || "Unnamed Provider";
                      const specialty = formatLabel(provider.professionalInfo?.specialties?.[0]) || "General";
                      const city = provider.practice?.address?.city || provider.practice?.city || "Unknown";
                      const isVerified = provider.verification?.isVerified || false;
                      const riskIndicators = analyzeProviderRisk(provider);
                      const hasHighRisk = riskIndicators.some(r => r.level === "high");
                      
                      return (
                        <tr 
                          key={provider._id} 
                          className={`hover:bg-muted/20 transition-colors ${hasHighRisk ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                          data-testid={`row-provider-${provider._id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border/50">
                                <AvatarFallback className="text-xs font-medium">
                                  {providerName[0] || "P"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {providerName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {provider.userId?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{specialty}</Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {city}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={isVerified ? "default" : "secondary"}
                              className={
                                isVerified
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }
                            >
                              {isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                              {riskIndicators.length === 0 ? (
                                <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                                  <Bot className="h-3 w-3" />
                                  No issues
                                </span>
                              ) : (
                                riskIndicators.map((indicator, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs cursor-help ${getRiskBadgeStyles(indicator.level)}`}
                                        data-testid={`badge-risk-${indicator.label.toLowerCase().replace(/\s+/g, '-')}-${provider._id}`}
                                      >
                                        {indicator.level === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                        {indicator.label === "Missing Documents" && indicator.level !== "high" && <FileWarning className="h-3 w-3 mr-1" />}
                                        {indicator.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[200px]">
                                      <p className="text-xs">{indicator.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setViewProfileDialog({ open: true, provider })}
                                    data-testid={`button-view-provider-${provider._id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Profile</TooltipContent>
                              </Tooltip>
                              {!isVerified && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => verifyProviderMutation.mutate(provider._id)}
                                        disabled={verifyProviderMutation.isPending}
                                        data-testid={`button-verify-${provider._id}`}
                                      >
                                        {verifyProviderMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          toast({
                                            title: "Provider Rejected",
                                            description: "The provider application has been rejected.",
                                          });
                                        }}
                                        data-testid={`button-reject-${provider._id}`}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reject</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                      toast({
                                        title: "Provider Suspended",
                                        description: "The provider has been suspended.",
                                      });
                                    }}
                                    data-testid={`button-suspend-provider-${provider._id}`}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Suspend</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {providersData?.pagination && providersData.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
            <span className="text-sm text-muted-foreground">
              Page {providersData.pagination.page} of {providersData.pagination.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={providerPage <= 1}
                onClick={() => setProviderPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={providerPage >= providersData.pagination.pages}
                onClick={() => setProviderPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Profile Dialog */}
      <Dialog
        open={viewProfileDialog.open}
        onOpenChange={(open) => !open && setViewProfileDialog({ open: false, provider: null })}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Provider Profile
            </DialogTitle>
            <DialogDescription>
              Complete profile details for {viewProfileDialog.provider?.userId?.profile?.firstName} {viewProfileDialog.provider?.userId?.profile?.lastName}
            </DialogDescription>
          </DialogHeader>
          {viewProfileDialog.provider && (() => {
            const provider = viewProfileDialog.provider;
            const isVerified = provider.verification?.isVerified || false;
            const isActive = provider.isActive !== false;
            const documents = provider.verification?.documents || [];
            
            return (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-5">
                  {/* Header with avatar and status */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                        {(provider.userId?.profile?.firstName?.[0] || '') + (provider.userId?.profile?.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {provider.professionalInfo?.title || ''} {provider.userId?.profile?.firstName} {provider.userId?.profile?.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant={isVerified ? "default" : "secondary"} className={isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                          {isVerified ? "Verified" : "Pending Verification"}
                        </Badge>
                        {!isActive && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                        {provider.verification?.status === 'rejected' && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{provider.userId?.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{provider.practice?.phone || provider.userId?.profile?.phone || 'Not provided'}</span>
                      </div>
                      {provider.practice?.website && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Website:</span>
                          <a href={provider.practice.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                            {provider.practice.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Practice Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Practice Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Practice Name:</span>
                        <span className="font-medium">{provider.practice?.name || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Practice Email:</span>
                        <span className="font-medium">{provider.practice?.email || 'Not provided'}</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-medium">
                            {[
                              provider.practice?.address?.street,
                              provider.practice?.address?.city,
                              provider.practice?.address?.postcode,
                              provider.practice?.address?.country
                            ].filter(Boolean).join(', ') || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Professional Information */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Professional Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="font-medium">{provider.professionalInfo?.title || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Experience:</span>
                          <span className="font-medium">{provider.professionalInfo?.yearsOfExperience ? `${provider.professionalInfo.yearsOfExperience} years` : 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Registration No:</span>
                          <span className="font-medium">{provider.professionalInfo?.registrationNumber || 'Not provided'}</span>
                        </div>
                      </div>
                      
                      {provider.professionalInfo?.specialties?.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Specialties:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.professionalInfo.specialties.map((spec: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{formatLabel(spec)}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {provider.professionalInfo?.qualifications?.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Qualifications:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.professionalInfo.qualifications.map((qual: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{qual}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {provider.professionalInfo?.languages?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Languages className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">Languages:</span>
                          <span className="font-medium">{provider.professionalInfo.languages.join(', ')}</span>
                        </div>
                      )}
                      
                      {provider.professionalInfo?.bio && (
                        <div>
                          <span className="text-muted-foreground">Bio:</span>
                          <p className="mt-1 text-sm bg-muted/30 p-2 rounded">{provider.professionalInfo.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Documents */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Uploaded Documents
                    </h4>
                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{doc.name || formatLabel(doc.type) || 'Document'}</span>
                              {doc.type && <Badge variant="outline" className="text-xs">{formatLabel(doc.type)}</Badge>}
                            </div>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                                View <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {doc.uploadedAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(doc.uploadedAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Verification Status */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Verification Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={isVerified ? "default" : "secondary"} className={isVerified ? "bg-emerald-100 text-emerald-700" : ""}>
                          {formatLabel(provider.verification?.status || 'pending')}
                        </Badge>
                      </div>
                      {provider.verification?.verifiedAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Verified:</span>
                          <span className="font-medium">{formatDate(provider.verification.verifiedAt)}</span>
                        </div>
                      )}
                      {provider.verification?.rejectionReason && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Rejection Reason:</span>
                          <p className="mt-1 text-sm bg-red-50 text-red-700 p-2 rounded">{provider.verification.rejectionReason}</p>
                        </div>
                      )}
                      {provider.verification?.suspensionReason && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Suspension Reason:</span>
                          <p className="mt-1 text-sm bg-amber-50 text-amber-700 p-2 rounded">{provider.verification.suspensionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Account Dates */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Account Timeline
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Registered:</span>
                        <span className="font-medium">{formatDate(provider.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span className="font-medium">{formatDate(provider.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Risk Assessment */}
                  {analyzeProviderRisk(provider).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          AI Risk Assessment
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analyzeProviderRisk(provider).map((risk, idx) => (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className={`cursor-help ${getRiskBadgeStyles(risk.level)}`}>
                                  {risk.level === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {risk.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-[200px]">{risk.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            );
          })()}
          
          {/* Action Buttons */}
          {viewProfileDialog.provider && (
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
              <div className="flex flex-wrap gap-2 flex-1">
                {/* Verify button - show if not verified */}
                {!viewProfileDialog.provider.verification?.isVerified && viewProfileDialog.provider.isActive !== false && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => verifyProviderMutation.mutate(viewProfileDialog.provider._id)}
                    disabled={verifyProviderMutation.isPending}
                  >
                    {verifyProviderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Verify
                  </Button>
                )}
                
                {/* Reject button - show if not verified and not rejected */}
                {!viewProfileDialog.provider.verification?.isVerified && viewProfileDialog.provider.verification?.status !== 'rejected' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionDialog({ open: true, type: 'reject', provider: viewProfileDialog.provider });
                      setActionReason("");
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
                
                {/* Unverify button - show if verified */}
                {viewProfileDialog.provider.verification?.isVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={() => {
                      setActionDialog({ open: true, type: 'unverify', provider: viewProfileDialog.provider });
                      setActionReason("");
                    }}
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Revoke Verification
                  </Button>
                )}
                
                {/* Suspend button - show if active */}
                {viewProfileDialog.provider.isActive !== false && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setActionDialog({ open: true, type: 'suspend', provider: viewProfileDialog.provider });
                      setActionReason("");
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                )}
                
                {/* Unsuspend button - show if suspended */}
                {viewProfileDialog.provider.isActive === false && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => unsuspendProviderMutation.mutate(viewProfileDialog.provider._id)}
                    disabled={unsuspendProviderMutation.isPending}
                  >
                    {unsuspendProviderMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Unsuspend
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setViewProfileDialog({ open: false, provider: null })}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Reason Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, type: null, provider: null });
            setActionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.type === 'reject' && <XCircle className="h-5 w-5 text-red-500" />}
              {actionDialog.type === 'suspend' && <Ban className="h-5 w-5 text-amber-500" />}
              {actionDialog.type === 'unverify' && <ShieldOff className="h-5 w-5 text-amber-500" />}
              {getActionDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {getActionDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-reason">Reason</Label>
              <Textarea
                id="action-reason"
                placeholder="Please provide a reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, type: null, provider: null });
                setActionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === 'reject' ? 'destructive' : 'default'}
              onClick={handleActionSubmit}
              disabled={!actionReason.trim() || rejectProviderMutation.isPending || suspendProviderMutation.isPending || unverifyProviderMutation.isPending}
            >
              {(rejectProviderMutation.isPending || suspendProviderMutation.isPending || unverifyProviderMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
