import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Lock, LockOpen, Globe, Key, Clock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLayout from "@/components/admin-layout";

const UNLOCK_DURATION_MS = 5 * 60 * 1000;

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = api.getUser();
  
  const [location] = useLocation();
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "personal";
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
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    adminAlerts: true,
    systemUpdates: true,
    securityAlerts: true,
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
      });

      setNotificationSettings({
        email: profileData.settings?.notifications?.email ?? true,
        push: profileData.settings?.notifications?.push ?? true,
        sms: profileData.settings?.notifications?.sms ?? false,
        adminAlerts: profileData.settings?.notifications?.adminAlerts ?? true,
        systemUpdates: profileData.settings?.notifications?.systemUpdates ?? true,
        securityAlerts: profileData.settings?.notifications?.securityAlerts ?? true,
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
    });
  };

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({
      notifications: notificationSettings,
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

  if (isLoading) {
    return (
      <AdminLayout title="Admin Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Admin Settings">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-secondary/20 gap-2 mb-6">
            <TabsTrigger value="personal" className="gap-2"><User className="h-4 w-4"/> Personal</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4"/> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Key className="h-4 w-4"/> Security</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="border border-border/60 shadow-sm">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    Phone Number
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isUnlocked}
                    className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={!isUnlocked || updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Communication Channels</h4>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.email}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.push}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.sms}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms: checked }))}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h4 className="text-sm font-medium">Admin Notifications</h4>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">Admin Alerts</Label>
                      <p className="text-sm text-muted-foreground">Important admin activity notifications</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.adminAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, adminAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">System Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about system updates and maintenance</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemUpdates: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Critical security notifications</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border border-border/60 shadow-sm">
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
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long.</p>
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
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              Enter your password to unlock personal information fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPassword">Password</Label>
              <Input 
                id="verifyPassword"
                type="password"
                value={verifyPasswordInput}
                onChange={(e) => setVerifyPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyPassword} disabled={isVerifyingPassword}>
              {isVerifyingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                </>
              ) : (
                "Unlock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
