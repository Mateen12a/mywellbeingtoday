import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Star, Phone, Navigation, Clock, ShieldCheck, HeartPulse, Stethoscope, BriefcaseMedical, Ambulance, AlertCircle, Calendar as CalendarIcon, MessageSquare, CheckCircle2, X, Maximize2, Info, ChevronRight, FileText, Loader2, User, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const mapIcon = createCustomIcon('#0f172a');

const SPECIALTIES = [
  { id: "all", label: "All Providers" },
  { id: "general_practitioner", label: "General Practitioner" },
  { id: "mental_health", label: "Mental Health" },
  { id: "nutrition", label: "Nutrition" },
  { id: "physical_therapy", label: "Physical Therapy" },
  { id: "counseling", label: "Counseling" },
  { id: "social_work", label: "Social Work" },
  { id: "occupational_therapy", label: "Occupational Therapy" },
  { id: "psychiatry", label: "Psychiatry" },
  { id: "emergency_services", label: "Emergency Services" },
  { id: "other", label: "Other" },
];

const formatSpecialty = (specialty: string) => {
  return specialty
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getProviderName = (provider: any) => {
  const user = provider.userId;
  if (!user?.profile) return 'Provider';
  const title = provider.professionalInfo?.title || '';
  const firstName = user.profile.firstName || '';
  const lastName = user.profile.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (title && !fullName.toLowerCase().startsWith(title.toLowerCase())) {
    return `${title} ${fullName}`.trim() || 'Provider';
  }
  return fullName || 'Provider';
};

const getProviderInitials = (provider: any) => {
  const user = provider.userId;
  if (!user?.profile) return 'P';
  const first = user.profile.firstName?.[0] || '';
  const last = user.profile.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'P';
};

interface BookingModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal = ({ provider, isOpen, onClose }: BookingModalProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    reason: "",
    type: "in_person" as "in_person" | "video" | "phone",
  });
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: pendingData, isLoading: isCheckingPending, refetch: refetchPending } = useQuery({
    queryKey: ["pending-appointment", provider._id],
    queryFn: async () => {
      const response = await api.checkPendingWithProvider(provider._id);
      return response.data;
    },
    enabled: isOpen && !!user && !!provider._id,
  });

  const hasPendingAppointment = pendingData?.hasPending || false;

  const handleUseWellbeingReport = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to access your wellbeing reports.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingReport(true);
    try {
      const response = await api.getLatestReport();
      if (response.success && response.data?.report) {
        const report = response.data.report;
        let summary = "";
        
        if (report.aiAnalysis?.summary) {
          summary = report.aiAnalysis.summary;
        } else if (report.aiAnalysis?.recommendations?.length > 0) {
          const recTexts = report.aiAnalysis.recommendations.slice(0, 2).map((rec: any) => 
            typeof rec === 'string' ? rec : rec.title || rec.description || rec.recommendation || ''
          ).filter(Boolean);
          summary = `Based on recent health data: ${recTexts.join('. ')}`;
        } else if (report.overallScore) {
          summary = `Recent wellbeing score: ${report.overallScore}/100. Seeking consultation for overall health improvement.`;
        }
        
        if (summary) {
          setFormData({ ...formData, reason: summary });
          toast({
            title: "Health Summary Loaded",
            description: "Your recent wellbeing data has been added to the reason field.",
          });
        } else {
          toast({
            title: "No Summary Available",
            description: "Your latest report doesn't have a summary. Please enter your reason manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Reports Found",
          description: "You don't have any wellbeing reports yet. Please enter your reason manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Could Not Load Report",
        description: error.message || "Unable to fetch your wellbeing report. Please enter your reason manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.createAppointment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["pending-appointment", provider._id] });
      refetchPending();
      setStep(4);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Could not book appointment. Please try again.",
        variant: "destructive",
      });
      setStep(2);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!date || !selectedTime) {
        toast({
          title: "Select Date & Time",
          description: "Please select both a date and time for your appointment.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in to book an appointment.",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(date!);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      bookingMutation.mutate({
        providerId: provider._id,
        dateTime: appointmentDate.toISOString(),
        type: formData.type,
        reason: formData.reason,
        duration: provider.availability?.appointmentDuration || 30,
      });
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedTime("");
    setFormData({ reason: "", type: "in_person" });
    onClose();
  };

  const providerName = getProviderName(provider);
  const availableTimes = ["09:00", "10:00", "11:30", "14:00", "15:30", "16:15"];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] z-[60] gap-0 p-0 overflow-hidden rounded-xl top-[5%] translate-y-0 md:top-[50%] md:-translate-y-1/2 max-h-[90dvh] md:max-h-none flex flex-col">
        <div className="bg-primary/5 p-4 md:p-6 border-b shrink-0">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-serif">Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule with <span className="font-semibold text-foreground">{providerName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mt-4">
             {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", step >= i ? "bg-primary" : "bg-primary/20")} />
             ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
        {isCheckingPending && step === 1 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking booking status...</p>
          </div>
        )}

        {hasPendingAppointment && step === 1 && !isCheckingPending && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="h-20 w-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-100/50">
              <Clock className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-foreground">Awaiting Confirmation</h3>
              <p className="text-muted-foreground max-w-sm">
                You already have a pending appointment with <span className="font-medium text-foreground">{providerName}</span>. 
                Please wait for the provider to confirm your booking before scheduling another.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2 max-w-sm">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Once the provider accepts or cancels your current appointment, you'll be able to book again.</p>
            </div>
          </div>
        )}

        {step === 1 && !hasPendingAppointment && !isCheckingPending && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="font-medium">1. Select Date</Label>
              <div className="border rounded-xl p-2 bg-card shadow-sm">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md w-full"
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  classNames={{
                    head_cell: "text-muted-foreground font-normal text-[0.8rem]",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                 <Label className="font-medium">2. Select Time</Label>
                 <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map(time => (
                      <Button 
                        key={time} 
                        variant={selectedTime === time ? "default" : "outline"} 
                        className={cn(
                          "justify-start font-normal",
                          selectedTime === time ? "" : "hover:bg-primary/5 hover:border-primary/30"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        {time}
                      </Button>
                    ))}
                 </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">3. Consultation Type</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="z-[70]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {provider.availability?.consultationTypes?.includes('video') && (
                      <SelectItem value="video">Video Call</SelectItem>
                    )}
                    {provider.availability?.consultationTypes?.includes('phone') && (
                      <SelectItem value="phone">Phone Call</SelectItem>
                    )}
                    {provider.availability?.consultationTypes?.includes('in_person') && (
                      <SelectItem value="in_person">In Person</SelectItem>
                    )}
                    {!provider.availability?.consultationTypes?.length && (
                      <>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-secondary/20 p-3 rounded-lg text-xs text-muted-foreground">
                 <p className="flex items-center gap-1.5 font-medium text-foreground mb-1"><Info className="w-3 h-3" /> Note</p>
                 Times are in your local timezone.
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-4">
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <Label>Primary Reason for Visit</Label>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     className="text-xs gap-1.5 h-7"
                     onClick={handleUseWellbeingReport}
                     disabled={isLoadingReport}
                   >
                     {isLoadingReport ? (
                       <>
                         <Loader2 className="w-3 h-3 animate-spin" />
                         Loading...
                       </>
                     ) : (
                       <>
                         <FileText className="w-3 h-3" />
                         Use my recent health summary
                       </>
                     )}
                   </Button>
                 </div>
                 <Textarea 
                   placeholder="Briefly describe your symptoms or reason for booking..." 
                   value={formData.reason}
                   onChange={(e) => setFormData({...formData, reason: e.target.value})}
                   className="min-h-[100px] resize-none"
                 />
              </div>
              
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Your medical data is encrypted and shared only with {providerName}'s office for this appointment.</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 bg-background rounded-full"></div>
              </div>
            </div>
            <p className="text-muted-foreground font-medium">Confirming availability with provider...</p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100/50">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-foreground">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your appointment with <span className="font-medium text-foreground">{providerName}</span> is confirmed for:
              </p>
              <div className="bg-secondary/30 py-2 px-4 rounded-full inline-flex items-center gap-2 mt-2 font-medium">
                <CalendarIcon className="w-4 h-4" /> 
                {date?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}
              </div>
            </div>
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 pt-4">
               <Button variant="outline" onClick={reset}>Close</Button>
               <Button onClick={reset}>View Appointments</Button>
            </div>
          </div>
        )}
        </div>
        
        {step < 3 && !isCheckingPending && (
        <DialogFooter className="p-6 pt-0 sm:justify-between shrink-0 bg-background/80 backdrop-blur-md sticky bottom-0 border-t z-10">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {hasPendingAppointment && step === 1 ? (
            <Button variant="outline" onClick={onClose} className="min-w-[140px]">
              Close
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-[140px]">
              {step === 1 ? "Next Details" : "Confirm Booking"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface MessageModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
}

const MessageModal = ({ provider, isOpen, onClose }: MessageModalProps) => {
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const providerName = getProviderName(provider);

  const handleSend = () => {
    setSent(true);
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${providerName}.`,
    });
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[60] overflow-visible">
        {!sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Message {providerName}</DialogTitle>
              <DialogDescription>
                Send a secure message. Average response time: 2 hours.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Select>
                  <SelectTrigger className="z-[70]">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="inquiry">General Inquiry</SelectItem>
                    <SelectItem value="followup">Follow-up Question</SelectItem>
                    <SelectItem value="prescription">Prescription Refill</SelectItem>
                    <SelectItem value="appointment">Appointment Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea 
                  placeholder="Type your message here..." 
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSend} className="gap-2">
                <MessageSquare className="w-4 h-4" /> Send Message
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Message Sent</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {providerName} will receive your message shortly.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ProviderCardProps {
  provider: any;
  onLocationClick?: (providerId: string) => void;
}

const ProviderCard = ({ provider, onLocationClick }: ProviderCardProps) => {
  const [showBooking, setShowBooking] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const name = getProviderName(provider);
  const initials = getProviderInitials(provider);
  const avatarUrl = provider.userId?.profile?.avatarUrl;
  const specialties = provider.professionalInfo?.specialties || [];
  const rating = provider.ratings?.average || 0;
  const ratingCount = provider.ratings?.count || 0;
  const practice = provider.practice || {};
  const address = practice.address ? 
    `${practice.address.street}, ${practice.address.city}`.trim() : 
    practice.city || '';
  const phone = practice.phone || '';
  const isAvailable = provider.availability?.acceptingNewPatients !== false;
  const qualifications = provider.professionalInfo?.qualifications || [];
  const services = provider.services || [];

  return (
    <>
      <Card className="hover:shadow-md transition-all group overflow-hidden">
        <CardContent className="p-0 flex">
          <div className="w-24 bg-secondary/30 flex items-center justify-center shrink-0">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <div className="p-4 flex-1 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold font-serif text-lg text-black">{name}</h3>
                {qualifications.length > 0 && (
                  <p className="text-xs text-muted-foreground">{qualifications.slice(0, 2).join(', ')}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {specialties.slice(0, 2).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {formatSpecialty(s)}
                    </Badge>
                  ))}
                </div>
              </div>
              {isAvailable && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 font-bold border-green-200">
                  Available
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                 {rating > 0 && (
                   <div className="flex items-center gap-1 text-amber-600">
                     <Star className="w-3 h-3 fill-current" />
                     <span className="font-bold">{rating.toFixed(1)}</span>
                     {ratingCount > 0 && <span className="text-muted-foreground text-xs">({ratingCount})</span>}
                   </div>
                 )}
                 {practice.name && (
                   <span className="text-xs text-muted-foreground truncate">{practice.name}</span>
                 )}
               </div>
               
               {phone && (
                 <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mt-1">
                   <Phone className="w-3 h-3" />
                   <span>{phone}</span>
                 </div>
               )}
            </div>

            {address && (
              <p 
                className={cn(
                  "text-xs font-medium text-gray-600 truncate max-w-[200px] flex items-center gap-1",
                  onLocationClick && provider.practice?.location?.coordinates?.length === 2 && "cursor-pointer hover:text-primary transition-colors"
                )}
                onClick={() => {
                  if (onLocationClick && provider.practice?.location?.coordinates?.length === 2) {
                    onLocationClick(provider._id);
                  }
                }}
              >
                <MapPin className="w-3 h-3" /> {address}
              </p>
            )}

            {services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 2).map((s: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {s.name}
                  </Badge>
                ))}
                {services.length > 2 && (
                  <Badge variant="outline" className="text-[10px]">+{services.length - 2} more</Badge>
                )}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button size="sm" className="flex-1 font-bold shadow-sm" onClick={() => setShowBooking(true)}>Book</Button>
              <Button size="sm" variant="outline" className="flex-1 font-bold border-gray-300 text-gray-800 hover:text-black hover:bg-gray-100" onClick={() => setShowMessage(true)}>Message</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingModal 
        provider={provider} 
        isOpen={showBooking} 
        onClose={() => setShowBooking(false)} 
      />
      
      <MessageModal 
        provider={provider}
        isOpen={showMessage} 
        onClose={() => setShowMessage(false)} 
      />
    </>
  );
};

const ProviderCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0 flex">
      <div className="w-24 bg-secondary/30 flex items-center justify-center shrink-0">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
      <div className="p-4 flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-32" />
        <div className="pt-2 flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface AIProviderCardProps {
  provider: any;
}

const AIProviderCard = ({ provider }: AIProviderCardProps) => {
  const [showBooking, setShowBooking] = useState(false);
  
  const name = getProviderName(provider);
  const initials = getProviderInitials(provider);
  const avatarUrl = provider.userId?.profile?.avatarUrl;
  const specialties = provider.professionalInfo?.specialties || [];
  const rating = provider.ratings?.average || 0;
  const practice = provider.practice || {};
  const isAvailable = provider.availability?.acceptingNewPatients !== false;

  return (
    <>
      <Card className="min-w-[280px] max-w-[280px] shrink-0 hover:shadow-md transition-all overflow-hidden border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 shrink-0">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold font-serif text-sm text-black truncate">{name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {specialties.slice(0, 1).map((s: string) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">
                    {formatSpecialty(s)}
                  </Badge>
                ))}
              </div>
            </div>
            {isAvailable && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px] shrink-0">
                Available
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {rating > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-bold">{rating.toFixed(1)}</span>
              </div>
            )}
            {practice.city && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {practice.city}
              </span>
            )}
          </div>

          <Button size="sm" className="w-full font-bold" onClick={() => setShowBooking(true)}>
            Book Appointment
          </Button>
        </CardContent>
      </Card>

      <BookingModal 
        provider={provider} 
        isOpen={showBooking} 
        onClose={() => setShowBooking(false)} 
      />
    </>
  );
};

const AIProviderCardSkeleton = () => (
  <Card className="min-w-[280px] max-w-[280px] shrink-0 overflow-hidden">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

const getUrgencyColor = (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getUrgencyDotColor = (urgency: string) => {
  switch (urgency?.toLowerCase()) {
    case 'high':
      return 'bg-red-500';
    case 'moderate':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

interface MapControllerProps {
  selectedProviderId: string | null;
  providers: any[];
  markerRefs: React.MutableRefObject<{ [key: string]: L.Marker | null }>;
}

const MapController = ({ selectedProviderId, providers, markerRefs }: MapControllerProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedProviderId) {
      const provider = providers.find(p => p._id === selectedProviderId);
      if (provider?.practice?.location?.coordinates?.length === 2) {
        const [lng, lat] = provider.practice.location.coordinates;
        map.setView([lat, lng], 15, { animate: true });
        
        setTimeout(() => {
          const marker = markerRefs.current[selectedProviderId];
          if (marker) {
            marker.openPopup();
          }
        }, 300);
      }
    }
  }, [selectedProviderId, providers, map, markerRefs]);
  
  return null;
};

interface ExpandedMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: any[];
  initialSelectedProviderId?: string | null;
}

const ExpandedMapModal = ({ isOpen, onClose, providers, initialSelectedProviderId }: ExpandedMapModalProps) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  
  useEffect(() => {
    if (isOpen && initialSelectedProviderId) {
      setSelectedProviderId(initialSelectedProviderId);
    }
  }, [isOpen, initialSelectedProviderId]);
  
  const selectedProvider = providers.find(p => p._id === selectedProviderId);
  const providersWithLocation = providers.filter(p => 
    p.practice?.location?.coordinates?.length === 2
  );

  const getInitialCenter = (): [number, number] => {
    if (initialSelectedProviderId) {
      const provider = providers.find(p => p._id === initialSelectedProviderId);
      if (provider?.practice?.location?.coordinates?.length === 2) {
        return [provider.practice.location.coordinates[1], provider.practice.location.coordinates[0]];
      }
    }
    if (providersWithLocation.length > 0 && providersWithLocation[0].practice?.location?.coordinates) {
      return [providersWithLocation[0].practice.location.coordinates[1], providersWithLocation[0].practice.location.coordinates[0]];
    }
    return [51.505, -0.09];
  };

  const defaultCenter = getInitialCenter();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] w-full h-[100dvh] md:max-w-[90vw] md:h-[80vh] p-0 overflow-hidden flex flex-col gap-0 z-[50] rounded-none md:rounded-xl">
        <div className="p-4 border-b bg-background flex justify-between items-center z-10 shrink-0 shadow-sm">
          <div>
            <DialogTitle className="flex items-center gap-2 text-black font-bold">
              <Navigation className="w-5 h-5 text-primary" /> Interactive Directory Map
            </DialogTitle>
            <DialogDescription className="hidden md:block text-gray-600 font-medium">
              {providersWithLocation.length > 0 
                ? "Click on pins to view provider details and book appointments."
                : "No providers with location data available."
              }
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 text-black hover:bg-gray-200">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>
        
        <div className="relative w-full h-full bg-secondary/10 overflow-hidden isolate">
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
             <TileLayer
               attribution='&copy; <a href="/">mywellbeingtoday</a>'
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
             />
             <MapController 
               selectedProviderId={selectedProviderId} 
               providers={providers} 
               markerRefs={markerRefs}
             />
             {providersWithLocation.map((provider) => (
               <Marker 
                  key={provider._id} 
                  position={[provider.practice.location.coordinates[1], provider.practice.location.coordinates[0]]}
                  icon={mapIcon}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[provider._id] = ref;
                    }
                  }}
                  eventHandlers={{
                    click: () => setSelectedProviderId(provider._id),
                  }}
               >
                 <Popup>
                   <div className="text-sm font-medium">{getProviderName(provider)}</div>
                   <div className="text-xs text-muted-foreground">
                     {provider.professionalInfo?.specialties?.[0] ? 
                       formatSpecialty(provider.professionalInfo.specialties[0]) : 
                       'Healthcare Provider'}
                   </div>
                 </Popup>
               </Marker>
             ))}
          </MapContainer>

          {selectedProvider && (
            <div className="absolute bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:w-80 animate-in slide-in-from-bottom-10 fade-in duration-300 z-[400] pointer-events-auto p-4 md:p-0 bg-gradient-to-t from-black/20 to-transparent md:bg-none">
              <Card className="shadow-2xl border-primary/20 backdrop-blur-md bg-white/95 max-h-[50vh] overflow-y-auto border-t md:border rounded-t-xl md:rounded-xl">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-serif font-bold text-black">{getProviderName(selectedProvider)}</CardTitle>
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedProvider.professionalInfo?.specialties?.[0] ? 
                        formatSpecialty(selectedProvider.professionalInfo.specialties[0]) : 
                        'Healthcare Provider'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-black hover:bg-gray-100 rounded-full" onClick={() => setSelectedProviderId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pb-2 space-y-3">
                   <div className="flex items-center gap-4 text-sm font-medium text-gray-800">
                     {selectedProvider.ratings?.average > 0 && (
                       <div className="flex items-center gap-1 text-amber-600">
                         <Star className="w-3 h-3 fill-current" />
                         <span className="font-bold">{selectedProvider.ratings.average.toFixed(1)}</span>
                       </div>
                     )}
                     {selectedProvider.availability?.acceptingNewPatients !== false ? (
                       <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0 h-5 font-bold">Available</Badge>
                     ) : (
                       <Badge variant="outline" className="bg-secondary text-gray-600 border-gray-200 text-xs px-2 py-0 h-5 font-bold">Busy</Badge>
                     )}
                   </div>
                   {selectedProvider.practice?.address && (
                     <div className="flex items-start gap-2 text-xs font-medium text-gray-700 bg-secondary/30 p-2 rounded-md">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-black" />
                        <span>{selectedProvider.practice.address.street}, {selectedProvider.practice.address.city}</span>
                     </div>
                   )}
                   {selectedProvider.practice?.phone && (
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600 px-2">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${selectedProvider.practice.phone}`} className="hover:underline">{selectedProvider.practice.phone}</a>
                      </div>
                   )}
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <Button className="w-full font-bold shadow-md" onClick={() => setShowBooking(true)}>
                    Book Appointment
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
      
      {selectedProvider && (
        <BookingModal 
          provider={selectedProvider} 
          isOpen={showBooking} 
          onClose={() => setShowBooking(false)} 
        />
      )}
    </Dialog>
  );
};

export default function Directory() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [city, setCity] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<"ai" | "browse">("ai");
  const [selectedProviderForMap, setSelectedProviderForMap] = useState<string | null>(null);
  const { user } = useAuth();

  const handleProviderLocationClick = (providerId: string) => {
    setSelectedProviderForMap(providerId);
    setIsMapOpen(true);
  };

  const { data: aiSuggestionsData, isLoading: aiLoading, isError: aiError } = useQuery({
    queryKey: ["ai-suggestions"],
    queryFn: async () => {
      const response = await api.getAISuggestedProviders();
      return response.data;
    },
    enabled: !!user && !aiDismissed,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const { data: providersData, isLoading, isError, error } = useQuery({
    queryKey: ["providers", specialty, city],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (specialty && specialty !== "all") {
        params.specialty = specialty;
      }
      if (city) {
        params.city = city;
      }
      const response = await api.getProviders(params);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const providers = providersData?.providers || [];

  const filteredProviders = useMemo(() => {
    if (!search) return providers;
    const searchLower = search.toLowerCase();
    return providers.filter((p: any) => {
      const name = getProviderName(p).toLowerCase();
      const specialties = (p.professionalInfo?.specialties || []).join(' ').toLowerCase();
      const practiceName = (p.practice?.name || '').toLowerCase();
      const address = p.practice?.address ? 
        `${p.practice.address.street || ''} ${p.practice.address.city || ''} ${p.practice.address.state || ''} ${p.practice.address.postcode || ''}`.toLowerCase() : '';
      const practiceCity = (p.practice?.city || '').toLowerCase();
      return name.includes(searchLower) || 
             specialties.includes(searchLower) || 
             practiceName.includes(searchLower) ||
             address.includes(searchLower) ||
             practiceCity.includes(searchLower);
    });
  }, [providers, search]);

  const MapPreview = () => {
    const providersWithLocation = providers.filter((p: any) => 
      p.practice?.location?.coordinates?.length === 2
    );
    const defaultCenter: [number, number] = providersWithLocation.length > 0 && 
      providersWithLocation[0].practice?.location?.coordinates ?
      [providersWithLocation[0].practice.location.coordinates[1], providersWithLocation[0].practice.location.coordinates[0]] :
      [51.505, -0.09];

    return (
      <div className="w-full h-full relative isolate overflow-hidden">
        <MapContainer 
          center={defaultCenter}
          zoom={13} 
          scrollWheelZoom={false} 
          zoomControl={false}
          dragging={false}
          className="w-full h-full z-0 absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
           <TileLayer
             attribution='&copy; <a href="/">mywellbeingtoday</a>'
             url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
           />
           {providersWithLocation.map((provider: any) => (
             <Marker 
                key={provider._id} 
                position={[provider.practice.location.coordinates[1], provider.practice.location.coordinates[0]]}
                icon={mapIcon}
             />
           ))}
        </MapContainer>
      </div>
    );
  };

  const aiSuggestion = aiSuggestionsData?.aiSuggestion;
  const aiProviders = aiSuggestionsData?.providers || [];
  const wellbeingSnapshot = aiSuggestionsData?.userWellbeingSnapshot;
  const showAiSection = user && !aiDismissed && (aiLoading || aiSuggestion || aiProviders.length > 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="space-y-3 md:space-y-4 text-center max-w-2xl mx-auto px-2">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-black">Find Help Near You</h1>
        <p className="text-gray-800 font-medium text-base md:text-lg">
          Connect with certified health professionals, emergency services, and support networks.
        </p>
      </div>

      {user && !aiDismissed && (
        <div className="flex items-center justify-center gap-4 px-2">
          <div className="flex items-center gap-2 bg-secondary/30 rounded-full p-1">
            <Button
              variant={viewMode === "ai" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full gap-2 font-bold",
                viewMode === "ai" ? "" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("ai")}
            >
              <Sparkles className="w-4 h-4" />
              AI Suggestions
            </Button>
            <Button
              variant={viewMode === "browse" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full gap-2 font-bold",
                viewMode === "browse" ? "" : "text-muted-foreground"
              )}
              onClick={() => setViewMode("browse")}
            >
              <Search className="w-4 h-4" />
              Browse All
            </Button>
          </div>
        </div>
      )}

      {showAiSection && viewMode === "ai" && (
        <Collapsible open={aiExpanded} onOpenChange={setAiExpanded}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                      AI Recommended Providers
                      {aiSuggestion?.urgency && (
                        <Badge className={cn("text-xs font-bold", getUrgencyColor(aiSuggestion.urgency))}>
                          <span className={cn("w-2 h-2 rounded-full mr-1.5", getUrgencyDotColor(aiSuggestion.urgency))} />
                          {aiSuggestion.urgency.charAt(0).toUpperCase() + aiSuggestion.urgency.slice(1)} Priority
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Based on your wellbeing data
                      {wellbeingSnapshot?.overallScore && (
                        <span className="ml-1 text-primary font-medium">
                          (Score: {wellbeingSnapshot.overallScore}/100)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      {aiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setAiDismissed(true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="pt-2 space-y-4">
                {aiLoading ? (
                  <>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex gap-4 overflow-hidden pb-2">
                      <AIProviderCardSkeleton />
                      <AIProviderCardSkeleton />
                      <AIProviderCardSkeleton />
                    </div>
                  </>
                ) : aiError ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg text-red-800">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                      Unable to load AI suggestions. You can still browse providers manually.
                    </p>
                  </div>
                ) : (
                  <>
                    {aiSuggestion?.personalizedMessage && (
                      <div className="bg-white/60 rounded-lg p-3 border border-primary/10">
                        <p className="text-sm font-medium text-gray-800">
                          {aiSuggestion.personalizedMessage}
                        </p>
                      </div>
                    )}

                    {aiSuggestion?.reasoning && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <p>{aiSuggestion.reasoning}</p>
                      </div>
                    )}

                    {aiSuggestion?.suggestedSpecialties && aiSuggestion.suggestedSpecialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-medium text-gray-600">Suggested specialties:</span>
                        {aiSuggestion.suggestedSpecialties.map((spec: string) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {formatSpecialty(spec)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {aiProviders.length > 0 ? (
                      <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-4 pb-4">
                          {aiProviders.map((provider: any) => (
                            <AIProviderCard key={provider._id} provider={provider} />
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No matching providers found for your profile.</p>
                        <Button 
                          variant="link" 
                          className="mt-2 text-primary"
                          onClick={() => setViewMode("browse")}
                        >
                          Browse all providers instead
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="order-2 md:order-1 md:col-span-1 space-y-6">
           <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-black">Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Name, specialty..." 
                  className="pl-9 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-black">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="Enter City" 
                    className="pl-9 font-medium" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-black">Specialty</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
           </Card>

           <Card className="bg-primary/5 border-primary/20 hidden md:block">
             <CardContent className="p-4 flex flex-col items-center text-center gap-2">
               <ShieldCheck className="w-8 h-8 text-primary" />
               <p className="font-bold text-sm text-black">Verified Practitioners</p>
               <p className="text-xs text-gray-600 font-medium">All providers are vetted and licensed.</p>
             </CardContent>
           </Card>
        </div>

        <div className="order-1 md:order-2 md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-secondary/10 h-48 md:h-64 relative flex items-center justify-center border-b group cursor-pointer w-full"
              onClick={() => setIsMapOpen(true)}
            >
              {providers.length > 0 ? <MapPreview /> : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Navigation className="w-12 h-12" />
                  <p className="text-sm font-medium">No provider locations available</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors z-10" />

              <div className="absolute top-4 right-4 bg-white/95 p-2 rounded-lg shadow-sm z-20 border border-gray-200">
                <Maximize2 className="w-5 h-5 text-black" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center space-y-2 z-20 p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 animate-in fade-in zoom-in duration-300 w-[90%] md:w-auto">
                <div className="flex items-center gap-2 justify-center text-black font-bold text-lg">
                  <Navigation className="w-5 h-5" /> Interactive Map
                </div>
                <p className="text-xs font-semibold text-gray-700">Click to expand & view providers</p>
              </div>
            </div>
          </Card>

          <Tabs value={specialty} className="w-full" onValueChange={setSpecialty}>
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-transparent gap-2 mb-4 no-scrollbar">
              {SPECIALTIES.slice(0, 5).map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className={cn(
                    "rounded-full border px-4 py-2 font-bold whitespace-nowrap transition-colors",
                    "text-gray-700 bg-white data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="space-y-4">
              {isLoading ? (
                <>
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                  <ProviderCardSkeleton />
                </>
              ) : isError ? (
                <Card className="p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <div>
                      <h3 className="font-bold text-lg">Error Loading Providers</h3>
                      <p className="text-muted-foreground text-sm">
                        {(error as any)?.message || "Could not load providers. Please try again."}
                      </p>
                    </div>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                  </div>
                </Card>
              ) : filteredProviders.length === 0 ? (
                <Card className="p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <h3 className="font-bold text-lg">No Providers Found</h3>
                      <p className="text-muted-foreground text-sm">
                        {search || city || specialty !== "all" 
                          ? "Try adjusting your search filters."
                          : "No providers are currently available."}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                filteredProviders.map((provider: any) => (
                  <ProviderCard 
                    key={provider._id} 
                    provider={provider} 
                    onLocationClick={handleProviderLocationClick}
                  />
                ))
              )}
            </div>
          </Tabs>
        </div>
      </div>

      <ExpandedMapModal 
        isOpen={isMapOpen} 
        onClose={() => {
          setIsMapOpen(false);
          setSelectedProviderForMap(null);
        }} 
        providers={providers}
        initialSelectedProviderId={selectedProviderForMap}
      />
    </div>
  );
}
