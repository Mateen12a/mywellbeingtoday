import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator as UiSeparator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Users,
  UserCheck,
  Bell,
  Calendar as CalendarIcon,
  Shield,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Clock,
  Activity,
  Flag,
  Headphones,
  FileText,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

export default function AdminLayout({ children, title = "Admin Dashboard" }: AdminLayoutProps) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const currentUser = api.getUser();
  
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: '1',
      title: 'New Provider Registration',
      message: 'Dr. Sarah Johnson has registered and is pending verification.',
      time: '30 minutes ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Support Ticket Escalated',
      message: 'Ticket #1234 requires admin attention.',
      time: '1 hour ago',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'System Update Complete',
      message: 'Platform has been updated to version 2.4.0.',
      time: '3 hours ago',
      read: true,
      type: 'success'
    }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "users", label: "User Management", icon: Users, path: "/admin/users" },
    { id: "providers", label: "Providers", icon: UserCheck, path: "/admin/providers" },
    { id: "content", label: "Content", icon: FileText, path: "/admin/content" },
    { id: "activity", label: "System Log", icon: Activity, path: "/admin/activity" },
    { id: "reported-chats", label: "Reported Chats", icon: Flag, path: "/admin/reported-chats" },
    { id: "support", label: "Support Tickets", icon: Headphones, path: "/admin/support" },
    { id: "audit-logs", label: "Audit Logs", icon: Clock, path: "/admin/audit-logs" },
    { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore errors - logout already cleared local tokens
    }
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/auth/admin-login");
  };

  const getUserDisplayName = (user: any) => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.email || "Admin";
  };

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

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
                        isActive={isActive(item.path)}
                        onClick={() => setLocation(item.path)}
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
          <div className="p-4 group-data-[collapsible=icon]:hidden bg-background border-t">
            <div className="flex items-center gap-2 bg-muted/40 p-3 rounded-xl border border-border/50">
              <Shield className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  Admin Portal
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {currentUser?.role === 'admin' ? 'Admin' : 'Manager'}
                </p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[10px] text-muted-foreground">Built by Airfns Softwares</p>
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
                  {title}
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
                      data-testid="button-admin-notifications"
                    >
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 rounded-xl shadow-xl" align="end">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-primary hover:text-primary"
                          onClick={markAllAsRead}
                          data-testid="button-admin-mark-all-read"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No notifications
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={cn(
                                "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                                !notification.read && "bg-primary/5"
                              )}
                              onClick={() => markAsRead(notification.id)}
                              data-testid={`admin-notification-item-${notification.id}`}
                            >
                              <div className="flex items-start gap-3">
                                {!notification.read && (
                                  <span className={cn(
                                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                    notification.type === 'warning' ? "bg-amber-500" : 
                                    notification.type === 'success' ? "bg-green-500" : "bg-primary"
                                  )} />
                                )}
                                <div className={cn("flex-1", notification.read && "ml-5")}>
                                  <p className="font-medium text-sm">{notification.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
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
                    <DropdownMenuItem onClick={() => setLocation("/admin/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/admin/settings")}>
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
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
