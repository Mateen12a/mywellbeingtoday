import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Headphones, Search, Loader2, MessageSquare, User, Clock, CheckCircle, AlertCircle, Send, UserCheck } from "lucide-react";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

export default function AdminSupportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["admin", "support-tickets", page, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await api.getAdminSupportTickets(params);
      return response.data;
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
      toast({
        title: "Ticket Updated",
        description: "The ticket has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.respondToSupportTicket(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
      setShowResponseDialog(false);
      setResponseMessage("");
      setSelectedTicket(null);
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    },
  });

  const handleClaimTicket = (ticket: any) => {
    updateTicketMutation.mutate({
      id: ticket._id,
      data: { assignToSelf: true },
    });
  };

  const handleStatusChange = (ticket: any, status: string) => {
    updateTicketMutation.mutate({
      id: ticket._id,
      data: { status },
    });
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    respondMutation.mutate({
      id: selectedTicket._id,
      message: responseMessage.trim(),
    });
  };

  const openResponseDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setResponseMessage("");
    setShowResponseDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "resolved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUserName = (user: any) => {
    if (!user) return "Unknown User";
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim();
    }
    return user.email;
  };

  return (
    <AdminLayout title="Support Tickets">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Support Tickets
          </h2>
          <p className="text-muted-foreground">
            Manage and respond to user support requests.
          </p>
        </div>

        {ticketsData?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ticketsData.stats.open}</p>
                    <p className="text-sm text-muted-foreground">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ticketsData.stats.in_progress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ticketsData.stats.resolved}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{ticketsData.stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>All Tickets</CardTitle>
                <CardDescription>View and manage support tickets from users.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Filter:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ticketsData?.tickets && ticketsData.tickets.length > 0 ? (
              <div className="space-y-4">
                {ticketsData.tickets.map((ticket: any) => (
                  <div key={ticket._id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{ticket.subject}</h4>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getUserName(ticket.userId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                      {ticket.assignedAdmin && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Assigned: {getUserName(ticket.assignedAdmin)}
                        </span>
                      )}
                      {ticket.responses?.length > 0 && (
                        <span>{ticket.responses.length} response(s)</span>
                      )}
                    </div>

                    {ticket.responses?.length > 0 && (
                      <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Responses:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {ticket.responses.map((response: any, idx: number) => (
                            <div key={idx} className="bg-muted/50 rounded p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-xs">
                                  {getUserName(response.userId)}
                                  {response.userId?.role && (
                                    <Badge variant="outline" className="ml-2 text-xs">{response.userId.role}</Badge>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p>{response.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {!ticket.assignedAdmin && ticket.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClaimTicket(ticket)}
                          disabled={updateTicketMutation.isPending}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Claim Ticket
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openResponseDialog(ticket)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Respond
                      </Button>
                      {ticket.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(ticket, 'resolved')}
                          disabled={updateTicketMutation.isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                      {ticket.status === 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(ticket, 'open')}
                          disabled={updateTicketMutation.isPending}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {ticketsData.pagination && ticketsData.pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {ticketsData.pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= ticketsData.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Headphones className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No support tickets found</p>
                <p className="text-sm">Tickets from users will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Respond to Ticket
            </DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <>
                  Responding to: <strong>{selectedTicket.subject}</strong> from {getUserName(selectedTicket.userId)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="responseMessage">Your Response</Label>
              <Textarea
                id="responseMessage"
                placeholder="Type your response here..."
                className="min-h-[120px]"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={respondMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={respondMutation.isPending || !responseMessage.trim()}
            >
              {respondMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Send Response</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
