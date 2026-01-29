import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  FileText,
  Search,
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PractitionerDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Practitioner Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your appointments and patient records.</p>
        </div>
        <div className="flex gap-2">
           <Button>
            <CalendarIcon className="mr-2 h-4 w-4" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Appointments", value: "8", icon: CalendarIcon, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Total Patients", value: "124", icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { title: "Pending Reviews", value: "3", icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Unread Messages", value: "5", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`h-12 w-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
           <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="patients">Patient List</TabsTrigger>
              </TabsList>

              <TabsContent value="appointments" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                     <CardTitle>Upcoming Schedule</CardTitle>
                     <CardDescription>You have 8 appointments today.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        {[
                           { time: "09:00 AM", patient: "Alice Brown", type: "Initial Consultation", status: "Completed" },
                           { time: "10:30 AM", patient: "Michael Chen", type: "Follow-up", status: "In Progress" },
                           { time: "01:00 PM", patient: "Sarah Davis", type: "Therapy Session", status: "Upcoming" },
                           { time: "02:30 PM", patient: "James Wilson", type: "Wellness Check", status: "Upcoming" },
                        ].map((apt, i) => (
                           <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="bg-primary/10 text-primary font-bold px-3 py-2 rounded-md text-sm whitespace-nowrap">
                                    {apt.time}
                                 </div>
                                 <div>
                                    <h4 className="font-bold">{apt.patient}</h4>
                                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Badge variant={apt.status === "Completed" ? "secondary" : apt.status === "In Progress" ? "default" : "outline"}>
                                    {apt.status}
                                 </Badge>
                                 <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="patients" className="space-y-4 mt-6">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                       <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                       <Input placeholder="Search patients..." className="pl-9" />
                    </div>
                    <Button variant="outline">Filter</Button>
                 </div>
                 <div className="grid gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                       <Card key={i} className="hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                   <AvatarFallback>P{i}</AvatarFallback>
                                </Avatar>
                                <div>
                                   <h4 className="font-bold">Patient Name {i}</h4>
                                   <p className="text-sm text-muted-foreground">ID: #8392{i}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-medium text-muted-foreground">Last Visit</p>
                                <p className="text-sm font-bold">Oct {10+i}, 2024</p>
                             </div>
                          </CardContent>
                       </Card>
                    ))}
                 </div>
              </TabsContent>
           </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border shadow-sm mx-auto"
                 />
              </CardContent>
           </Card>

           <Card className="bg-blue-50 border-blue-100">
              <CardHeader>
                 <CardTitle className="text-blue-900 text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" /> Verify Documents
                 </Button>
                 <Button variant="outline" className="w-full justify-start bg-white hover:bg-blue-50">
                    <FileText className="mr-2 h-4 w-4 text-blue-600" /> Generate Reports
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}