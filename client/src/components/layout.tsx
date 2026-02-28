import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logo2 from "@assets/logo.svg";
const logo = "/logo5.png"; // Keeping reference just in case, but unused for now
import fingertip from "@assets/fingertip.png";
import {
  Menu,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Activity,
  Heart,
  Calendar,
  CalendarCheck,
  FileText,
  MapPin,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Bell,
  Lock,
  PartyPopper,
  Smile,
  Footprints,
  XCircle,
  CheckCircle
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { registerServiceWorker, subscribeToPushNotifications, isPushSupported, getPushPermissionStatus } from '@/lib/pushNotifications';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

function NotificationBell() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => api.getUnreadNotificationCount(),
    refetchInterval: 30000,
  });

  const { data: notifData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(1, 20),
    enabled: open,
  });

  const unreadCount = countData?.data?.count || 0;
  const notifications = notifData?.data?.notifications || [];

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsAsRead();
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await api.markNotificationAsRead(notification._id);
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    setOpen(false);
    if (notification.link) {
      setLocation(notification.link);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4 text-muted-foreground";
    switch (type) {
      case 'login': return <Lock className={iconClass} />;
      case 'register': case 'welcome': return <PartyPopper className={iconClass} />;
      case 'mood_logged': return <Smile className={iconClass} />;
      case 'activity_logged': return <Footprints className={iconClass} />;
      case 'appointment_booked': case 'appointment_confirmed': return <CalendarCheck className={iconClass} />;
      case 'appointment_cancelled': return <XCircle className={iconClass} />;
      case 'emergency': return <AlertTriangle className={iconClass} />;
      case 'provider_verified': return <CheckCircle className={iconClass} />;
      default: return <Bell className={iconClass} />;
    }
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) refetchNotifications(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <button
                  key={notification._id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{getTimeAgo(notification.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();

  const [showPushBanner, setShowPushBanner] = useState(false);

  const isAdmin = location.startsWith("/admin/") || location === "/admin";
  const isAdminLogin = location === "/admin-login";
  const isProvider = location.startsWith("/provider-dashboard") || location.startsWith("/provider-settings") || location.startsWith("/provider-ai-assistant");

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (user && isPushSupported() && getPushPermissionStatus() === 'default') {
      registerServiceWorker().then(() => {
        const timer = setTimeout(() => {
          subscribeToPushNotifications();
        }, 3000);
        return () => clearTimeout(timer);
      });
    } else if (user && isPushSupported() && getPushPermissionStatus() === 'granted') {
      registerServiceWorker().then(() => {
        subscribeToPushNotifications();
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isPushSupported() || getPushPermissionStatus() !== 'default') return;

    const DISMISS_KEY = 'push_banner_dismissed_at';
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt, 10) < sevenDays) return;
    }

    registerServiceWorker();

    const timer = setTimeout(() => {
      if (getPushPermissionStatus() === 'default') {
        setShowPushBanner(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleEnablePush = useCallback(async () => {
    setShowPushBanner(false);
    await subscribeToPushNotifications();
  }, []);

  const handleDismissPushBanner = useCallback(() => {
    setShowPushBanner(false);
    localStorage.setItem('push_banner_dismissed_at', Date.now().toString());
  }, []);

  if (isAdmin || isProvider || isAdminLogin) {
    return (
      <div className="min-h-screen bg-background font-sans">
        {children}
      </div>
    );
  }

  const NavLink = ({
    href,
    icon: Icon,
    children,
  }: {
    href: string;
    icon?: any;
    children: React.ReactNode;
  }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium",
            isActive
              ? "bg-primary/10 text-primary font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
          onClick={() => setIsOpen(false)}
        >
          {Icon && <Icon className="w-5 h-4" />}
          {children}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                src={logo}
                alt="mywellbeingtoday"
                className="h-10 w-10 aspect-square object-cover rounded-2xl"
              />

              <span className="font-serif font-bold text-sm sm:text-base xl:text-lg text-primary tracking-tight whitespace-nowrap">
                mywellbeingtoday
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-4 ml-auto">
            {!isAuthenticated ? (
              <>
                <Link href="/about">
                  <Button variant="ghost">About</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            ) : (
              <>
                <NavLink href="/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </NavLink>
                <NavLink href="/activity" icon={Activity}>
                  Log Activity
                </NavLink>
                <NavLink href="/mood" icon={Heart}>
                  Mood
                </NavLink>
                <NavLink href="/directory" icon={MapPin}>
                  Directory
                </NavLink>
                <NavLink href="/messages" icon={MessageSquare}>
                  Messages
                </NavLink>
                <NavLink href="/ai-assistant" icon={Sparkles}>
                  AI Assistant
                </NavLink>
                 <Link href="/directory?tab=emergency">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                    <AlertTriangle className="w-5 h-4" />
                    Emergency
                  </div>
                </Link>
                <div className="h-6 w-px bg-border mx-2" />
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(user?.profile?.firstName || "", user?.profile?.lastName || "")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-semibold">
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer bg-red-100 text-red-600 font-semibold focus:bg-red-200 focus:text-red-700 dark:bg-red-950 dark:text-red-400 dark:focus:bg-red-900"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>

          {/* Mobile/Tablet Menu */}
          <div className="xl:hidden flex items-center gap-1 shrink-0">
            {isAuthenticated && (
              <NotificationBell />
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0 flex flex-col h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-4 py-4 border-b shrink-0">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <img src={logo} alt="Logo" className="h-6 w-6" />
                    </div>
                    <span className="font-serif font-bold text-primary text-sm">
                      mywellbeingtoday
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                    {!isAuthenticated ? (
                      <>
                        <Link href="/" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                          >
                            Home
                          </Button>
                        </Link>
                        <Link href="/about" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                          >
                            About
                          </Button>
                        </Link>
                        <Link
                          href="/auth/login"
                          onClick={() => setIsOpen(false)}
                        >
                          <Button
                            variant="secondary"
                            className="w-full justify-start"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={() => setIsOpen(false)}
                        >
                          <Button className="w-full justify-start">
                            Register
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Menu
                        </div>
                        <NavLink href="/dashboard" icon={LayoutDashboard}>
                          Dashboard
                        </NavLink>
                        <NavLink href="/activity" icon={Activity}>
                           Log Activity
                        </NavLink>
                        <NavLink href="/mood" icon={Heart}>
                           Mood Tracker
                        </NavLink>
                        <NavLink href="/directory" icon={MapPin}>
                           Directory
                        </NavLink>
                        <NavLink href="/messages" icon={MessageSquare}>
                           Messages
                        </NavLink>
                        <NavLink href="/ai-assistant" icon={Sparkles}>
                           AI Assistant
                        </NavLink>
                         
                         <Link href="/directory?tab=emergency" onClick={() => setIsOpen(false)}>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 mt-2">
                              <AlertTriangle className="w-5 h-4" />
                              Emergency Services
                            </div>
                        </Link>

                        <div className="px-2 py-1 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Account
                        </div>
                        <NavLink href="/appointments" icon={CalendarCheck}>
                          My Appointments
                        </NavLink>
                        <NavLink href="/history" icon={Calendar}>
                          History & Records
                        </NavLink>
                        <NavLink href="/certificates" icon={FileText}>
                          Medicals & Certificates
                        </NavLink>
                        <NavLink href="/settings" icon={Settings}>
                          Settings
                        </NavLink>
                      </>
                    )}
                  </div>
                  
                  {/* Logout button - fixed at bottom for visibility */}
                  {isAuthenticated && (
                    <div className="shrink-0 border-t p-3 bg-background">
                      <Button
                        variant="destructive"
                        className="w-full justify-center gap-2 h-11 font-semibold"
                        onClick={() => {
                          setIsOpen(false);
                          logout();
                        }}
                        data-testid="button-logout-mobile"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showPushBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3"
          >
            <div className="container mx-auto flex items-center justify-between gap-3 max-w-7xl">
              <div className="flex items-center gap-3 min-w-0">
                <Bell className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-foreground">
                  Enable notifications to stay updated on your wellbeing journey
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="default" onClick={handleEnablePush} className="h-8 text-xs">
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismissPushBanner} className="h-8 text-xs text-muted-foreground">
                  Not now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-1 md:py-8 max-w-7xl animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary/30">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {isAuthenticated ? (
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-xs text-muted-foreground text-center">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Link href="/about" className="hover:text-foreground hover:underline">About</Link>
                <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span>© 2026 mywellbeingtoday. All rights reserved.</span>
                <span className="hidden sm:inline">•</span>
                <span>Not a substitute for professional medical advice.</span>
              </div>
              <div className="text-[10px] sm:text-xs">
                Built by{" "}
                <span className="font-medium text-foreground">
                  Airfns Softwares
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
                <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
                  <span className="font-serif font-semibold text-muted-foreground">
                    mywellbeingtoday
                  </span>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
                    Empowering your journey to wellness with daily support and
                    insights.
                  </p>
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
                  Built by{" "}
                  <span className="font-medium text-foreground">
                    Airfns Softwares
                  </span>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 border-t border-border/50 flex flex-col items-center gap-3 sm:gap-2 text-xs text-muted-foreground text-center md:flex-row md:justify-between">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <span>© {new Date().getFullYear()} mywellbeingtoday. All rights reserved.</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Not a substitute for professional medical advice.</span>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/about" className="hover:text-foreground hover:underline">About</Link>
                  <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
