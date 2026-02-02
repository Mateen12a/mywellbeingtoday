import { useState } from "react";
import { formatLabel } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarDays,
  History,
  ChevronRight
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek } from "date-fns";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Appointment {
  _id: string;
  dateTime: string;
  endTime: string;
  duration: number;
  type: 'video' | 'phone' | 'in_person';
  reason?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  providerId: {
    _id: string;
    userId: {
      profile: {
        firstName: string;
        lastName: string;
      };
      email: string;
    };
    professionalInfo?: {
      title?: string;
      specialties?: string[];
    };
    practice?: {
      name?: string;
      address?: {
        street?: string;
        city?: string;
        postcode?: string;
      };
      phone?: string;
    };
  };
  notes?: string;
  createdAt: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Confirmed</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Cancelled</Badge>;
    case 'no_show':
      return <Badge className="bg-red-100 text-red-700 border-red-200">No Show</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'phone':
      return <Phone className="h-4 w-4" />;
    case 'in_person':
      return <MapPin className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'video':
      return 'Video Call';
    case 'phone':
      return 'Phone Call';
    case 'in_person':
      return 'In Person';
    default:
      return type;
  }
};

const getDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'EEE, MMM d');
};

function AppointmentCard({ 
  appointment, 
  onCancel,
  isPast: isHistorical = false
}: { 
  appointment: Appointment; 
  onCancel: (id: string) => void;
  isPast?: boolean;
}) {
  const provider = appointment.providerId;
  const providerName = provider?.userId?.profile 
    ? `${provider.professionalInfo?.title || ''} ${provider.userId.profile.firstName} ${provider.userId.profile.lastName}`.trim()
    : 'Healthcare Provider';
  
  const practiceAddress = provider?.practice?.address
    ? `${provider.practice.address.street || ''}, ${provider.practice.address.city || ''} ${provider.practice.address.postcode || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
    : '';

  const canCancel = !isHistorical && ['pending', 'confirmed'].includes(appointment.status);
  const appointmentDate = new Date(appointment.dateTime);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {provider?.userId?.profile?.firstName?.[0] || 'P'}
                {provider?.userId?.profile?.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-base">{providerName}</h3>
                {getStatusBadge(appointment.status)}
              </div>
              
              {(provider?.professionalInfo?.specialties?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground mb-2">
                  {provider?.professionalInfo?.specialties?.slice(0, 2).map((s: string) => formatLabel(s)).join(', ')}
                </p>
              )}
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium text-foreground">{getDateLabel(appointment.dateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{format(appointmentDate, 'h:mm a')} ({appointment.duration} min)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getTypeIcon(appointment.type)}
                  <span>{getTypeLabel(appointment.type)}</span>
                </div>
              </div>
              
              {appointment.type === 'in_person' && practiceAddress && (
                <div className="flex items-start gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{practiceAddress}</span>
                </div>
              )}
              
              {appointment.reason && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  <span className="font-medium">Reason:</span> {appointment.reason}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex sm:flex-col gap-2 sm:items-end">
            {canCancel && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => onCancel(appointment._id)}
              >
                Cancel
              </Button>
            )}
            <Link href={`/directory`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View Provider <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Appointments() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: async () => {
      const response = await api.get<{ appointments: Appointment[]; pagination: any }>('/appointments?upcoming=true&limit=50');
      return response.data;
    },
  });

  const { data: pastData, isLoading: pastLoading } = useQuery({
    queryKey: ['appointments', 'past'],
    queryFn: async () => {
      const response = await api.get<{ appointments: Appointment[]; pagination: any }>('/appointments');
      return response.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return api.post(`/appointments/${appointmentId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'past'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointment'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel",
        description: error.message || "Could not cancel the appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelClick = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
      cancelMutation.mutate(appointmentToCancel);
    }
    setCancelDialogOpen(false);
    setAppointmentToCancel(null);
  };

  const upcomingAppointments = upcomingData?.appointments || [];
  const allAppointments = pastData?.appointments || [];
  const pastAppointments = allAppointments.filter(apt => 
    isPast(new Date(apt.dateTime)) || ['completed', 'cancelled', 'no_show'].includes(apt.status)
  );

  const isLoading = activeTab === 'upcoming' ? upcomingLoading : pastLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Appointments</h1>
        <p className="text-muted-foreground">
          View and manage your healthcare appointments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {upcomingAppointments.filter(a => a.status === 'confirmed').length}
              </p>
              <p className="text-sm text-green-600">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {upcomingAppointments.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-sm text-amber-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {pastAppointments.filter(a => a.status === 'completed').length}
              </p>
              <p className="text-sm text-blue-600">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any scheduled appointments at the moment.
                </p>
                <Link href="/directory">
                  <Button>Find a Provider</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment._id} 
                  appointment={appointment}
                  onCancel={handleCancelClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past appointments</h3>
                <p className="text-muted-foreground">
                  Your appointment history will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment._id} 
                  appointment={appointment}
                  onCancel={handleCancelClick}
                  isPast
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
