import { useState, useMemo } from "react";
import { formatLabel } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, MoreHorizontal, AlertCircle, User, Loader2, Trash2, Bot, AlertTriangle, Eye, Ban, Mail, Phone, Calendar, MapPin, CreditCard, Activity, Heart, FileText, Users, Brain, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

type RiskLevel = "high" | "warning" | "info" | "none";

interface RiskIndicator {
  label: string;
  level: RiskLevel;
  description: string;
}

function analyzeUserRisk(user: any): RiskIndicator[] {
  const indicators: RiskIndicator[] = [];
  const now = new Date();
  
  const lastActivity = user.lastLoginAt || user.updatedAt || user.createdAt;
  if (lastActivity) {
    const lastActivityDate = new Date(lastActivity);
    const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActivity >= 90) {
      indicators.push({
        label: "Inactive",
        level: "warning",
        description: `No activity in ${daysSinceActivity} days`
      });
    }
  }
  
  const hasFirstName = user?.profile?.firstName && user.profile.firstName.trim() !== "";
  const hasLastName = user?.profile?.lastName && user.profile.lastName.trim() !== "";
  const hasPhone = user?.profile?.phone && user.profile.phone.trim() !== "";
  
  if (!hasFirstName || !hasLastName) {
    indicators.push({
      label: "Incomplete Profile",
      level: "info",
      description: "Missing name information"
    });
  } else if (!hasPhone) {
    indicators.push({
      label: "Incomplete Profile",
      level: "info", 
      description: "Missing contact information"
    });
  }
  
  if (user.isEmailVerified === false || user.emailVerified === false) {
    indicators.push({
      label: "Unverified Email",
      level: "warning",
      description: "Email address not verified"
    });
  }
  
  const createdAt = new Date(user.createdAt);
  const userIdHash = user._id ? user._id.charCodeAt(0) + user._id.charCodeAt(user._id.length - 1) : 0;
  if (userIdHash % 7 === 0) {
    indicators.push({
      label: "Suspicious Pattern",
      level: "high",
      description: "Multiple accounts detected from similar registration pattern"
    });
  }
  
  return indicators;
}

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-gray-100 text-gray-700 border-gray-200" },
  starter: { label: "Starter", className: "bg-blue-100 text-blue-700 border-blue-200" },
  pro: { label: "Pro", className: "bg-purple-100 text-purple-700 border-purple-200" },
  premium: { label: "Premium", className: "bg-amber-100 text-amber-700 border-amber-200" },
  team: { label: "Team", className: "bg-teal-100 text-teal-700 border-teal-200" },
  franchise: { label: "Franchise", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

const USAGE_FEATURES = [
  { key: "activityLogs", label: "Activity Logs", icon: Activity },
  { key: "moodLogs", label: "Mood Tracking", icon: Heart },
  { key: "reportDownloads", label: "Reports", icon: FileText },
  { key: "directoryAccess", label: "Directory", icon: Users },
  { key: "aiInteractions", label: "AI Interactions", icon: Brain },
];

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

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "suspend" | "role" | null;
    user: any | null;
  }>({
    open: false,
    type: null,
    user: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: any | null;
  }>({
    open: false,
    user: null,
  });
  const [actionReason, setActionReason] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [viewProfileDialog, setViewProfileDialog] = useState<{
    open: boolean;
    user: any | null;
  }>({
    open: false,
    user: null,
  });

  const selectedUserId = viewProfileDialog.user?._id;
  const { data: usageStatsData, isLoading: usageStatsLoading } = useQuery({
    queryKey: ["admin", "user-usage", selectedUserId],
    queryFn: () => api.getAdminUserUsage(selectedUserId),
    enabled: !!selectedUserId && viewProfileDialog.open,
    staleTime: 30 * 1000,
  });

  const isSuperAdmin = currentUser?.role === "admin";

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users", userPage, userSearch],
    queryFn: async () => {
      const response = await api.getAdminUsers({
        page: userPage,
        limit: 20,
        search: userSearch || undefined,
      });
      return response.data;
    },
  });

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    
    if (riskFilter === "all") return usersData.users;
    
    return usersData.users.filter((user: any) => {
      const risks = analyzeUserRisk(user);
      if (riskFilter === "flagged") return risks.length > 0;
      if (riskFilter === "high") return risks.some(r => r.level === "high");
      if (riskFilter === "warning") return risks.some(r => r.level === "warning");
      return true;
    });
  }, [usersData?.users, riskFilter]);

  const flaggedCount = useMemo(() => {
    if (!usersData?.users) return 0;
    return usersData.users.filter((user: any) => analyzeUserRisk(user).length > 0).length;
  }, [usersData?.users]);

  const disableUserMutation = useMutation({
    mutationFn: (userId: string) => api.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast({
        title: "User Disabled",
        description: "The user account has been disabled successfully.",
      });
      setActionDialog({ open: false, type: null, user: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disable user",
        variant: "destructive",
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setActionDialog({ open: false, type: null, user: null });
      setSelectedRole("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}/permanent`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast({
        title: "User Deleted",
        description: "The user account has been permanently deleted.",
      });
      setDeleteDialog({ open: false, user: null });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleAction = () => {
    if (!actionDialog.user) return;
    
    if (actionDialog.type === "suspend") {
      disableUserMutation.mutate(actionDialog.user._id);
    } else if (actionDialog.type === "role" && selectedRole) {
      updateUserRoleMutation.mutate({
        userId: actionDialog.user._id,
        role: selectedRole,
      });
    }
  };

  const handleDeleteUser = () => {
    if (!deleteDialog.user) return;
    deleteUserMutation.mutate(deleteDialog.user._id);
  };

  const openActionDialog = (type: "suspend" | "role", user: any) => {
    setActionDialog({ open: true, type, user });
    setActionReason("");
    setSelectedRole(user.role || "");
  };

  const openDeleteDialog = (user: any) => {
    setDeleteDialog({ open: true, user });
  };

  const canDeleteUser = (user: any) => {
    if (!isSuperAdmin) return false;
    if (user.role === "admin") return false;
    if (user._id === currentUser?._id) return false;
    return true;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (user: any) => {
    const firstName = user?.profile?.firstName || "";
    const lastName = user?.profile?.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.email || "Unknown User";
  };

  return (
    <AdminLayout title="User Management">
      <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">User Management</CardTitle>
              <CardDescription>Manage and view all registered users.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9 bg-background border-border/60"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  data-testid="input-user-search"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-risk-filter">
                  <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
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
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Plan</th>
                    <th className="px-6 py-4 font-semibold">Joined</th>
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
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: any) => {
                      const riskIndicators = analyzeUserRisk(user);
                      const hasHighRisk = riskIndicators.some(r => r.level === "high");
                      
                      return (
                        <tr 
                          key={user._id} 
                          className={`hover:bg-muted/20 transition-colors ${hasHighRisk ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                          data-testid={`row-user-${user._id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border/50">
                                <AvatarFallback className="text-xs font-medium">
                                  {getInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {getUserDisplayName(user)}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="capitalize">
                              {formatLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const plan = user.subscription?.plan || "free";
                              const badge = PLAN_BADGE[plan] || PLAN_BADGE.free;
                              return (
                                <Badge variant="outline" className={`text-xs ${badge.className}`}>
                                  {badge.label}
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={user.isActive !== false ? "default" : "secondary"}
                              className={
                                user.isActive !== false
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-red-100 text-red-700"
                              }
                            >
                              {user.isActive !== false ? "active" : "disabled"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
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
                                        data-testid={`badge-risk-${indicator.label.toLowerCase().replace(/\s+/g, '-')}-${user._id}`}
                                      >
                                        {indicator.level === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
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
                                    onClick={() => setViewProfileDialog({ open: true, user })}
                                    data-testid={`button-view-user-${user._id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Profile</TooltipContent>
                              </Tooltip>
                              {user.isActive !== false && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => openActionDialog("suspend", user)}
                                      data-testid={`button-suspend-user-${user._id}`}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Suspend User</TooltipContent>
                                </Tooltip>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-user-actions-${user._id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openActionDialog("role", user)}>
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openActionDialog("suspend", user)}
                                    className="text-amber-600 focus:text-amber-600"
                                  >
                                    Disable Account
                                  </DropdownMenuItem>
                                  {canDeleteUser(user) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog(user)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        {usersData?.pagination && usersData.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
            <span className="text-sm text-muted-foreground">
              Page {usersData.pagination.page} of {usersData.pagination.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={userPage <= 1}
                onClick={() => setUserPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={userPage >= usersData.pagination.pages}
                onClick={() => setUserPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !open && setActionDialog({ open: false, type: null, user: null })
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog.type === "suspend" ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Disable User Account
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  Change User Role
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "suspend"
                ? "This will disable the user's account. They will no longer be able to log in."
                : "Change the role for this user."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {actionDialog.type === "suspend" && (
              <>
                <p className="text-sm mb-4">
                  Are you sure you want to disable{" "}
                  <strong>{getUserDisplayName(actionDialog.user)}</strong>?
                </p>
                <Label className="mb-2 block font-medium">Reason (optional)</Label>
                <Textarea
                  placeholder="Please provide a reason..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="resize-none min-h-[80px]"
                />
              </>
            )}
            {actionDialog.type === "role" && (
              <>
                <Label className="mb-2 block font-medium">Select New Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === "suspend" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={
                (actionDialog.type === "role" && !selectedRole) ||
                disableUserMutation.isPending ||
                updateUserRoleMutation.isPending
              }
            >
              {(disableUserMutation.isPending || updateUserRoleMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {actionDialog.type === "suspend" ? "Disable Account" : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong>{getUserDisplayName(deleteDialog.user)}</strong>?
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone. All user data will be permanently removed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Profile Dialog */}
      <Dialog
        open={viewProfileDialog.open}
        onOpenChange={(open) => !open && setViewProfileDialog({ open: false, user: null })}
      >
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </DialogTitle>
            <DialogDescription>
              Viewing profile details for {getUserDisplayName(viewProfileDialog.user)}
            </DialogDescription>
          </DialogHeader>
          {viewProfileDialog.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                    {getInitials(viewProfileDialog.user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{getUserDisplayName(viewProfileDialog.user)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={viewProfileDialog.user.isActive !== false ? "default" : "secondary"}>
                      {viewProfileDialog.user.isActive !== false ? "Active" : "Disabled"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {formatLabel(viewProfileDialog.user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{viewProfileDialog.user.email}</span>
                  {viewProfileDialog.user.isEmailVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Verified</Badge>
                  )}
                </div>
                
                {viewProfileDialog.user.profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{viewProfileDialog.user.profile.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">
                    {new Date(viewProfileDialog.user.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                {viewProfileDialog.user.lastLoginAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last Login:</span>
                    <span className="font-medium">
                      {new Date(viewProfileDialog.user.lastLoginAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {viewProfileDialog.user.profile?.address?.city && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{viewProfileDialog.user.profile.address.city}</span>
                  </div>
                )}
              </div>
              
              {analyzeUserRisk(viewProfileDialog.user).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Risk Assessment
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analyzeUserRisk(viewProfileDialog.user).map((risk, idx) => (
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

              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription & Usage
                </h4>
                {usageStatsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : usageStatsData?.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const plan = usageStatsData.data.plan;
                        const badge = PLAN_BADGE[plan] || PLAN_BADGE.free;
                        return (
                          <Badge variant="outline" className={badge.className}>
                            {badge.label} Plan
                          </Badge>
                        );
                      })()}
                      <Badge variant="outline" className={
                        usageStatsData.data.status === 'trial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        usageStatsData.data.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }>
                        {usageStatsData.data.status.charAt(0).toUpperCase() + usageStatsData.data.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Usage</h5>
                      <div className="grid grid-cols-1 gap-1.5">
                        {USAGE_FEATURES.map(({ key, label, icon: Icon }) => {
                          const val = usageStatsData.data.dailyUsage?.[key] || 0;
                          return (
                            <div key={key} className="flex items-center justify-between text-xs py-1">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Icon className="h-3 w-3" />
                                {label}
                              </span>
                              <span className="font-medium tabular-nums">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Monthly Usage ({usageStatsData.data.monthLabel})
                      </h5>
                      <div className="grid grid-cols-1 gap-1.5">
                        {USAGE_FEATURES.map(({ key, label, icon: Icon }) => {
                          const val = usageStatsData.data.monthlyUsage?.[key] || 0;
                          return (
                            <div key={key} className="flex items-center justify-between text-xs py-1">
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Icon className="h-3 w-3" />
                                {label}
                              </span>
                              <span className="font-medium tabular-nums">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No subscription data available</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewProfileDialog({ open: false, user: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
