import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation, Redirect } from "wouter";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Shield, Stethoscope, Building, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { invalidateAllQueries } from "@/lib/queryClient";
import { PageLoader } from "@/components/ui/page-loader";

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
  const [userType, setUserType] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await login(email, password);
      
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });
        
        // Get the updated user from localStorage (set by AuthContext)
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
      <Tabs defaultValue="user" className="w-full mb-6" onValueChange={setUserType}>
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
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
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
    <AuthLayout title="Create Account" subtitle="Join MyWellbeingToday">
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
  const [, setLocation] = useLocation();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <AuthLayout title="Verify Email" subtitle="Enter the code sent to your email">
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Input key={i} className="w-10 h-12 text-center text-lg font-bold rounded-lg" maxLength={1} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Didn't receive code? <button type="button" className="text-primary hover:underline">Resend</button></p>
        </div>
        <Button type="submit" className="w-full rounded-xl" size="lg">Verify & Continue</Button>
      </form>
    </AuthLayout>
  );
}

export function Recovery() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.forgotPassword(email);
      setSent(true);
      toast({
        title: "Check your email",
        description: "If an account exists, we've sent recovery instructions.",
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

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive recovery instructions">
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Link"}
          </Button>
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-muted-foreground">
            If an account exists for that email, we've sent instructions to reset your password.
          </p>
          <Link href="/auth/login">
            <Button className="w-full rounded-xl">Return to Login</Button>
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
