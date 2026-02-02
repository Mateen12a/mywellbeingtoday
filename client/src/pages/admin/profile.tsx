import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Calendar, Upload, Loader2, Clock, CheckCircle, User, Phone, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = api.getUser();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [title, setTitle] = useState(currentUser?.profile?.title || '');

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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.updateProfile(data);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refreshUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = () => {
    const first = profileData?.profile?.firstName || currentUser?.profile?.firstName || '';
    const last = profileData?.profile?.lastName || currentUser?.profile?.lastName || '';
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'A';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      default:
        return role?.replace('_', ' ') || 'Unknown';
    }
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

  if (isLoading) {
    return (
      <AdminLayout title="Admin Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Profile">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Your Profile</h2>
          <p className="text-muted-foreground">
            View and manage your admin account information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-border/60 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your admin account details and photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarPreview || profileData?.profile?.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
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
                      className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit ${isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <p className="font-medium text-lg">
                    {profileData?.profile?.firstName || currentUser?.profile?.firstName || ''} {profileData?.profile?.lastName || currentUser?.profile?.lastName || ''}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Title
                  </Label>
                  <p className="font-medium text-lg">
                    {profileData?.profile?.title || currentUser?.profile?.title || 'Administrator'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <p className="font-medium">{profileData?.email || currentUser?.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <p className="font-medium">
                    {profileData?.profile?.phone || currentUser?.profile?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Role & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <div>
                    <Badge 
                      variant={getRoleBadgeVariant(currentUser?.role || 'admin')} 
                      className="text-sm px-3 py-1"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleDisplayName(currentUser?.role || 'admin')}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Account Status</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
                {currentUser?.emailVerified && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Verification</Label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser?.createdAt && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </Label>
                    <p className="font-medium">{formatDate(currentUser.createdAt)}</p>
                  </div>
                )}
                {currentUser?.lastLogin && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Last Login</Label>
                    <p className="font-medium">{formatDateTime(currentUser.lastLogin)}</p>
                  </div>
                )}
                {!currentUser?.lastLogin && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Last Login</Label>
                    <p className="text-sm text-muted-foreground">Current session</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {currentUser?.role === 'admin' && (
              <Card className="border border-primary/20 shadow-sm bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="h-5 w-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Full system access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      User management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Provider verification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      System configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Audit log access
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {currentUser?.role === 'manager' && (
              <Card className="border border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      User management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Provider verification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      View audit logs
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
