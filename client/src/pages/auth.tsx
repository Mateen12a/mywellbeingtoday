import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation, Redirect } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield, Stethoscope, Building, FileText, Loader2, Briefcase } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { validatePassword, validateEmail, validateName } from "@/lib/validation";
import api from "@/lib/api";

const AuthLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) => (
  <div className="flex items-center justify-center min-h-[80vh]">
    <Card className="w-full max-w-md shadow-2xl border-secondary/50 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-serif font-bold text-primary">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  </div>
);

export function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, user, isLoading: authLoading } = useAuth();

  // Show loading while checking auth state
  if (authLoading) {
    return <PageLoader />;
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to={getDashboardPath(user.role)} />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password, rememberMe);

      if (result.requiresVerification) {
        toast({
          title: "Verification required",
          description: result.isLoginVerification ? "A verification code has been sent to your email." : "Please verify your email to continue.",
        });
        const verifyUrl = `/auth/verify?email=${encodeURIComponent(email)}${result.isLoginVerification ? '&type=login' : ''}`;
        setLocation(verifyUrl);
        return;
      }
      
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });
        
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (user) {
          setLocation(getDashboardPath(user.role));
        } else {
          setLocation("/dashboard");
        }
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue your journey">
      <Tabs defaultValue="user" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="pl-9 rounded-xl" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Link href="/auth/recovery" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              className="pl-9 pr-9 rounded-xl" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={isLoading}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
            Remember me for 7 days
          </Label>
        </div>
        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
        </Button>
        <div className="text-center text-sm text-muted-foreground pt-2">
          Don't have an account? <Link href="/auth/register" className="text-primary font-bold hover:underline">Register</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const [, setLocation] = useLocation();
  const [userType, setUserType] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    occupation: "",
    occupationOther: "",
    organisation: "",
  });
  const { toast } = useToast();
  const { register, user, isLoading: authLoading } = useAuth();

  // Show loading while checking auth state
  if (authLoading) {
    return <PageLoader />;
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to={getDashboardPath(user.role)} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate first name
    const firstNameValidation = validateName(formData.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      toast({
        title: "Invalid first name",
        description: firstNameValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      toast({
        title: "Invalid last name",
        description: lastNameValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast({
        title: "Invalid email",
        description: emailValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate password with full policy
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password doesn't meet requirements",
        description: passwordValidation.errors[0],
        variant: "destructive",
      });
      return;
    }

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!formData.occupation) {
        toast({
          title: "Occupation required",
          description: "Please select your occupation",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.occupation === "other" && !formData.occupationOther.trim()) {
        toast({
          title: "Please specify occupation",
          description: "Please enter your occupation",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const result = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.occupation,
        formData.occupationOther,
        formData.organisation
      );
      
      if (result.requiresVerification) {
        toast({
          title: "Check your email",
          description: "We've sent a verification code to your email.",
        });
        setLocation(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setLocation("/dashboard");
      } else {
        toast({
          title: "Registration failed",
          description: result.message || "Could not create account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join mywellbeingtoday">
      <Tabs defaultValue="user" className="w-full mb-6" onValueChange={setUserType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="provider">Provider</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user">
          <p className="text-xs text-center text-muted-foreground mb-4">Create a personal account to track your wellbeing.</p>
        </TabsContent>
        <TabsContent value="provider" className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4">
           <div className="bg-primary/5 p-4 sm:p-6 rounded-xl border border-primary/10 text-center space-y-3 sm:space-y-4">
             <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
               <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
             <div>
               <h3 className="font-bold text-base sm:text-lg font-serif">Join our Provider Network</h3>
               <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                 Register your practice to reach users.
               </p>
             </div>
             <ul className="text-xs sm:text-sm text-left space-y-1.5 sm:space-y-2 py-2 px-2 sm:px-4">
               <li className="flex gap-2 items-center"><Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 shrink-0" /> Verified Profile Badge</li>
               <li className="flex gap-2 items-center"><FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 shrink-0" /> Issue Digital Certificates</li>
               <li className="flex gap-2 items-center"><Building className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 shrink-0" /> Manage Your Practice</li>
             </ul>
             <Link href="/auth/register-provider">
               <Button className="w-full text-sm sm:text-base" size="default">Continue to Provider Registration</Button>
             </Link>
           </div>
           <div className="text-center text-[10px] sm:text-xs text-muted-foreground">
             Registration requires professional license verification.
           </div>
        </TabsContent>
      </Tabs>

      {userType === "user" && (
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="firstName" 
                  placeholder="Jane" 
                  className="pl-9 rounded-xl" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  className="pl-9 rounded-xl" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="pl-9 rounded-xl" 
              value={formData.email}
              onChange={handleChange}
              required 
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select
              id="occupation"
              className="flex h-9 w-full rounded-xl border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.occupation}
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              <option value="">Select occupation...</option>
              <option value="student">Student</option>
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="retired">Retired</option>
              <option value="homemaker">Homemaker</option>
              <option value="carer">Carer</option>
              <option value="other">Other (please specify)</option>
            </select>
          </div>
        </div>

        {formData.occupation === "other" && (
          <div className="space-y-2">
            <Label htmlFor="occupationOther">Please specify <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="occupationOther"
                placeholder="Your occupation"
                className="pl-9 rounded-xl"
                value={formData.occupationOther}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="organisation">Organisation <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="organisation"
              placeholder="Your organisation"
              className="pl-9 rounded-xl"
              value={formData.organisation}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              className="pl-9 pr-9 rounded-xl" 
              value={formData.password}
              onChange={handleChange}
              required 
              disabled={isLoading}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              className="pl-9 pr-9 rounded-xl" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
              disabled={isLoading}
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
        
        <div className="flex items-start gap-2 pt-2">
          <input type="checkbox" id="terms" className="mt-1" required />
          <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
            I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </label>
        </div>

        <div className="flex items-start gap-2">
          <input type="checkbox" id="research-consent" className="mt-1" />
          <label htmlFor="research-consent" className="text-xs text-muted-foreground leading-tight">
            I consent to the use of my anonymized data for research and policy purposes only.
          </label>
        </div>

        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
        </Button>
      
        <div className="text-center text-sm text-muted-foreground pt-2">
          Already have an account? <Link href="/auth/login" className="text-primary font-bold hover:underline">Login</Link>
        </div>
      </form>
      )}
    </AuthLayout>
  );
}

export function Verify() {
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const isLoginVerification = params.get('type') === 'login';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the full 6-digit code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.verifyOTP(email, code);
      if (response.success && response.data) {
        api.setTokens(response.data.accessToken, response.data.refreshToken);
        api.setUser(response.data.user);
        toast({ title: isLoginVerification ? "Identity verified!" : "Email verified!", description: isLoginVerification ? "Logged in successfully" : "Welcome to mywellbeingtoday" });
        const role = response.data.user.role;
        window.location.href = (role === 'admin' || role === 'manager') ? '/admin/dashboard' : role === 'provider' ? '/provider-dashboard' : '/dashboard';
      } else {
        toast({ title: "Verification failed", description: response.message || "Invalid code", variant: "destructive" });
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message || "Invalid or expired code", variant: "destructive" });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendOTP(email);
      setResendCooldown(60);
      toast({ title: "Code sent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not resend code", variant: "destructive" });
    }
  };

  if (!email) {
    return <Redirect to="/auth/login" />;
  }

  return (
    <AuthLayout title={isLoginVerification ? "Verify Your Identity" : "Verify Email"} subtitle={`Enter the code sent to ${maskEmail(email)}`}>
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                className="w-11 h-14 text-center text-xl font-bold rounded-lg"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                inputMode="numeric"
                autoFocus={index === 0}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Didn't receive code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
            ) : (
              <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">Resend</button>
            )}
          </p>
        </div>
        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify & Continue"}
        </Button>
        <div className="text-center">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function Reverify() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the full 6-digit code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.reverifyOTP(email, code);
      if (response.success && response.data) {
        api.setTokens(response.data.accessToken, response.data.refreshToken);
        api.setUser(response.data.user);
        toast({ title: "Verified!", description: "Session verified successfully" });
        const dashboardPath = response.data.user.role === 'provider' ? '/provider-dashboard' : '/dashboard';
        setLocation(dashboardPath);
      } else {
        toast({ title: "Verification failed", description: response.message || "Invalid code", variant: "destructive" });
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message || "Invalid or expired code", variant: "destructive" });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.resendOTP(email);
      setResendCooldown(60);
      toast({ title: "Code sent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not resend code", variant: "destructive" });
    }
  };

  if (!email) {
    return <Redirect to="/auth/login" />;
  }

  return (
    <AuthLayout title="Security Check" subtitle={`For your security, please enter the verification code sent to ${maskEmail(email)}`}>
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">Your session needs re-verification for security purposes.</p>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                className="w-11 h-14 text-center text-xl font-bold rounded-lg"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                inputMode="numeric"
                autoFocus={index === 0}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Didn't receive code?{' '}
            {resendCooldown > 0 ? (
              <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
            ) : (
              <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">Resend</button>
            )}
          </p>
        </div>
        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify & Continue"}
        </Button>
        <div className="text-center">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Sign in with different account
            </Button>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function Recovery() {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [, setLocation] = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 2))}@${domain}`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.forgotPassword(email);
      setStep('otp');
      setResendCooldown(60);
      toast({
        title: "Check your email",
        description: "If an account exists, we've sent a verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the full 6-digit code", variant: "destructive" });
      return;
    }
    setStep('password');
  };

  const handleResend = async () => {
    try {
      await api.forgotPassword(email);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      toast({ title: "Code sent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not resend code", variant: "destructive" });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password doesn't meet requirements",
        description: passwordValidation.errors[0],
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const code = otp.join('');
      const response = await api.resetPasswordWithOTP(email, code, newPassword);
      if (response.success) {
        toast({
          title: "Password reset successful",
          description: "You can now sign in with your new password.",
        });
        setLocation('/auth/login');
      }
    } catch (error: any) {
      if (error.message?.includes('expired') || error.message?.includes('Invalid verification')) {
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      }
      toast({
        title: "Reset failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepSubtitles = {
    email: "Enter your email to receive a verification code",
    otp: `Enter the code sent to ${maskEmail(email)}`,
    password: "Create your new password",
  };

  return (
    <AuthLayout title="Reset Password" subtitle={stepSubtitles[step]}>
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className="pl-9 rounded-xl" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Code"}
          </Button>
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div className="space-y-4 text-center">
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  className="w-11 h-14 text-center text-xl font-bold rounded-lg"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={isLoading}
                  inputMode="numeric"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Didn't receive code?{' '}
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Resend in {resendCooldown}s</span>
              ) : (
                <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">Resend</button>
              )}
            </p>
          </div>
          <Button type="submit" className="w-full rounded-xl" size="lg" disabled={otp.join('').length !== 6}>
            Continue
          </Button>
          <div className="text-center">
            <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); }} className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline mr-1 h-3 w-3" /> Use different email
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                className="pl-9 pr-9 rounded-xl"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="pl-9 pr-9 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Reset Password"}
          </Button>
          <div className="text-center">
            <button type="button" onClick={() => setStep('otp')} className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline mr-1 h-3 w-3" /> Back to verification
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
