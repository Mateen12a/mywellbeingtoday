import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logo2 from "@assets/logo.svg";
const logo = "/logo5.png"; // Keeping reference just in case, but unused for now
import fingertip from "@assets/fingertip.png";
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Activity,
  Heart,
  Calendar,
  FileText,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  Shield,
  Database,
  BarChart3,
  Globe,
  Stethoscope,
  AlertTriangle,
  Bell,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import user2 from "@assets/stock_images/professional_headsho_65477c19.jpg";
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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showMobileTitle, setShowMobileTitle] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to mywellbeingtoday',
      message: 'Start tracking your mood and activities to get personalized insights.',
      time: '2 hours ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Daily Check-in Reminder',
      message: "Don't forget to log your mood today for better wellbeing tracking.",
      time: '5 hours ago',
      read: false,
      type: 'info'
    },
    {
      id: '3',
      title: 'Weekly Report Ready',
      message: 'Your wellbeing report for last week is now available.',
      time: '1 day ago',
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

  const isAdmin = location.startsWith("/admin/") || location === "/admin";
  const isAdminLogin = location === "/admin-login";
  const isProvider = location.startsWith("/provider-dashboard") || location.startsWith("/provider-settings") || location.startsWith("/provider-ai-assistant");

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Typing effect logic for mobile/tablet dashboard
  useEffect(() => {
    // Only run on dashboard/authenticated views and on smaller screens (handled by CSS/conditional rendering)
    if (!isAuthenticated) return;

    let intervalId: NodeJS.Timeout;

    // Start with title visible
    setShowMobileTitle(true);

    const blinkOff = () => {
      setShowMobileTitle(false);
      // Show it back after 2s
      setTimeout(() => setShowMobileTitle(true), 2000);
    };

    // First blink off happens after 10s
    const initialTimeout = setTimeout(() => {
      blinkOff();

      // Then repeat every 12s (10s on + 2s off)
      intervalId = setInterval(blinkOff, 12000);
    }, 10000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated]);

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

              {/* Desktop Title */}
              <span className="font-serif font-bold text-lg text-primary tracking-tight hidden xl:block">
                mywellbeingtoday
              </span>

              {/* Mobile/Tablet Title with Typing Effect */}
              <div className="xl:hidden h-6 flex items-center max-w-[140px] sm:max-w-[180px] overflow-hidden">
                <AnimatePresence>
                  {(showMobileTitle || !isAuthenticated) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="font-serif font-bold text-sm sm:text-base text-primary tracking-tight overflow-hidden whitespace-nowrap"
                    >
                      mywellbeingtoday
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
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
                  Log
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative rounded-full"
                      data-testid="button-notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
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
                          data-testid="button-mark-all-read"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark all read
                        </Button>
                      )}
                    </div>
                    <ScrollArea className="max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
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
                              data-testid={`notification-item-${notification.id}`}
                            >
                              <div className="flex items-start gap-3">
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-primary rounded-full mt-1.5 shrink-0" />
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
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-9 w-9"
                    data-testid="button-notifications-mobile"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 rounded-xl shadow-xl" align="end">
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs text-primary"
                        onClick={markAllAsRead}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-[250px]">
                    {notifications.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={cn(
                              "p-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
                              !notification.read && "bg-primary/5"
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.read && (
                                <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                              )}
                              <div className={cn("flex-1", notification.read && "ml-3.5")}>
                                <p className="font-medium text-xs">{notification.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2 px-2">
                    <div className="bg-primary/20 p-1.5 rounded-lg">
                      <img src={logo} alt="Logo" className="h-6 w-6" />
                    </div>
                    <span className="font-serif font-bold text-primary">
                      mywellbeingtoday
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-120px)] pb-8 px-1">
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
                        <NavLink href="/history" icon={Calendar}>
                          History & Records
                        </NavLink>
                        <NavLink href="/certificates" icon={FileText}>
                          Medicals & Certificates
                        </NavLink>
                        <NavLink href="/settings" icon={Settings}>
                          Settings
                        </NavLink>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                          onClick={() => {
                            setIsOpen(false);
                            logout();
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-1 md:py-8 max-w-7xl animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          {isAuthenticated ? (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
              <div className="text-center md:text-left">
                © 2026 mywellbeingtoday. All rights reserved. Not a substitute
                for professional medical advice.
              </div>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
                <span>
                  Built by{" "}
                  <span className="font-medium text-foreground">
                    Airfns Softwares
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold text-muted-foreground">
                      mywellbeingtoday
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
                    Empowering your journey to wellness with daily support and
                    insights.
                  </p>
                </div>

                <div className="flex flex-col items-center md:items-end gap-1 text-sm text-muted-foreground">
                  <div>
                    Built by{" "}
                    <span className="font-medium text-foreground">
                      Airfns Softwares
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  © {new Date().getFullYear()} mywellbeingtoday. All rights
                  reserved. Not a substitute for professional medical advice.
                </span>
                <div className="flex items-center gap-4">
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
