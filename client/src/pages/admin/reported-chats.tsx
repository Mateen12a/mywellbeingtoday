import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Flag, 
  AlertTriangle, 
  Eye, 
  CheckCircle, 
  XCircle,
  Shield,
  MessageSquare,
  Clock,
  User,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  dismissed: 'bg-gray-100 text-gray-700 border-gray-200',
};

const reasonLabels: Record<string, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  scam: 'Scam/Fraud',
  other: 'Other',
};

export default function AdminReportedChatsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolution, setResolution] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reported-chats", statusFilter],
    queryFn: async () => {
      const response = await api.getReportedChats({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      return response.data;
    },
  });

  const { data: reportDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["admin", "reported-chat-details", selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      const response = await api.getReportedChatDetails(selectedReportId);
      return response.data;
    },
    enabled: !!selectedReportId,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      const response = await api.resolveReportedChat(id, { status, resolution });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reported-chats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reported-chat-details"] });
      toast({
        title: "Report Updated",
        description: `Report has been ${resolveAction}.`,
      });
      setShowResolveDialog(false);
      setSelectedReportId(null);
      setResolution("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleResolve = () => {
    if (!selectedReportId) return;
    resolveMutation.mutate({
      id: selectedReportId,
      status: resolveAction,
      resolution,
    });
  };

  return (
    <AdminLayout title="Reported Chats">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Flag className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold tracking-tight">Reported Chats</h2>
            {data?.pendingCount && data.pendingCount > 0 && (
              <Badge variant="destructive">{data.pendingCount} Pending</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Review user-reported conversations. Chat messages are only visible when explicitly reported.
            All other conversations remain private and encrypted.
          </p>
        </div>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardContent className="flex items-start gap-3 p-4">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Privacy Notice</p>
              <p className="text-sm text-amber-700">
                Only the last 30 messages from reported conversations are shown. 
                Admins cannot access any other private conversations.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Reports</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!data?.reports || data.reports.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.reports.map((report: any) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          <div className="font-medium">{report.reporterName}</div>
                          <div className="text-xs text-muted-foreground">{report.reporterId?.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{report.reportedUserName}</div>
                          <div className="text-xs text-muted-foreground">{report.reportedUserId?.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {reasonLabels[report.reason] || report.reason}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[report.status]}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReportId(report._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report Details
            </DialogTitle>
            <DialogDescription>
              Review the reported conversation and take appropriate action.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : reportDetails?.report && (
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Reporter</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{reportDetails.report.reporterName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Reported User</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{reportDetails.report.reportedUserName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Reason</div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {reasonLabels[reportDetails.report.reason] || reportDetails.report.reason}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant="outline" className={statusColors[reportDetails.report.status]}>
                    {reportDetails.report.status}
                  </Badge>
                </div>
              </div>

              {reportDetails.report.description && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <p className="text-sm bg-muted p-3 rounded-lg">{reportDetails.report.description}</p>
                </div>
              )}

              <Separator />

              <div className="flex-1 min-h-0">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reported Messages ({reportDetails.report.messages?.length || 0})</span>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </div>
                <ScrollArea className="h-[300px] border rounded-lg p-4 bg-muted/30">
                  <div className="space-y-3">
                    {reportDetails.report.messages?.map((msg: any, idx: number) => {
                      const isReportedUser = msg.senderId?.toString() === reportDetails.report.reportedUserId?._id?.toString();
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isReportedUser ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {msg.senderName} • {formatDate(msg.createdAt)}
                          </div>
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              isReportedUser
                                ? 'bg-red-100 text-red-900 border border-red-200'
                                : 'bg-white border'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {reportDetails?.report?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResolveAction('dismissed');
                    setShowResolveDialog(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  onClick={() => {
                    setResolveAction('resolved');
                    setShowResolveDialog(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setSelectedReportId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resolveAction === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resolveAction === 'resolved'
                ? 'Mark this report as resolved. You may want to take action against the reported user.'
                : 'Dismiss this report. The reported content does not violate community guidelines.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Add a note about the resolution (optional)..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResolution("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
