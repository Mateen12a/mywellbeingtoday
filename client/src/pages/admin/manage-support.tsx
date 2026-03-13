import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Headphones, Loader2, AlertCircle, Mail, User, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import api from "@/lib/api";
import AdminLayout from "@/components/admin-layout";

export default function ManageSupportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = api.getUser();
  const isSuperAdmin = currentUser?.role === 'admin';

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [deleteDialogAdmin, setDeleteDialogAdmin] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await api.getAdmins();
      if (response.success && response.data) return response.data.admins;
      throw new Error('Failed to fetch admins');
    },
    enabled: isSuperAdmin,
  });

  const supportStaff = (adminsData || []).filter((a: any) =>
    a.role === 'support' || (a.adminInvite?.role === 'support' && a.adminInvite?.accepted === false)
  );

  const isNewInvite = (admin: any) => !!admin.isPendingInvite;
  const isExistingPending = (admin: any) =>
    !admin.isPendingInvite && admin.role !== 'support' && admin.adminInvite && admin.adminInvite.accepted === false;
  const isPending = (admin: any) => isNewInvite(admin) || isExistingPending(admin);

  const inviteAdminMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; role: 'support' }) => {
      const response = await api.inviteAdmin(data);
      if (!response.success) throw new Error(response.message || 'Failed to send invitation');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setIsInviteDialogOpen(false);
      resetForm();
      toast({
        title: "Invitation Sent",
        description: "A support staff invitation has been sent. They'll follow the link to complete their account setup.",
      });
    },
    onError: (error: Error) => {
      setFormError(error.message);
      toast({ title: "Error", description: error.message || "Failed to send invitation", variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteAdmin(id);
      if (!response.success) throw new Error(response.message || 'Failed to remove support account');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeleteDialogAdmin(null);
      toast({ title: "Support Account Removed", description: "The support staff account has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to remove account", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setInviteForm({ email: "", firstName: "", lastName: "" });
    setFormError(null);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      setFormError("Full name and email are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      setFormError("Please enter a valid email address");
      return;
    }

    inviteAdminMutation.mutate({ ...inviteForm, role: 'support' });
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center">Only Administrators can manage support staff.</p>
          <Button onClick={() => setLocation("/admin/dashboard")}>Return to Dashboard</Button>
        </div>
      </AdminLayout>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AdminLayout title="Manage Support Staff">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Support Staff</h2>
            <p className="text-muted-foreground">
              Invite and manage support staff. Support accounts have view-only access to assist users and providers.
            </p>
          </div>

          <Dialog open={isInviteDialogOpen} onOpenChange={(open) => { setIsInviteDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Support Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-blue-600" />
                  Invite Support Staff
                </DialogTitle>
                <DialogDescription>
                  Send a support invitation. They'll follow the link to set up their account with view-only access.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteSubmit}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-3">
                    <Headphones className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      Support staff can view user profiles, provider info, reported chats, support tickets, and audit logs.
                      They cannot take any management actions.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        value={inviteForm.firstName}
                        onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                        disabled={inviteAdminMutation.isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={inviteForm.lastName}
                        onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                        disabled={inviteAdminMutation.isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="support@example.com"
                        className="pl-9"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        disabled={inviteAdminMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={inviteAdminMutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={inviteAdminMutation.isPending}>
                    {inviteAdminMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                    ) : (
                      "Send Support Invite"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-blue-600" />
              Support Staff
              {!isLoading && (
                <Badge variant="outline" className="ml-1 border-blue-300 text-blue-700 bg-blue-50">{supportStaff.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Support staff have read-only access across the admin panel to help users and providers effectively.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : supportStaff.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Headphones className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No support staff yet</p>
                <p className="text-sm mt-1">Invite support staff to help users and providers.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportStaff.map((admin: any) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                              {getInitials(admin.profile?.firstName, admin.profile?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {isPending(admin)
                                ? admin.profile?.firstName || 'Pending'
                                : admin.profile?.displayName || `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim() || 'Unknown'}
                            </p>
                            {isPending(admin) && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />Invite pending
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isNewInvite(admin) ? 'border-amber-400 text-amber-700 bg-amber-50' :
                            isExistingPending(admin) ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                            admin.isActive ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-red-400 text-red-700'
                          }
                        >
                          {isNewInvite(admin) ? 'Invited' : isExistingPending(admin) ? 'Pending' : admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {isPending(admin) ? (
                          <span className="italic text-xs">Not yet</span>
                        ) : formatLastLogin(admin.lastLogin) ? (
                          formatLastLogin(admin.lastLogin)
                        ) : (
                          <span className="italic text-xs">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(admin.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteDialogAdmin(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteDialogAdmin} onOpenChange={(open) => { if (!open) setDeleteDialogAdmin(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove Support Staff
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {deleteDialogAdmin?.isPendingInvite
                  ? deleteDialogAdmin?.profile?.firstName
                  : deleteDialogAdmin?.profile?.displayName || `${deleteDialogAdmin?.profile?.firstName || ''} ${deleteDialogAdmin?.profile?.lastName || ''}`.trim()}
              </strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogAdmin(null)} disabled={deleteAdminMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogAdmin && deleteAdminMutation.mutate(deleteDialogAdmin._id)}
              disabled={deleteAdminMutation.isPending}
            >
              {deleteAdminMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Removing...</>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
