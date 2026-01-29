import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Lock, LockOpen, CreditCard, Globe, Check, Shield, Heart, Upload, Loader2, Key, Clock, Headphones, MessageSquare, CircleCheck, AlertCircle, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UNLOCK_DURATION_MS = 5 * 60 * 1000;

const ContactSupportSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await api.getSupportTickets({ limit: 10 });
      if (response.success && response.data) {
        return response.data.tickets;
      }
      return [];
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const response = await api.createSupportTicket(subject, message);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSupportForm({ subject: '', message: '' });
      toast({
        title: "Ticket submitted",
        description: "Your support request has been submitted. We'll get back to you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit support ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmitTicket = () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate({
      subject: supportForm.subject.trim(),
      message: supportForm.message.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><MessageSquare className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CircleCheck className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription>Need help? Send us a message and we'll get back to you as soon as possible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticketSubject">Subject</Label>
            <Input
              id="ticketSubject"
              placeholder="Brief summary of your issue"
              value={supportForm.subject}
              onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticketMessage">Message</Label>
            <Textarea
              id="ticketMessage"
              placeholder="Describe your issue or question in detail..."
              className="min-h-[120px]"
              value={supportForm.message}
              onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">{supportForm.message.length}/5000</p>
          </div>
          <div className="pt-2 flex justify-end">
            <Button 
              onClick={handleSubmitTicket} 
              disabled={createTicketMutation.isPending || !supportForm.subject.trim() || !supportForm.message.trim()}
            >
              {createTicketMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Submit Ticket</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Your Support Tickets
          </CardTitle>
          <CardDescription>View the status of your previous support requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ticketsData && ticketsData.length > 0 ? (
            <div className="space-y-4">
              {ticketsData.map((ticket: any) => (
                <div key={ticket._id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm sm:text-base">{ticket.subject}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    {ticket.responses?.length > 0 && (
                      <span className="whitespace-nowrap">{ticket.responses.length} response(s)</span>
                    )}
                  </div>
                  {ticket.responses?.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Latest Response:</p>
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-sm">{ticket.responses[ticket.responses.length - 1].message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ticket.responses[ticket.responses.length - 1].timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets yet</p>
              <p className="text-sm">Submit a ticket above if you need help.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SubscriptionPlan = ({  
  title, 
  price, 
  currency, 
  features, 
  popular = false, 
  current = false 
}: { 
  title: string, 
  price: number, 
  currency: string, 
  features: string[], 
  popular?: boolean, 
  current?: boolean 
}) => {
  const formatPrice = (p: number, c: string) => {
    switch(c) {
      case "EUR": return `€${p}`;
      case "GBP": return `£${p}`;
      case "JPY": return `¥${p * 100}`;
      default: return `$${p}`;
    }
  };

  return (
    <Card className={`relative flex flex-col transition-transform ${popular ? 'border-primary shadow-lg sm:scale-105 sm:z-10' : 'border-border'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        <div className="mt-2">
          <span className="text-2xl sm:text-3xl font-bold">{formatPrice(price, currency)}</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        {current && <Badge variant="secondary" className="w-fit mt-2">Current Plan</Badge>}
      </CardHeader>
      <CardContent className="flex-1 space-y-3 sm:space-y-4 px-4 sm:px-6 py-0">
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-3 sm:pt-4 px-4 sm:px-6">
        <Button className="w-full" size="sm" variant={current ? "outline" : popular ? "default" : "secondary"}>
          {current ? "Manage Plan" : "Upgrade"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState("GBP");
  
  const [location] = useLocation();
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "profile";
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getProfile();
      if (response.success && response.data) {
        return response.data.user;
      }
      throw new Error('Failed to fetch profile');
    },
  });

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    street: '',
    city: '',
    postcode: '',
    country: 'uk',
    bio: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithProviders: false,
    anonymousAnalytics: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    timezone: 'Europe/London',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
          description: "You can now edit your personal information. Fields will auto-lock in 5 minutes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Incorrect password",
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
      setProfileForm({
        firstName: profileData.profile?.firstName || '',
        lastName: profileData.profile?.lastName || '',
        phone: profileData.profile?.phone || '',
        dateOfBirth: profileData.profile?.dateOfBirth ? new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : '',
        street: profileData.profile?.address?.street || '',
        city: profileData.profile?.address?.city || '',
        postcode: profileData.profile?.address?.postcode || '',
        country: profileData.profile?.address?.country || 'uk',
        bio: profileData.profile?.bio || '',
      });

      setNotificationSettings({
        email: profileData.settings?.notifications?.email ?? true,
        push: profileData.settings?.notifications?.push ?? true,
        sms: profileData.settings?.notifications?.sms ?? false,
      });

      setPrivacySettings({
        shareDataWithProviders: profileData.settings?.privacy?.shareDataWithProviders ?? false,
        anonymousAnalytics: profileData.settings?.privacy?.anonymousAnalytics ?? true,
      });

      setPreferences({
        language: profileData.settings?.preferences?.language || 'en',
        theme: profileData.settings?.preferences?.theme || 'light',
        timezone: profileData.settings?.preferences?.timezone || 'Europe/London',
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
    if (val === "profile") {
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
      const response = await api.updateProfile(data);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshUser();
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

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.updateSettings(data);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshUser();
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
      dateOfBirth: profileForm.dateOfBirth ? new Date(profileForm.dateOfBirth) : undefined,
      address: {
        street: profileForm.street,
        city: profileForm.city,
        postcode: profileForm.postcode,
        country: profileForm.country,
      },
      bio: profileForm.bio,
    });
  };

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({
      notifications: notificationSettings,
    });
  };

  const handleSavePrivacy = () => {
    updateSettingsMutation.mutate({
      privacy: privacySettings,
    });
  };

  const handleSavePreferences = () => {
    updateSettingsMutation.mutate({
      preferences: preferences,
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        setAvatarPreview(base64String);

        try {
          const response = await api.updateProfile({
            avatarUrl: base64String,
          });
          if (!response.success) throw new Error(response.message);
          
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          refreshUser();
          toast({
            title: "Photo uploaded",
            description: "Your profile photo has been updated successfully.",
          });
        } catch (error: any) {
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload photo",
            variant: "destructive",
          });
          setAvatarPreview(null);
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the image file",
          variant: "destructive",
        });
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingAvatar(false);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = profileData?.profile?.firstName || user?.profile?.firstName || '';
    const last = profileData?.profile?.lastName || user?.profile?.lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  };

  const calculateProfileCompletion = () => {
    if (!profileData) return 0;
    const fields = [
      profileData.profile?.firstName,
      profileData.profile?.lastName,
      profileData.profile?.phone,
      profileData.profile?.dateOfBirth,
      profileData.profile?.address?.street,
      profileData.profile?.address?.city,
      profileData.profile?.address?.postcode,
      profileData.profile?.bio,
      profileData.profile?.avatarUrl,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Settings & Account</h1>
          <p className="text-muted-foreground text-lg">Manage your profile, preferences, and security.</p>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-semibold flex items-center gap-2">
                 <Shield className="w-4 h-4 text-primary" /> Profile Strength
               </h3>
               <span className="text-sm font-medium text-primary">{calculateProfileCompletion()}% Complete</span>
            </div>
            <Progress value={calculateProfileCompletion()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete your profile to get better personalized recommendations.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-secondary/20 gap-2 mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4"/> Personal</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4"/> Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Lock className="h-4 w-4"/> Privacy</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Key className="h-4 w-4"/> Security</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2"><Globe className="h-4 w-4"/> Preferences</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-4 w-4"/> Subscription</TabsTrigger>
          <TabsTrigger value="support" className="gap-2"><Headphones className="h-4 w-4"/> Support</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your basic contact details.</CardDescription>
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
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarPreview || profileData?.profile?.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <Label 
                      htmlFor="picture" 
                      className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 ${isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" /> Upload New Photo
                        </>
                      )}
                      <Input 
                        id="picture" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        disabled={isUploadingAvatar}
                        onChange={handleAvatarUpload} 
                      />
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square JPG, PNG. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    First Name
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="firstName" 
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    Last Name
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="lastName" 
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <Input id="email" value={profileData?.email || ''} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    Phone Number
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="phone" 
                    placeholder="+44 7700 900000"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    Date of Birth
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="dob" 
                    type="date" 
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
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
                    value={profileForm.country}
                    onValueChange={(value) => setProfileForm(prev => ({ ...prev, country: value }))}
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
                <div className="space-y-2">
                   <Label htmlFor="street" className="flex items-center gap-2">
                     Street Address
                     {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                   </Label>
                   <Input 
                     id="street" 
                     placeholder="123 Wellness St"
                     value={profileForm.street}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, street: e.target.value }))}
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
                     value={profileForm.city}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
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
                     value={profileForm.postcode}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, postcode: e.target.value }))}
                     disabled={!isUnlocked}
                     className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                   />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    Bio
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us a bit about yourself..."
                    className={`min-h-[80px] ${!isUnlocked ? "bg-muted cursor-not-allowed" : ""}`}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isUnlocked}
                  />
                </div>
              </div>
              {!isUnlocked && (
                <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5" />
                  <span>Click "Unlock to Edit" above and enter your password to modify your personal information.</span>
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending || !isUnlocked}>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates via text message.</p>
                </div>
                <Switch 
                  checked={notificationSettings.sms}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms: checked }))}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data and privacy preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Share Data with Providers</Label>
                  <p className="text-sm text-muted-foreground">Allow healthcare providers to access your wellbeing data.</p>
                </div>
                <Switch 
                  checked={privacySettings.shareDataWithProviders}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, shareDataWithProviders: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Anonymous Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve our service with anonymous usage data.</p>
                </div>
                <Switch 
                  checked={privacySettings.anonymousAnalytics}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, anonymousAnalytics: checked }))}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSavePrivacy} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Privacy Settings
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

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Language</Label>
                  <Select 
                    value={preferences.language}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Theme</Label>
                  <Select 
                    value={preferences.theme}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Timezone</Label>
                  <Select 
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PST/PDT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button size="sm" onClick={handleSavePreferences} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 sm:space-y-6">
           <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 sm:gap-3">
              <Label className="text-muted-foreground text-sm">Currency:</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full sm:w-[120px]">
                   <Globe className="h-3 w-3 mr-2" />
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-end">
              <SubscriptionPlan 
                title="Free"
                price={0}
                currency={currency}
                features={[
                  "Daily Mood Tracking",
                  "Basic Activity Logging",
                  "Access to Directory",
                  "7-Day History"
                ]}
                current={profileData?.subscription?.plan === 'free' || !profileData?.subscription?.plan}
              />
              <SubscriptionPlan 
                title="Premium"
                price={9.99}
                currency={currency}
                features={[
                  "Unlimited History",
                  "Advanced Analytics",
                  "Practitioner Chat",
                  "Custom Reports",
                  "Priority Support"
                ]}
                popular={true}
                current={profileData?.subscription?.plan === 'premium'}
              />
               <SubscriptionPlan 
                title="Family"
                price={19.99}
                currency={currency}
                features={[
                  "Up to 5 Accounts",
                  "Family Dashboard",
                  "All Premium Features",
                  "Parental Controls"
                ]}
                current={profileData?.subscription?.plan === 'family'}
              />
           </div>

           <Card className="mt-6 sm:mt-8 bg-muted/30 border-dashed">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                   <div className="space-y-1">
                      <h4 className="font-medium text-sm sm:text-base">Need Enterprise Access?</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">For organizations, schools, and healthcare providers.</p>
                   </div>
                   <Button variant="outline" size="sm" className="w-full sm:w-auto">Contact Sales</Button>
                </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <ContactSupportSection />
        </TabsContent>

      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Legal
          </CardTitle>
          <CardDescription>Review our policies and terms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/privacy">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Privacy Policy</span>
              </div>
              <span className="text-muted-foreground">→</span>
            </div>
          </Link>
          <Link href="/terms">
            <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Terms of Service</span>
              </div>
              <span className="text-muted-foreground">→</span>
            </div>
          </Link>
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        setShowPasswordDialog(open);
        if (!open) setVerifyPasswordInput('');
      }}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lock className="h-4 sm:h-5 w-4 sm:w-5" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to edit your personal information? Please enter your password to unlock the fields for 5 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPassword" className="text-sm">Password</Label>
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
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setVerifyPasswordInput('');
              }}
              disabled={isVerifyingPassword}
              size="sm"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword || !verifyPasswordInput}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isVerifyingPassword ? (
                <>
                  <Loader2 className="mr-2 h-3 sm:h-4 w-3 sm:w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  Unlock Fields
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
