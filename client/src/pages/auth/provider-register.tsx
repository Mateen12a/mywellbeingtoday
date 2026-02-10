import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation, Redirect } from "wouter";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, Building, User, Mail, Lock, MapPin, Loader2, Eye, EyeOff, X, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/page-loader";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { validatePassword, validateEmail, validateName, validatePhone } from "@/lib/validation";
import api from "@/lib/api";
import { invalidateAllQueries } from "@/lib/queryClient";

export default function ProviderRegister() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [formData, setFormData] = useState({
    providerType: "individual",
    specialty: "",
    customSpecialty: "",
    organizationName: "",
    professionalTitle: "",
    customTitle: "",
    firstName: "",
    lastName: "",
    email: "",
    experience: "",
    address: "",
    city: "",
    postCode: "",
    countryCode: "uk",
    phone: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
    services: {
      certificates: false,
      prescriptions: false,
      telehealth: false,
      emergency: false,
    },
  });

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Show loading while checking auth state
  if (authLoading) {
    return <PageLoader />;
  }
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to={getDashboardPath(user.role)} />;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (service: keyof typeof formData.services, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: { ...prev.services, [service]: checked },
    }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, JPG, or PNG file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.specialty) {
        toast({ title: "Missing field", description: "Please select a specialty", variant: "destructive" });
        return false;
      }
      if (formData.specialty === "other" && !formData.customSpecialty.trim()) {
        toast({ title: "Missing field", description: "Please specify your specialty", variant: "destructive" });
        return false;
      }
      if (!formData.organizationName.trim()) {
        toast({ title: "Missing field", description: "Please enter organization name", variant: "destructive" });
        return false;
      }
      if (!formData.professionalTitle) {
        toast({ title: "Missing field", description: "Please select a professional title", variant: "destructive" });
        return false;
      }
      if (formData.professionalTitle === "other" && !formData.customTitle.trim()) {
        toast({ title: "Missing field", description: "Please specify your professional title", variant: "destructive" });
        return false;
      }
      // Validate first name with proper regex
      const firstNameValidation = validateName(formData.firstName, 'First name');
      if (!firstNameValidation.isValid) {
        toast({ title: "Invalid first name", description: firstNameValidation.error, variant: "destructive" });
        return false;
      }
      // Validate last name with proper regex
      const lastNameValidation = validateName(formData.lastName, 'Last name');
      if (!lastNameValidation.isValid) {
        toast({ title: "Invalid last name", description: lastNameValidation.error, variant: "destructive" });
        return false;
      }
      // Validate email with proper regex
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        toast({ title: "Invalid email", description: emailValidation.error, variant: "destructive" });
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.address.trim()) {
        toast({ title: "Missing field", description: "Please enter your address", variant: "destructive" });
        return false;
      }
      if (!formData.city.trim()) {
        toast({ title: "Missing field", description: "Please enter your city", variant: "destructive" });
        return false;
      }
      if (!formData.postCode.trim()) {
        toast({ title: "Missing field", description: "Please enter your post code", variant: "destructive" });
        return false;
      }
      // Validate phone number with proper regex
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        toast({ title: "Invalid phone number", description: phoneValidation.error, variant: "destructive" });
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.licenseNumber.trim()) {
        toast({ title: "Missing field", description: "Please enter your license number", variant: "destructive" });
        return false;
      }
      // Validate password with full policy
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        toast({ title: "Password doesn't meet requirements", description: passwordValidation.errors[0], variant: "destructive" });
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);

    try {
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();

      const specialty = formData.specialty === "other" ? formData.customSpecialty : formData.specialty;
      const professionalTitle = formData.professionalTitle === "other" ? formData.customTitle : formData.professionalTitle;
      
      const verificationDocuments = [];
      if (file) {
        const base64Data = await convertFileToBase64(file);
        verificationDocuments.push({
          type: 'license',
          name: file.name,
          url: base64Data,
          uploadedAt: new Date().toISOString()
        });
      }

      const selectedServices = Object.keys(formData.services).filter(
        key => formData.services[key as keyof typeof formData.services]
      );

      const providerData = {
        professionalInfo: {
          title: professionalTitle,
          qualifications: [specialty],
          registrationNumber: formData.licenseNumber,
          specialties: [specialty],
          yearsOfExperience: formData.experience,
          bio: '',
          languages: ['English']
        },
        practice: {
          name: formData.organizationName,
          address: {
            street: formData.address,
            city: formData.city,
            postcode: formData.postCode,
            country: 'UK'
          },
          phone: formData.phone,
          email: formData.email
        },
        availability: {
          acceptingNewPatients: true,
          consultationTypes: selectedServices.includes('telehealth') ? ['in_person', 'video'] : ['in_person']
        },
        verification: {
          documents: verificationDocuments
        }
      };

      const response = await api.registerProvider(
        formData.email,
        formData.password,
        firstName,
        lastName,
        providerData
      );

      if (response.success && response.data?.requiresVerification) {
        toast({
          title: "Check your email",
          description: "We've sent a verification code to your email.",
        });
        setLocation(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      if (response.success && response.data?.user) {
        invalidateAllQueries();
        setShowSuccessDialog(true);
      } else {
        toast({
          title: "Registration failed",
          description: response.message || "Could not create account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-secondary/30">
      <Card className="w-full max-w-sm sm:max-w-lg md:max-w-2xl shadow-xl border-primary/10 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-2 text-center border-b bg-white/50 backdrop-blur-sm pb-4 sm:pb-6">
          <div className="flex justify-between items-center w-full gap-2">
             <Link href="/auth/register">
               <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></Button>
             </Link>
             <div className="flex gap-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-2 w-2 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-secondary'}`} />
               ))}
             </div>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-primary leading-tight">Provider Registration</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Join our network of verified healthcare professionals</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <form onSubmit={handleRegister} className="space-y-6">
            {step === 1 && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Provider Type <span className="text-red-500">*</span></Label>
                    <Select value={formData.providerType} onValueChange={(value) => handleInputChange("providerType", value)}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Professional</SelectItem>
                        <SelectItem value="organization">Organization / Clinic</SelectItem>
                        <SelectItem value="ambulance">Ambulance Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Specialty / Category <span className="text-red-500">*</span></Label>
                    <Select value={formData.specialty} onValueChange={(value) => handleInputChange("specialty", value)}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_practitioner">General Practitioner</SelectItem>
                        <SelectItem value="mental_health">Mental Health</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                        <SelectItem value="physical_therapy">Physical Therapy</SelectItem>
                        <SelectItem value="counseling">Counseling</SelectItem>
                        <SelectItem value="psychiatry">Psychiatry</SelectItem>
                        <SelectItem value="emergency_services">Emergency / Ambulance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.specialty === "other" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-xs sm:text-sm">Specify Your Specialty <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="e.g. Physiotherapy, Nutrition, etc." 
                      className="text-xs sm:text-sm"
                      value={formData.customSpecialty}
                      onChange={(e) => handleInputChange("customSpecialty", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Practice / Organization Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      placeholder="e.g. City Wellness Center" 
                      className="pl-9 text-xs sm:text-sm" 
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   <div className="space-y-2">
                     <Label className="text-xs sm:text-sm">Professional Title <span className="text-red-500">*</span></Label>
                     <Select value={formData.professionalTitle} onValueChange={(value) => handleInputChange("professionalTitle", value)}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Title" /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Dr.">Dr.</SelectItem>
                           <SelectItem value="Mr.">Mr.</SelectItem>
                           <SelectItem value="Mrs.">Mrs.</SelectItem>
                           <SelectItem value="Ms.">Ms.</SelectItem>
                           <SelectItem value="Miss.">Miss.</SelectItem>
                           <SelectItem value="Prof.">Prof.</SelectItem>
                           <SelectItem value="Nurse">Nurse</SelectItem>
                           <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs sm:text-sm">First Name <span className="text-red-500">*</span></Label>
                     <div className="relative">
                       <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                       <Input 
                         placeholder="John" 
                         className="pl-9 text-xs sm:text-sm" 
                         value={formData.firstName}
                         onChange={(e) => handleInputChange("firstName", e.target.value)}
                       />
                     </div>
                   </div>
                   <div className="space-y-2 sm:col-span-2">
                     <Label className="text-xs sm:text-sm">Last Name <span className="text-red-500">*</span></Label>
                     <Input 
                       placeholder="Doe" 
                       className="text-xs sm:text-sm"
                       value={formData.lastName}
                       onChange={(e) => handleInputChange("lastName", e.target.value)}
                     />
                   </div>
                </div>

                {formData.professionalTitle === "other" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Label className="text-xs sm:text-sm">Specify Your Title <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="e.g. Prof., Sir, etc." 
                      className="text-xs sm:text-sm"
                      value={formData.customTitle}
                      onChange={(e) => handleInputChange("customTitle", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      type="email" 
                      placeholder="doctor@clinic.com" 
                      className="pl-9 text-xs sm:text-sm" 
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Years of Experience</Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                    <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10-15">10-15 years</SelectItem>
                      <SelectItem value="15-20">15-20 years</SelectItem>
                      <SelectItem value="20+">20+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Physical Address (Clinic/Practice) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      placeholder="123 Health Street, Medical District" 
                      className="pl-9 text-xs sm:text-sm" 
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">City <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="London" 
                      className="text-xs sm:text-sm"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Post Code <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="SW1A 1AA" 
                      className="text-xs sm:text-sm"
                      value={formData.postCode}
                      onChange={(e) => handleInputChange("postCode", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Contact Number <span className="text-red-500">*</span></Label>
                  <PhoneInput 
                    value={formData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    placeholder="2079460000"
                    defaultCountryCode="GB"
                  />
                </div>

                <div className="space-y-3 sm:space-y-4 pt-2">
                   <h3 className="font-semibold text-xs sm:text-sm">Services Provided <span className="text-red-500">*</span></h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 border p-2 sm:p-3 rounded-lg min-h-10">
                        <Checkbox 
                          id="certificates" 
                          checked={formData.services.certificates}
                          onCheckedChange={(checked) => handleServiceChange("certificates", checked as boolean)}
                        />
                        <label htmlFor="certificates" className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Medical Certificates
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2 sm:p-3 rounded-lg min-h-10">
                        <Checkbox 
                          id="prescriptions" 
                          checked={formData.services.prescriptions}
                          onCheckedChange={(checked) => handleServiceChange("prescriptions", checked as boolean)}
                        />
                        <label htmlFor="prescriptions" className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Prescriptions
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2 sm:p-3 rounded-lg min-h-10">
                        <Checkbox 
                          id="telehealth" 
                          checked={formData.services.telehealth}
                          onCheckedChange={(checked) => handleServiceChange("telehealth", checked as boolean)}
                        />
                        <label htmlFor="telehealth" className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Telehealth / Video
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 border p-2 sm:p-3 rounded-lg min-h-10">
                        <Checkbox 
                          id="emergency" 
                          checked={formData.services.emergency}
                          onCheckedChange={(checked) => handleServiceChange("emergency", checked as boolean)}
                        />
                        <label htmlFor="emergency" className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Emergency Response
                        </label>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-amber-800">
                  <p className="font-bold mb-1">Verification Required</p>
                  <p>To ensure safety, we manually verify all provider licenses before activation. Your profile will be "Pending" until approved.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Professional License Number <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="GMC / GDC / NMC Number" 
                    className="text-xs sm:text-sm"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Upload License / Certificate Document <span className="text-red-500">*</span></Label>
                  <div 
                    className={`border-2 border-dashed transition-colors rounded-lg p-4 sm:p-6 text-center cursor-pointer bg-muted/10 ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary'
                    }`}
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">Click to upload or drag and drop</span>
                      <span className="text-xs text-muted-foreground">PDF, JPG or PNG (Max 5MB)</span>
                    </div>
                    <input 
                      ref={fileInputRef}
                      id="certificate-upload"
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} 
                      data-testid="input-file-upload"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-green-600 bg-green-50 p-2 sm:p-3 rounded-lg mt-2">
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        data-testid="button-remove-file"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-xs sm:text-sm">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Create a secure password" 
                      className="pl-9 pr-9 text-xs sm:text-sm" 
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      className="pl-9 pr-9 text-xs sm:text-sm" 
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3 pt-2">
              {step > 1 && (
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                  className="gap-1 text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 flex-shrink-0" /> <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1 text-xs sm:text-sm" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" /> <span className="hidden sm:inline ml-2">Submitting...</span><span className="sm:hidden">...</span></>
                ) : (
                  step < 3 ? "Continue" : "Submit"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)]">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <DialogTitle className="text-base sm:text-lg md:text-xl font-semibold leading-tight" data-testid="text-success-title">
              Registration Submitted!
            </DialogTitle>
            <DialogDescription className="text-center space-y-2 sm:space-y-3 pt-3">
              <p className="text-xs sm:text-sm" data-testid="text-success-message">
                Thank you for registering as a healthcare provider.
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-verification-info">
                Our team will review your credentials and documents. This process typically takes 24-48 hours.
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-email-note">
                You'll receive an email once your account has been verified.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex justify-center">
            <Button 
              onClick={() => setLocation("/auth/login")} 
              className="w-full sm:w-auto text-xs sm:text-sm"
              data-testid="button-continue-to-login"
            >
              Continue to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
