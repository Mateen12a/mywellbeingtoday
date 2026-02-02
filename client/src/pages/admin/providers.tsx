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
import { Search, Loader2, Bot, AlertTriangle, FileWarning, Eye, Ban, XCircle, CheckCircle, Mail, Phone, MapPin, Calendar, Briefcase, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Provider Profile
            </DialogTitle>
            <DialogDescription>
              Viewing profile details for {viewProfileDialog.provider?.userId?.profile?.firstName} {viewProfileDialog.provider?.userId?.profile?.lastName}
            </DialogDescription>
          </DialogHeader>
          {viewProfileDialog.provider && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                    {(viewProfileDialog.provider.userId?.profile?.firstName?.[0] || '') + (viewProfileDialog.provider.userId?.profile?.lastName?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {viewProfileDialog.provider.professionalInfo?.title || ''} {viewProfileDialog.provider.userId?.profile?.firstName} {viewProfileDialog.provider.userId?.profile?.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={viewProfileDialog.provider.isVerified ? "default" : "secondary"}>
                      {viewProfileDialog.provider.isVerified ? "Verified" : "Pending Verification"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{viewProfileDialog.provider.userId?.email}</span>
                </div>
                
                {viewProfileDialog.provider.practice?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{viewProfileDialog.provider.practice.phone}</span>
                  </div>
                )}
                
                {viewProfileDialog.provider.practice?.name && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Practice:</span>
                    <span className="font-medium">{viewProfileDialog.provider.practice.name}</span>
                  </div>
                )}
                
                {(viewProfileDialog.provider.practice?.city || viewProfileDialog.provider.practice?.address?.city) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">
                      {viewProfileDialog.provider.practice?.address?.city || viewProfileDialog.provider.practice?.city}
                    </span>
                  </div>
                )}
                
                {viewProfileDialog.provider.professionalInfo?.specialties?.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">Specialties:</span>
                    <div className="flex flex-wrap gap-1">
                      {viewProfileDialog.provider.professionalInfo.specialties.map((spec: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{formatLabel(spec)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="font-medium">
                    {new Date(viewProfileDialog.provider.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {analyzeProviderRisk(viewProfileDialog.provider).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Risk Assessment
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analyzeProviderRisk(viewProfileDialog.provider).map((risk, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={getRiskBadgeStyles(risk.level)}
                        >
                          {risk.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewProfileDialog({ open: false, provider: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
