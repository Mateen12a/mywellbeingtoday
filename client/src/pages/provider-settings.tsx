import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Lock, LockOpen, Key, Clock, Loader2, Building2, Video, Phone, MapPin, LayoutDashboard, Calendar as CalendarIcon, MessageSquare, FileText, Award, Settings, LogOut, Sparkles, LifeBuoy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
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
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const UNLOCK_DURATION_MS = 5 * 60 * 1000;

export default function ProviderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [location] = useLocation();
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "personal";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['providerProfile'],
    queryFn: async () => {
      const response = await api.getProviderProfile();
      if (response.success && response.data) {
        return response.data.provider;
      }
      throw new Error('Failed to fetch provider profile');
    },
  });

  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
  });

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    specialty: '',
    street: '',
    city: '',
    postcode: '',
    country: 'uk',
    consultationTypes: [] as string[],
    acceptingNewPatients: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    appointmentReminders: true,
    patientMessages: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [unlockTimestamp, setUnlockTimestamp] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const isUnlocked = unlockTimestamp !== null && Date.now() - unlockTimestamp < UNLOCK_DURATION_MS;

  useEffect(() => {
    if (!unlockTimestamp) {
      setRemainingTime(0);
      return;
    }

    const updateRemainingTime = () => {
      const elapsed = Date.now() - unlockTimestamp;
      const remaining = Math.max(0, UNLOCK_DURATION_MS - elapsed);
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setUnlockTimestamp(null);
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [unlockTimestamp]);

  const handleLockClick = useCallback(() => {
    if (isUnlocked) {
      setUnlockTimestamp(null);
      toast({
        title: "Fields locked",
        description: "Personal information fields have been locked.",
      });
    } else {
      setShowPasswordDialog(true);
    }
  }, [isUnlocked, toast]);

  const handleVerifyPassword = async () => {
    if (!verifyPasswordInput) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const response = await api.verifyPassword(verifyPasswordInput);
      if (response.success) {
        setUnlockTimestamp(Date.now());
        setShowPasswordDialog(false);
        setVerifyPasswordInput('');
        toast({
          title: "Fields unlocked",
          description: "You can now edit your information. Fields will auto-lock in 5 minutes.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: response.message || "The password you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "The password you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (profileData) {
      const user = profileData.userId;
      setPersonalForm({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        phone: profileData.contactInfo?.phone || user?.profile?.phone || '',
        title: profileData.professionalInfo?.title || '',
        bio: profileData.professionalInfo?.bio || '',
      });

      setBusinessForm({
        businessName: profileData.businessInfo?.name || profileData.practice?.name || '',
        specialty: profileData.professionalInfo?.specialty || profileData.professionalInfo?.specialties?.[0] || '',
        street: profileData.contactInfo?.address?.street || profileData.practice?.address?.street || '',
        city: profileData.contactInfo?.address?.city || profileData.practice?.address?.city || '',
        postcode: profileData.contactInfo?.address?.postcode || profileData.practice?.address?.postcode || '',
        country: profileData.contactInfo?.address?.country || profileData.practice?.address?.country || 'uk',
        consultationTypes: profileData.availability?.consultationTypes || [],
        acceptingNewPatients: profileData.availability?.acceptingNewPatients ?? true,
      });

      setNotificationSettings({
        email: profileData.settings?.notifications?.email ?? true,
        push: profileData.settings?.notifications?.push ?? true,
        sms: profileData.settings?.notifications?.sms ?? false,
        appointmentReminders: profileData.settings?.notifications?.appointmentReminders ?? true,
        patientMessages: profileData.settings?.notifications?.patientMessages ?? true,
      });
    }
  }, [profileData]);

  useEffect(() => {
    const tab = getTabFromUrl();
    setActiveTab(tab);
  }, [location]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(window.location.search);
    if (val === "personal") {
      params.delete("tab");
    } else {
      params.set("tab", val);
    }
    const newSearch = params.toString();
    const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.pushState(null, "", newPath);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.updateProviderProfile(data);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await api.changePassword(currentPassword, newPassword);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleSavePersonal = () => {
    updateProfileMutation.mutate({
      professionalInfo: {
        title: personalForm.title,
        bio: personalForm.bio,
      },
      contactInfo: {
        phone: personalForm.phone,
      },
    });
  };

  const handleSaveBusiness = () => {
    updateProfileMutation.mutate({
      businessInfo: {
        name: businessForm.businessName,
      },
      professionalInfo: {
        specialty: businessForm.specialty,
      },
      practice: {
        name: businessForm.businessName,
        address: {
          street: businessForm.street,
          city: businessForm.city,
          postcode: businessForm.postcode,
          country: businessForm.country,
        },
      },
      contactInfo: {
        address: {
          street: businessForm.street,
          city: businessForm.city,
          postcode: businessForm.postcode,
          country: businessForm.country,
        },
      },
      availability: {
        acceptingNewPatients: businessForm.acceptingNewPatients,
        consultationTypes: businessForm.consultationTypes,
      },
    });
  };

  const toggleConsultationType = (type: string) => {
    setBusinessForm(prev => {
      const types = prev.consultationTypes;
      if (types.includes(type)) {
        return { ...prev, consultationTypes: types.filter(t => t !== type) };
      } else {
        return { ...prev, consultationTypes: [...types, type] };
      }
    });
  };

  const handleSaveNotifications = () => {
    updateProfileMutation.mutate({
      settings: {
        notifications: notificationSettings,
      },
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/provider-dashboard" },
    { id: "bookings", label: "Appointments", icon: CalendarIcon, href: "/provider-dashboard?tab=bookings" },
    { id: "messages", label: "Messages", icon: MessageSquare, href: "/provider-dashboard?tab=messages" },
    { id: "reports", label: "Patient Reports", icon: FileText, href: "/provider-dashboard?tab=reports" },
    { id: "profile", label: "Profile", icon: User, href: "/provider-dashboard?tab=profile" },
    { id: "certificates", label: "Certificates", icon: Award, href: "/provider-dashboard?tab=certificates" },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles, href: "/provider-ai-assistant" },
    { id: "support", label: "Support", icon: LifeBuoy, href: "/provider-dashboard?tab=support" },
    { id: "settings", label: "Settings", icon: Settings, isActive: true },
  ];

  const handleLogout = async () => {
    try {
      await api.logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-muted/10">
          <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 border-b flex items-center px-4 bg-white">
              <a href="/" className="flex items-center gap-2 font-bold text-xl w-full text-foreground overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/logo5.png" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-serif">
                  mywellbeingtoday
                </span>
              </a>
            </SidebarHeader>
            <SidebarContent className="bg-white" />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/10">
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 border-b flex items-center px-4 bg-white">
            <a href="/" className="flex items-center gap-2 font-bold text-xl w-full text-foreground overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/logo5.png" alt="Logo" className="h-8 w-8 object-contain" />
              <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-serif">
                mywellbeingtoday
              </span>
            </a>
          </SidebarHeader>
          <SidebarContent className="bg-white">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={item.isActive}
                        onClick={() => {
                          if (item.href) {
                            setLocation(item.href);
                          }
                        }}
                        tooltip={item.label}
                        size="lg"
                        className="transition-all duration-200"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className="p-2 bg-white dark:bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
            <div className="px-3 py-2 text-center border-t mt-2 group-data-[collapsible=icon]:hidden">
              <p className="text-[10px] text-muted-foreground">Built by Airfns Softwares</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-auto">
          <main className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <SidebarTrigger className="shrink-0" />
              <h1 className="text-lg sm:text-xl font-serif font-bold text-foreground truncate">Settings</h1>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-secondary/20 gap-1 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
                <TabsTrigger value="personal" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"><User className="h-3.5 w-3.5 sm:h-4 sm:w-4"/> Personal</TabsTrigger>
                <TabsTrigger value="business" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"><Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/> Business</TabsTrigger>
                <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"><Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4"/><span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Alerts</span></TabsTrigger>
                <TabsTrigger value="security" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"><Key className="h-3.5 w-3.5 sm:h-4 sm:w-4"/> Security</TabsTrigger>
              </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal and professional details.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {isUnlocked && remainingTime > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span>{formatRemainingTime(remainingTime)}</span>
                    </div>
                  )}
                  <Button
                    variant={isUnlocked ? "outline" : "secondary"}
                    size="sm"
                    onClick={handleLockClick}
                    className={`gap-2 ${isUnlocked ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
                  >
                    {isUnlocked ? (
                      <>
                        <LockOpen className="h-4 w-4" />
                        Lock Fields
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Unlock to Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    First Name
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input 
                    id="firstName" 
                    value={personalForm.firstName}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Name is managed in your user account</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    Last Name
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input 
                    id="lastName" 
                    value={personalForm.lastName}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input id="email" value={personalForm.email} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    Phone Number
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <PhoneInput 
                    value={personalForm.phone}
                    onChange={(value) => setPersonalForm(prev => ({ ...prev, phone: value }))}
                    disabled={!isUnlocked}
                    placeholder="7700 900000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Professional Title
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select 
                    value={personalForm.title}
                    onValueChange={(value) => setPersonalForm(prev => ({ ...prev, title: value }))}
                    disabled={!isUnlocked}
                  >
                    <SelectTrigger className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Select Title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Mx.">Mx.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    Professional Bio
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell patients about your experience and approach..."
                    className={`min-h-[100px] ${!isUnlocked ? "bg-muted cursor-not-allowed" : ""}`}
                    value={personalForm.bio}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isUnlocked}
                  />
                </div>
              </div>
              {!isUnlocked && (
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5" />
                  <span>Click "Unlock to Edit" above and enter your password to modify your information.</span>
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSavePersonal} disabled={updateProfileMutation.isPending || !isUnlocked}>
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Manage your practice and location details.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {isUnlocked && remainingTime > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span>{formatRemainingTime(remainingTime)}</span>
                    </div>
                  )}
                  <Button
                    variant={isUnlocked ? "outline" : "secondary"}
                    size="sm"
                    onClick={handleLockClick}
                    className={`gap-2 ${isUnlocked ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
                  >
                    {isUnlocked ? (
                      <>
                        <LockOpen className="h-4 w-4" />
                        Lock Fields
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Unlock to Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    Business/Practice Name
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="businessName" 
                    placeholder="Wellness Clinic"
                    value={businessForm.businessName}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, businessName: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="flex items-center gap-2">
                    Specialty
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select 
                    value={businessForm.specialty}
                    onValueChange={(value) => setBusinessForm(prev => ({ ...prev, specialty: value }))}
                    disabled={!isUnlocked}
                  >
                    <SelectTrigger className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Select Specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_practitioner">General Practitioner</SelectItem>
                      <SelectItem value="psychologist">Psychologist</SelectItem>
                      <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="nutritionist">Nutritionist</SelectItem>
                      <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                      <SelectItem value="counselor">Counselor</SelectItem>
                      <SelectItem value="life_coach">Life Coach</SelectItem>
                      <SelectItem value="wellness_coach">Wellness Coach</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street" className="flex items-center gap-2">
                    Street Address
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="street" 
                    placeholder="123 Health Street"
                    value={businessForm.street}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, street: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    City
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="city" 
                    placeholder="London"
                    value={businessForm.city}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="flex items-center gap-2">
                    Post Code
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="postcode" 
                    placeholder="W1A 1AA"
                    value={businessForm.postcode}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, postcode: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    Country
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Select 
                    value={businessForm.country}
                    onValueChange={(value) => setBusinessForm(prev => ({ ...prev, country: value }))}
                    disabled={!isUnlocked}
                  >
                    <SelectTrigger className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border-t pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    Consultation Types
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <p className="text-sm text-muted-foreground">Select the types of consultations you offer to patients.</p>
                </div>
                <div className="grid gap-3">
                  <div 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      businessForm.consultationTypes.includes('in_person') 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    } ${!isUnlocked ? 'opacity-60' : 'cursor-pointer hover:border-primary/50'}`}
                    onClick={() => isUnlocked && toggleConsultationType('in_person')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        businessForm.consultationTypes.includes('in_person') 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">In-Person</p>
                        <p className="text-sm text-muted-foreground">Face-to-face consultations at your practice</p>
                      </div>
                    </div>
                    <Switch 
                      checked={businessForm.consultationTypes.includes('in_person')}
                      onCheckedChange={() => toggleConsultationType('in_person')}
                      disabled={!isUnlocked}
                    />
                  </div>

                  <div 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      businessForm.consultationTypes.includes('video') 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    } ${!isUnlocked ? 'opacity-60' : 'cursor-pointer hover:border-primary/50'}`}
                    onClick={() => isUnlocked && toggleConsultationType('video')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        businessForm.consultationTypes.includes('video') 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Video className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Video Call</p>
                        <p className="text-sm text-muted-foreground">Virtual consultations via video conference</p>
                      </div>
                    </div>
                    <Switch 
                      checked={businessForm.consultationTypes.includes('video')}
                      onCheckedChange={() => toggleConsultationType('video')}
                      disabled={!isUnlocked}
                    />
                  </div>

                  <div 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      businessForm.consultationTypes.includes('phone') 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    } ${!isUnlocked ? 'opacity-60' : 'cursor-pointer hover:border-primary/50'}`}
                    onClick={() => isUnlocked && toggleConsultationType('phone')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        businessForm.consultationTypes.includes('phone') 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Phone Call</p>
                        <p className="text-sm text-muted-foreground">Consultations via telephone</p>
                      </div>
                    </div>
                    <Switch 
                      checked={businessForm.consultationTypes.includes('phone')}
                      onCheckedChange={() => toggleConsultationType('phone')}
                      disabled={!isUnlocked}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Accepting New Patients</Label>
                    <p className="text-sm text-muted-foreground">Show as available for new patient bookings.</p>
                  </div>
                  <Switch 
                    checked={businessForm.acceptingNewPatients}
                    onCheckedChange={(checked) => setBusinessForm(prev => ({ ...prev, acceptingNewPatients: checked }))}
                    disabled={!isUnlocked}
                  />
                </div>
              </div>

              {!isUnlocked && (
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5" />
                  <span>Click "Unlock to Edit" above and enter your password to modify your business information.</span>
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveBusiness} disabled={updateProfileMutation.isPending || !isUnlocked}>
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how and when we contact you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates and reminders via email.</p>
                </div>
                <Switch 
                  checked={notificationSettings.email}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email: checked }))}
                />
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get push notifications on your device.</p>
                </div>
                <Switch 
                  checked={notificationSettings.push}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push: checked }))}
                />
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates via text message.</p>
                </div>
                <Switch 
                  checked={notificationSettings.sms}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms: checked }))}
                />
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminders about upcoming appointments.</p>
                </div>
                <Switch 
                  checked={notificationSettings.appointmentReminders}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, appointmentReminders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Patient Messages</Label>
                  <p className="text-sm text-muted-foreground">Get notified when patients send you messages.</p>
                </div>
                <Switch 
                  checked={notificationSettings.patientMessages}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, patientMessages: checked }))}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long.</p>
              <div className="pt-4 flex justify-end">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) setVerifyPasswordInput('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to edit your information? Please enter your password to unlock the fields for 5 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPassword">Password</Label>
              <Input
                id="verifyPassword"
                type="password"
                placeholder="Enter your password"
                value={verifyPasswordInput}
                onChange={(e) => setVerifyPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPassword();
                  }
                }}
                disabled={isVerifyingPassword}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setVerifyPasswordInput('');
              }}
              disabled={isVerifyingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword || !verifyPasswordInput}
            >
              {isVerifyingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Unlock Fields
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
