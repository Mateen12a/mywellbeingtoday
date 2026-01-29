import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Users,
  Activity,
  FileText,
  Search,
  MoreHorizontal,
  UserCheck,
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  MessageSquare,
  Shield,
  Paperclip,
  Send,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Filter,
  Download,
  Settings,
  Plus,
  Image as ImageIcon,
  LogOut,
  User,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Clock,
  Award,
  TrendingUp,
  Heart,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator as UiSeparator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [location, setLocation] = useLocation();

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [providerSearch, setProviderSearch] = useState("");
  const [providerPage, setProviderPage] = useState(1);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(1);

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "suspend" | "role" | null;
    user: any | null;
  }>({
    open: false,
    type: null,
    user: null,
  });
  const [actionReason, setActionReason] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const response = await api.getAdminDashboard();
      return response.data;
    },
  });

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

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["admin", "auditLogs", auditPage],
    queryFn: async () => {
      const response = await api.getAuditLogs({ page: auditPage, limit: 50 });
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: superAdminStats, isLoading: superAdminStatsLoading } = useQuery({
    queryKey: ["admin", "superadminStats"],
    queryFn: async () => {
      const response = await api.getSuperAdminStats();
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  const openActionDialog = (type: "suspend" | "role", user: any) => {
    setActionDialog({ open: true, type, user });
    setActionReason("");
    setSelectedRole(user.role || "");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location]);

  const handleLogout = async () => {
    await api.logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/");
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

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "providers", label: "Providers", icon: UserCheck },
    { id: "auditLogs", label: "Audit Logs", icon: Clock },
  ];

  if (isSuperAdmin) {
    menuItems.push({ id: "statistics", label: "Statistics", icon: BarChart3 });
    menuItems.push({ id: "admins", label: "Admin Management", icon: Shield });
  }

  const baseStats = dashboardData
    ? [
        {
          title: "Total Users",
          value: dashboardData.users?.total?.toLocaleString() || "0",
          change: `${dashboardData.users?.newThisWeek || 0} new this week`,
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-100",
          action: () => setActiveTab("users"),
        },
        {
          title: "Verified Providers",
          value: dashboardData.providers?.verified?.toLocaleString() || "0",
          change: `${dashboardData.providers?.total || 0} total providers`,
          icon: UserCheck,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          action: () => setActiveTab("providers"),
        },
        {
          title: "Total Appointments",
          value: dashboardData.appointments?.total?.toLocaleString() || "0",
          change: `${dashboardData.appointments?.pending || 0} pending`,
          icon: Activity,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-100",
          action: () => {},
        },
        {
          title: "Pending Verifications",
          value: (
            (dashboardData.providers?.total || 0) -
            (dashboardData.providers?.verified || 0)
          ).toString(),
          change: "Requires attention",
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-100",
          action: () => {
            setProviderFilter("pending");
            setActiveTab("providers");
          },
        },
      ]
    : [];

  const superAdminStatsCards = isSuperAdmin && dashboardData
    ? [
        {
          title: "Certificates Issued",
          value: dashboardData.certificates?.total?.toLocaleString() || "0",
          change: "All time",
          icon: Award,
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-100",
          action: () => setActiveTab("statistics"),
        },
        {
          title: "Activities Logged",
          value: dashboardData.activities?.total?.toLocaleString() || "0",
          change: "User activities",
          icon: TrendingUp,
          color: "text-cyan-600",
          bg: "bg-cyan-50",
          border: "border-cyan-100",
          action: () => setActiveTab("statistics"),
        },
        {
          title: "Mood Logs",
          value: dashboardData.moodLogs?.total?.toLocaleString() || "0",
          change: "All time",
          icon: Heart,
          color: "text-pink-600",
          bg: "bg-pink-50",
          border: "border-pink-100",
          action: () => setActiveTab("statistics"),
        },
        {
          title: "Audit Logs",
          value: dashboardData.auditLogs?.total?.toLocaleString() || "0",
          change: "System events",
          icon: Clock,
          color: "text-slate-600",
          bg: "bg-slate-50",
          border: "border-slate-100",
          action: () => setActiveTab("auditLogs"),
        },
      ]
    : [];

  const stats = [...baseStats, ...superAdminStatsCards];

  const currentUser = api.getUser();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="h-16 flex items-center justify-center px-4 bg-background border-b">
            <a
              href="/"
              className="flex items-center gap-3 font-bold text-xl w-full text-primary overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo5.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden text-foreground font-serif tracking-tight">
                mywellbeingtoday
              </span>
            </a>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4 bg-background">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id} className="mb-1">
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        tooltip={item.label}
                        size="lg"
                        className="transition-all duration-200 rounded-lg hover:bg-muted"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator className="bg-border/40" />
          <div className="p-4 group-data-[collapsible=icon]:hidden bg-background">
            <div className="flex items-center gap-2 bg-muted/40 p-3 rounded-xl border border-border/50">
              <div className="flex-1">
                <Label
                  htmlFor="role-toggle"
                  className="text-xs font-semibold cursor-pointer block text-foreground"
                >
                  Super Admin Mode
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  View audit logs & configs
                </p>
              </div>
              <Switch
                id="role-toggle"
                checked={isSuperAdmin}
                onCheckedChange={setIsSuperAdmin}
                className="scale-75 origin-right"
              />
            </div>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-hidden flex flex-col h-screen bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-sm px-6 sticky top-0 z-20 w-full justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-2 h-9 w-9 text-muted-foreground hover:text-foreground" />
              <UiSeparator orientation="vertical" className="mr-2 h-4" />
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold text-foreground hidden sm:block">
                  Admin Dashboard
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground border border-border/40">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9 rounded-full hover:bg-muted"
                    >
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                    </div>
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No new notifications
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarFallback>
                          {currentUser?.profile?.firstName?.[0] || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getUserDisplayName(currentUser)}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser?.email || "admin@mywellbeing.com"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
            <div className="space-y-6">
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Welcome back, {currentUser?.profile?.firstName || "Admin"}
                    </h2>
                    <p className="text-muted-foreground">
                      Here's what's happening on your platform today.
                    </p>
                  </div>

                  {dashboardLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {stats.map((stat, i) => (
                          <Card
                            key={i}
                            onClick={stat.action}
                            className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div
                                  className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border ${stat.border} group-hover:scale-110 transition-transform duration-300`}
                                >
                                  <stat.icon className="w-6 h-6" />
                                </div>
                                <Badge
                                  variant="outline"
                                  className="font-normal text-xs bg-background/50"
                                >
                                  {stat.change}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                                  {stat.value}
                                </h3>
                                <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                                  {stat.title}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {dashboardData?.userGrowth && dashboardData.userGrowth.length > 0 && (
                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader>
                            <CardTitle>User Growth (Last 30 Days)</CardTitle>
                            <CardDescription>
                              New user registrations over the past month.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {dashboardData.userGrowth.slice(-7).map((day: any) => (
                                <div
                                  key={day._id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    {formatDate(day._id)}
                                  </span>
                                  <Badge variant="secondary">
                                    {day.count} new users
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "users" && (
                <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold">
                          User Management
                        </CardTitle>
                        <CardDescription>
                          Manage and view all registered users.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
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
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() =>
                            queryClient.invalidateQueries({
                              queryKey: ["admin", "users"],
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
                              <th className="px-6 py-4 font-semibold">Status</th>
                              <th className="px-6 py-4 font-semibold">
                                Joined Date
                              </th>
                              <th className="px-6 py-4 font-semibold text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {usersData?.users?.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-8 text-center text-muted-foreground"
                                >
                                  No users found
                                </td>
                              </tr>
                            ) : (
                              usersData?.users?.map((user: any) => (
                                <tr
                                  key={user._id}
                                  className="group hover:bg-muted/20 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                          {getInitials(user)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">
                                          {getUserDisplayName(user)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {user.email}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge
                                      variant="outline"
                                      className="font-normal bg-background capitalize"
                                    >
                                      {user.role}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge
                                      variant={user.isActive ? "default" : "secondary"}
                                      className={
                                        user.isActive
                                          ? "bg-emerald-500 hover:bg-emerald-600 border-transparent"
                                          : ""
                                      }
                                    >
                                      {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground font-medium">
                                    {formatDate(user.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>
                                            Actions
                                          </DropdownMenuLabel>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              openActionDialog("role", user)
                                            }
                                          >
                                            Change Role
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            onClick={() =>
                                              openActionDialog("suspend", user)
                                            }
                                            disabled={!user.isActive}
                                          >
                                            Disable User
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {usersData?.pagination && usersData.pagination.pages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                        <span className="text-sm text-muted-foreground">
                          Page {usersData.pagination.page} of{" "}
                          {usersData.pagination.pages}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userPage <= 1}
                            onClick={() => setUserPage((p) => p - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={userPage >= usersData.pagination.pages}
                            onClick={() => setUserPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "providers" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Provider Directory
                      </h2>
                      <p className="text-muted-foreground">
                        Manage provider verifications and listings.
                      </p>
                    </div>
                  </div>

                  <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
                    <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2 flex-1 w-full">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          className="border-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/70"
                          placeholder="Search providers by name or specialty..."
                          value={providerSearch}
                          onChange={(e) => {
                            setProviderSearch(e.target.value);
                            setProviderPage(1);
                          }}
                        />
                      </div>
                      <Select
                        value={providerFilter}
                        onValueChange={(val) => {
                          setProviderFilter(val);
                          setProviderPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Providers</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <CardContent className="p-0 overflow-auto">
                      {providersLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/40">
                            <tr>
                              <th className="px-6 py-4 font-semibold">Provider</th>
                              <th className="px-6 py-4 font-semibold">
                                Specialty
                              </th>
                              <th className="px-6 py-4 font-semibold">Status</th>
                              <th className="px-6 py-4 font-semibold">Joined</th>
                              <th className="px-6 py-4 font-semibold text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {providersData?.providers?.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-8 text-center text-muted-foreground"
                                >
                                  No providers found
                                </td>
                              </tr>
                            ) : (
                              providersData?.providers?.map((provider: any) => (
                                <tr
                                  key={provider._id}
                                  className="group hover:bg-muted/20 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                          {provider.professionalInfo?.title?.[0] ||
                                            provider.userId?.profile?.firstName?.[0] ||
                                            "P"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-foreground">
                                          {provider.professionalInfo?.title ||
                                            provider.practice?.name ||
                                            getUserDisplayName(provider.userId)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {provider.userId?.email}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground">
                                    {provider.professionalInfo?.specialties?.join(
                                      ", "
                                    ) || "N/A"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge
                                      variant={
                                        provider.verification?.isVerified
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={
                                        provider.verification?.isVerified
                                          ? "bg-emerald-500 hover:bg-emerald-600 border-transparent"
                                          : ""
                                      }
                                    >
                                      {provider.verification?.isVerified
                                        ? "Verified"
                                        : "Pending"}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-muted-foreground">
                                    {formatDate(provider.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {!provider.verification?.isVerified && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                        onClick={() =>
                                          verifyProviderMutation.mutate(
                                            provider._id
                                          )
                                        }
                                        disabled={verifyProviderMutation.isPending}
                                      >
                                        {verifyProviderMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                          <UserCheck className="h-4 w-4 mr-1" />
                                        )}
                                        Verify
                                      </Button>
                                    )}
                                    {provider.verification?.isVerified && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Verified{" "}
                                        {provider.verification?.verifiedAt &&
                                          formatDate(
                                            provider.verification.verifiedAt
                                          )}
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                    {providersData?.pagination &&
                      providersData.pagination.pages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                          <span className="text-sm text-muted-foreground">
                            Page {providersData.pagination.page} of{" "}
                            {providersData.pagination.pages}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={providerPage <= 1}
                              onClick={() => setProviderPage((p) => p - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                providerPage >= providersData.pagination.pages
                              }
                              onClick={() => setProviderPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                  </Card>
                </div>
              )}

              {activeTab === "auditLogs" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        Audit Logs
                      </h2>
                      <p className="text-muted-foreground">
                        System activity and action history.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["admin", "auditLogs"],
                        })
                      }
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
                    <CardContent className="p-0">
                      {auditLogsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : !isSuperAdmin ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Enable Super Admin mode to view audit logs
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/40">
                              <tr>
                                <th className="px-6 py-4 font-semibold">
                                  Timestamp
                                </th>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Action</th>
                                <th className="px-6 py-4 font-semibold">
                                  Resource
                                </th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">
                                  Details
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {auditLogsData?.logs?.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-muted-foreground"
                                  >
                                    No audit logs found
                                  </td>
                                </tr>
                              ) : (
                                auditLogsData?.logs?.map((log: any) => (
                                  <>
                                    <tr
                                      key={log._id}
                                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                                      onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                                    >
                                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-xs">
                                              {log.userId?.profile?.firstName?.[0] ||
                                                "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex flex-col">
                                            <span className="text-foreground text-xs">
                                              {log.userId?.profile?.firstName && log.userId?.profile?.lastName
                                                ? `${log.userId.profile.firstName} ${log.userId.profile.lastName}`
                                                : log.userId?.email || "System"}
                                            </span>
                                            {log.userId?.email && log.userId?.profile?.firstName && (
                                              <span className="text-muted-foreground text-xs">
                                                {log.userId.email}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <Badge 
                                          variant={
                                            log.action.includes('VERIFY') ? 'default' :
                                            log.action.includes('REJECT') || log.action.includes('DELETE') || log.action.includes('DEACTIVATE') ? 'destructive' :
                                            log.action.includes('LOGIN') ? 'secondary' :
                                            'outline'
                                          } 
                                          className="font-mono text-xs"
                                        >
                                          {log.action.replace(/_/g, ' ')}
                                        </Badge>
                                      </td>
                                      <td className="px-6 py-4 text-muted-foreground">
                                        {log.resource}
                                      </td>
                                      <td className="px-6 py-4">
                                        <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'} className="text-xs">
                                          {log.status}
                                        </Badge>
                                      </td>
                                      <td className="px-6 py-4 text-muted-foreground">
                                        {log.details && Object.keys(log.details).length > 0 ? (
                                          <Button variant="ghost" size="sm" className="h-6 px-2">
                                            <Eye className="h-3 w-3 mr-1" />
                                            {expandedLogId === log._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                          </Button>
                                        ) : (
                                          <span className="text-xs">-</span>
                                        )}
                                      </td>
                                    </tr>
                                    {expandedLogId === log._id && log.details && (
                                      <tr key={`${log._id}-details`}>
                                        <td colSpan={6} className="px-6 py-4 bg-muted/30">
                                          <div className="text-xs space-y-2">
                                            <div className="font-semibold text-foreground mb-2">Details</div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                              {log.details.approverName && (
                                                <div>
                                                  <span className="text-muted-foreground">Approved by:</span>
                                                  <span className="ml-2 text-foreground font-medium">{log.details.approverName}</span>
                                                </div>
                                              )}
                                              {log.details.approverEmail && (
                                                <div>
                                                  <span className="text-muted-foreground">Approver Email:</span>
                                                  <span className="ml-2 text-foreground">{log.details.approverEmail}</span>
                                                </div>
                                              )}
                                              {log.details.approvedAt && (
                                                <div>
                                                  <span className="text-muted-foreground">Approved at:</span>
                                                  <span className="ml-2 text-foreground">{new Date(log.details.approvedAt).toLocaleString()}</span>
                                                </div>
                                              )}
                                              {log.details.providerName && (
                                                <div>
                                                  <span className="text-muted-foreground">Provider:</span>
                                                  <span className="ml-2 text-foreground">{log.details.providerName}</span>
                                                </div>
                                              )}
                                              {log.details.providerEmail && (
                                                <div>
                                                  <span className="text-muted-foreground">Provider Email:</span>
                                                  <span className="ml-2 text-foreground">{log.details.providerEmail}</span>
                                                </div>
                                              )}
                                              {log.details.rejecterName && (
                                                <div>
                                                  <span className="text-muted-foreground">Rejected by:</span>
                                                  <span className="ml-2 text-foreground font-medium">{log.details.rejecterName}</span>
                                                </div>
                                              )}
                                              {log.details.reason && (
                                                <div className="col-span-full">
                                                  <span className="text-muted-foreground">Reason:</span>
                                                  <span className="ml-2 text-foreground">{log.details.reason}</span>
                                                </div>
                                              )}
                                              {log.details.email && (
                                                <div>
                                                  <span className="text-muted-foreground">Email:</span>
                                                  <span className="ml-2 text-foreground">{log.details.email}</span>
                                                </div>
                                              )}
                                              {log.details.role && (
                                                <div>
                                                  <span className="text-muted-foreground">Role:</span>
                                                  <span className="ml-2 text-foreground">{log.details.role}</span>
                                                </div>
                                              )}
                                              {log.details.type && (
                                                <div>
                                                  <span className="text-muted-foreground">Type:</span>
                                                  <span className="ml-2 text-foreground">{log.details.type}</span>
                                                </div>
                                              )}
                                              {log.details.title && (
                                                <div>
                                                  <span className="text-muted-foreground">Title:</span>
                                                  <span className="ml-2 text-foreground">{log.details.title}</span>
                                                </div>
                                              )}
                                            </div>
                                            <div className="pt-2 border-t border-border/40 mt-2">
                                              <span className="text-muted-foreground">IP Address:</span>
                                              <span className="ml-2 font-mono">{log.ipAddress || "N/A"}</span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                    {isSuperAdmin &&
                      auditLogsData?.pagination &&
                      auditLogsData.pagination.pages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                          <span className="text-sm text-muted-foreground">
                            Page {auditLogsData.pagination.page} of{" "}
                            {auditLogsData.pagination.pages}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={auditPage <= 1}
                              onClick={() => setAuditPage((p) => p - 1)}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                auditPage >= auditLogsData.pagination.pages
                              }
                              onClick={() => setAuditPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                  </Card>
                </div>
              )}

              {activeTab === "statistics" && isSuperAdmin && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold">Platform Statistics</h2>
                      <p className="text-muted-foreground">
                        Comprehensive analytics and insights for the platform.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "superadminStats"] })}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {superAdminStatsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : superAdminStats ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                                <p className="text-2xl font-bold">{superAdminStats.overview?.totalUsers?.toLocaleString() || 0}</p>
                              </div>
                              <Users className="h-8 w-8 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Providers</p>
                                <p className="text-2xl font-bold">{superAdminStats.overview?.totalProviders?.toLocaleString() || 0}</p>
                                <p className="text-xs text-muted-foreground">{superAdminStats.overview?.verifiedProviders || 0} verified</p>
                              </div>
                              <UserCheck className="h-8 w-8 text-emerald-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Admins</p>
                                <p className="text-2xl font-bold">{superAdminStats.overview?.totalAdmins?.toLocaleString() || 0}</p>
                              </div>
                              <Shield className="h-8 w-8 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-border/60 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Total Certificates</p>
                                <p className="text-2xl font-bold">{superAdminStats.overview?.totalCertificates?.toLocaleString() || 0}</p>
                              </div>
                              <Award className="h-8 w-8 text-amber-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">This Week Activity</CardTitle>
                            <CardDescription>Platform activity over the past 7 days</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-cyan-500" />
                                <span className="text-sm">Activities Logged</span>
                              </div>
                              <Badge variant="secondary">{superAdminStats.thisWeek?.activities || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <span className="text-sm">Mood Logs</span>
                              </div>
                              <Badge variant="secondary">{superAdminStats.thisWeek?.moodLogs || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-500" />
                                <span className="text-sm">Certificates Issued</span>
                              </div>
                              <Badge variant="secondary">{superAdminStats.thisWeek?.certificates || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Login Attempts</span>
                              </div>
                              <Badge variant="secondary">{superAdminStats.thisWeek?.loginAttempts || 0}</Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Certificates by Type</CardTitle>
                            <CardDescription>Distribution of issued certificates</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {superAdminStats.certificatesByType?.length > 0 ? (
                              superAdminStats.certificatesByType.map((item: any) => (
                                <div key={item._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                                  <span className="text-sm capitalize">{item._id || 'Unknown'}</span>
                                  <Badge variant="outline">{item.count}</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No certificates issued yet</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="border border-border/60 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Top Audit Actions (Last 30 Days)</CardTitle>
                          <CardDescription>Most common actions performed on the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {superAdminStats.auditActionCounts?.slice(0, 9).map((action: any) => (
                              <div key={action._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {action._id?.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-sm font-medium">{action.count}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-border/60 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Recent Provider Approvals</CardTitle>
                          <CardDescription>Latest provider verifications with approver info</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {superAdminStats.providerApprovals?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-muted-foreground">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-medium">Date</th>
                                    <th className="px-4 py-3 text-left font-medium">Approved By</th>
                                    <th className="px-4 py-3 text-left font-medium">Provider</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                  {superAdminStats.providerApprovals.map((log: any) => (
                                    <tr key={log._id} className="hover:bg-muted/20">
                                      <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {log.details?.approverName || log.userId?.profile?.firstName 
                                              ? `${log.userId?.profile?.firstName || ''} ${log.userId?.profile?.lastName || ''}`.trim() 
                                              : log.userId?.email || 'Unknown'}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {log.details?.approverEmail || log.userId?.email}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                          <span>{log.details?.providerName || 'N/A'}</span>
                                          <span className="text-xs text-muted-foreground">{log.details?.providerEmail || ''}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No provider approvals yet</p>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{superAdminStats.overview?.totalActivities?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time user activities</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Mood Logs</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{superAdminStats.overview?.totalMoodLogs?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time mood entries</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border/60 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Audit Logs</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{superAdminStats.overview?.totalAuditLogs?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">System event records</p>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>Unable to load statistics</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "admins" && isSuperAdmin && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold">Admin Management</h2>
                      <p className="text-muted-foreground">
                        Manage platform administrators and permissions.
                      </p>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Admin management features coming soon.</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

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
                <Label className="mb-2 block font-medium">
                  Reason (optional)
                </Label>
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
              onClick={() =>
                setActionDialog({ open: false, type: null, user: null })
              }
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
              {(disableUserMutation.isPending ||
                updateUserRoleMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {actionDialog.type === "suspend" ? "Disable Account" : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
