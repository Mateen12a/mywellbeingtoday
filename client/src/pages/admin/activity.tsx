import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  LogIn, 
  Heart, 
  FileText, 
  Calendar, 
  Search, 
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

const activityTypes = [
  { value: "all", label: "All Activities" },
  { value: "login", label: "Logins" },
  { value: "activity", label: "Activity Logs" },
  { value: "mood", label: "Mood Logs" },
  { value: "report", label: "Reports" },
  { value: "appointment", label: "Appointments" },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'login':
      return <LogIn className="h-4 w-4" />;
    case 'activity':
      return <Activity className="h-4 w-4" />;
    case 'mood':
      return <Heart className="h-4 w-4" />;
    case 'report':
      return <FileText className="h-4 w-4" />;
    case 'appointment':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityBadgeColor = (type: string) => {
  switch (type) {
    case 'login':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'activity':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'mood':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'report':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'appointment':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "activity", page, type, startDate, endDate],
    queryFn: async () => {
      const response = await api.getPlatformActivity({
        type: type === "all" ? undefined : type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 50,
      });
      return response.data;
    },
  });

  const filteredActivities = data?.activities?.filter((activity: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      activity.userName?.toLowerCase().includes(searchLower) ||
      activity.email?.toLowerCase().includes(searchLower) ||
      activity.action?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDetails = (activity: any) => {
    if (!activity.details) return "-";
    const details = activity.details;
    switch (activity.type) {
      case 'activity':
        return `${details.category || 'N/A'} - ${details.name || 'N/A'}`;
      case 'mood':
        return `${details.mood || 'N/A'} (Score: ${details.moodScore || 'N/A'})`;
      case 'report':
        return `Level: ${details.wellbeingLevel || 'N/A'} (${details.overallScore || 0}%)`;
      case 'appointment':
        return `${details.type || 'N/A'} - ${details.status || 'N/A'}`;
      default:
        return JSON.stringify(details).slice(0, 50);
    }
  };

  return (
    <AdminLayout title="Activity Log">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Platform Activity</h2>
          <p className="text-muted-foreground">
            Monitor all platform activities including logins, mood logs, activities, and appointments.
            Chat message content is not shown for privacy.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
            </div>

            {data?.counts && (
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(data.counts).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value as number}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No activities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivities.map((activity: any) => (
                        <TableRow key={activity._id}>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 w-fit ${getActivityBadgeColor(activity.type)}`}
                            >
                              {getActivityIcon(activity.type)}
                              {activity.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {activity.action?.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{activity.userName || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{activity.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                            {formatDetails(activity)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(activity.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {data?.pagination && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredActivities.length} of {data.pagination.total} activities
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {page} of {data.pagination.pages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= data.pagination.pages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
