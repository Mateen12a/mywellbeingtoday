import { useState, useEffect } from "react";
import { Link, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, AlertCircle, Shield, Headphones, Phone, User } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { validatePassword, validateName } from "@/lib/validation";
import api from "@/lib/api";

export default function AdminRegister() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const token = new URLSearchParams(window.location.search).get('token');
  const isInviteFlow = !!token;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ firstName: string; email: string; role: string; isExistingUser?: boolean; displayName?: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(isInviteFlow);

  const [formData, setFormData] = useState({
    lastName: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    email: "",
    role: "admin",
    secretKey: "",
    phone: "",
    displayName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isInviteFlow || !token) return;
    setInviteLoading(true);
    api.getAdminInvite(token)
      .then((res) => {
        if (res.success && res.data) {
          setInviteInfo(res.data);
          setFormData((prev) => ({
            ...prev,
            firstName: res.data!.firstName,
            email: res.data!.email,
            role: res.data!.role,
            displayName: res.data!.displayName || res.data!.firstName,
          } as any));
        } else {
          setInviteError("This invitation link is invalid or has expired.");
        }
      })
      .catch(() => {
        setInviteError("This invitation link is invalid or has expired.");
      })
      .finally(() => setInviteLoading(false));
  }, [token]);

  if (authLoading) return <PageLoader />;
  if (user) return <Redirect to={getDashboardPath(user.role)} />;

  const validateInviteForm = () => {
    const newErrors: Record<string, string> = {};
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error || "Last name is required";
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.errors[0];
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExistingUserForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.displayName.trim()) newErrors.displayName = "Display name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDirectForm = () => {
    const newErrors: Record<string, string> = {};
    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error || "First name is required";
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error || "Last name is required";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email is required";
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.errors[0];
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.secretKey.trim()) newErrors.secretKey = "Secret key is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInviteForm()) return;
    setIsLoading(true);
    try {
      const response = await api.acceptAdminInvite({
        token: token!,
        lastName: formData.lastName,
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      });
      if (response.success) {
        setIsSuccess(true);
        toast({ title: "Account Setup Complete", description: "Your account is ready. You can now log in." });
      }
    } catch (error: any) {
      toast({ title: "Setup Failed", description: error.message || "Failed to complete account setup.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingUserAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExistingUserForm()) return;
    setIsLoading(true);
    try {
      const response = await api.acceptAdminInvite({
        token: token!,
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
      });
      if (response.success) {
        setIsSuccess(true);
        toast({ title: "Invitation Accepted", description: "Your account has been upgraded. You can now log in to the admin panel." });
      }
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Failed to accept invitation.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'an Administrator';
    if (role === 'support') return 'a Support Staff member';
    return 'a Manager';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'support') return <Headphones className="w-8 h-8" />;
    if (role === 'admin') return <ShieldAlert className="w-8 h-8" />;
    return <Shield className="w-8 h-8" />;
  };

  const getRoleColor = (role: string) => {
    if (role === 'support') return { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    return { bg: 'bg-slate-900', light: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200' };
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDirectForm()) return;
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register-admin', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        secretKey: formData.secretKey,
      });
      if (response.success) {
        setIsSuccess(true);
        toast({ title: "Registration Successful", description: "Your admin account is ready." });
      }
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Failed to create admin account.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-green-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              {isInviteFlow ? "Account Setup Complete" : "Registration Successful"}
            </CardTitle>
            <CardDescription className="text-green-700">
              {isInviteFlow
                ? "Your administrator account is ready. You can now log in."
                : "Welcome! Your admin account is ready to use."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-4">
            {inviteInfo?.email && (
              <p className="text-slate-600 text-sm">
                Account configured for <strong>{inviteInfo.email}</strong>.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Link href="/auth/admin-login">
              <Button>Go to Admin Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isInviteFlow) {
    if (inviteLoading) return <PageLoader />;

    if (inviteError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-md border-red-200 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <CardTitle className="text-xl text-red-800">Invalid Invitation</CardTitle>
              <CardDescription className="text-red-700">{inviteError}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Link href="/auth/admin-login">
                <Button variant="outline">Go to Admin Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      );
    }

    const roleColor = getRoleColor(inviteInfo?.role || 'manager');

    if (inviteInfo?.isExistingUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${roleColor.bg} text-white rounded-lg`}>
                {getRoleIcon(inviteInfo.role)}
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900">Admin Panel Invitation</h1>
                <p className="text-slate-600 text-sm">Complete your admin profile to continue</p>
              </div>
            </div>

            <Card className={`border-2 ${roleColor.border} shadow-xl`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Welcome, <span className={roleColor.text}>{inviteInfo.firstName}</span>
                </CardTitle>
                <CardDescription>
                  You've been invited as <strong>{getRoleLabel(inviteInfo.role)}</strong>. Confirm your details below to accept.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="existing-user-form" onSubmit={handleExistingUserAccept} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={inviteInfo.email} disabled className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Display Name</span>
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="How your name appears in the admin panel"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className={errors.displayName ? "border-red-500" : ""}
                    />
                    {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone Number <span className="text-muted-foreground font-normal">(optional)</span></span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7700 900000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">
                      Your existing account login and password remain unchanged. You'll use the same credentials to access the admin panel.
                    </p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  form="existing-user-form"
                  className={`w-full ${inviteInfo.role === 'support' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  ) : (
                    "Accept & Complete Setup"
                  )}
                </Button>
                <Link href="/auth/admin-login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground w-full">
                    Cancel
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${roleColor.bg} text-white rounded-lg`}>
              {getRoleIcon(inviteInfo?.role || 'manager')}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">Complete Your Account</h1>
              <p className="text-slate-600 text-sm">You've been invited as {getRoleLabel(inviteInfo?.role || 'manager')}</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle>Set Up Your Account</CardTitle>
              <CardDescription>
                Welcome, <strong>{inviteInfo?.firstName}</strong>! Please complete your account setup below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={inviteInfo?.email || ''} disabled className="bg-slate-50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone Number <span className="text-muted-foreground font-normal">(optional)</span></span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7700 900000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting Up...</> : "Complete Setup"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/auth/admin-login">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 -ml-2 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Admin Registration</h1>
            <p className="text-slate-600 text-sm">Create a new administrator account</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle>Create Admin Account</CardTitle>
            <CardDescription>This page requires a valid secret key to create admin accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Secret Key
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter the admin registration secret key"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className={errors.secretKey ? "border-red-500" : ""}
                />
                {errors.secretKey && <p className="text-xs text-red-500">{errors.secretKey}</p>}
                <p className="text-[11px] text-muted-foreground">
                  This key is required to create admin accounts. Contact a Super Admin if you don't have it.
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Create Admin Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
