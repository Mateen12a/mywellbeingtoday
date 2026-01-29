import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RefreshCw, Shield, Loader2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import AdminLayout from "@/components/admin-layout";
import api from "@/lib/api";

export default function AdminAuditLogsPage() {
  const queryClient = useQueryClient();
  const [auditPage, setAuditPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const currentUser = api.getUser();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ["admin", "auditLogs", auditPage],
    queryFn: async () => {
      const response = await api.getAuditLogs({ page: auditPage, limit: 50 });
      return response.data;
    },
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('VERIFY')) return 'default';
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('DEACTIVATE')) return 'destructive';
    if (action.includes('LOGIN')) return 'secondary';
    return 'outline';
  };

  return (
    <AdminLayout title="Audit Logs">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">Audit Logs</h2>
            <p className="text-muted-foreground">
              Track all administrative actions and system events. Click a row to view details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {auditLogsData?.pagination && (
              <span className="text-sm text-muted-foreground">
                {auditLogsData.pagination.total} total logs
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "auditLogs"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            {auditLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !isSuperAdmin ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Super Admin access required to view audit logs
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/40">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Timestamp</th>
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Action</th>
                      <th className="px-6 py-4 font-semibold">Resource</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {auditLogsData?.logs?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      auditLogsData?.logs?.map((log: any) => (
                        <>
                          <tr 
                            key={log._id} 
                            className="hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                          >
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {log.userId?.profile?.firstName?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-foreground text-xs">
                                    {log.userId?.profile?.firstName && log.userId?.profile?.lastName
                                      ? `${log.userId.profile.firstName} ${log.userId.profile.lastName}`
                                      : log.userId?.email || "System"}
                                  </span>
                                  {log.userId?.email && log.userId?.profile?.firstName && (
                                    <span className="text-muted-foreground text-xs">
                                      {log.userId.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={getActionBadgeVariant(log.action)} className="font-mono text-xs">
                                {log.action.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{log.resource}</td>
                            <td className="px-6 py-4">
                              <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'} className="text-xs">
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {log.details && Object.keys(log.details).length > 0 ? (
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {expandedLogId === log._id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </Button>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                            </td>
                          </tr>
                          {expandedLogId === log._id && log.details && (
                            <tr key={`${log._id}-details`}>
                              <td colSpan={6} className="px-6 py-4 bg-muted/30">
                                <div className="text-xs space-y-2">
                                  <div className="font-semibold text-foreground mb-2">Details</div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {log.details.approverName && (
                                      <div>
                                        <span className="text-muted-foreground">Approved by:</span>
                                        <span className="ml-2 text-foreground font-medium">{log.details.approverName}</span>
                                      </div>
                                    )}
                                    {log.details.approverEmail && (
                                      <div>
                                        <span className="text-muted-foreground">Approver Email:</span>
                                        <span className="ml-2 text-foreground">{log.details.approverEmail}</span>
                                      </div>
                                    )}
                                    {log.details.approvedAt && (
                                      <div>
                                        <span className="text-muted-foreground">Approved at:</span>
                                        <span className="ml-2 text-foreground">{new Date(log.details.approvedAt).toLocaleString()}</span>
                                      </div>
                                    )}
                                    {log.details.providerName && (
                                      <div>
                                        <span className="text-muted-foreground">Provider:</span>
                                        <span className="ml-2 text-foreground">{log.details.providerName}</span>
                                      </div>
                                    )}
                                    {log.details.providerEmail && (
                                      <div>
                                        <span className="text-muted-foreground">Provider Email:</span>
                                        <span className="ml-2 text-foreground">{log.details.providerEmail}</span>
                                      </div>
                                    )}
                                    {log.details.rejecterName && (
                                      <div>
                                        <span className="text-muted-foreground">Rejected by:</span>
                                        <span className="ml-2 text-foreground font-medium">{log.details.rejecterName}</span>
                                      </div>
                                    )}
                                    {log.details.reason && (
                                      <div className="col-span-full">
                                        <span className="text-muted-foreground">Reason:</span>
                                        <span className="ml-2 text-foreground">{log.details.reason}</span>
                                      </div>
                                    )}
                                    {log.details.email && (
                                      <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="ml-2 text-foreground">{log.details.email}</span>
                                      </div>
                                    )}
                                    {log.details.role && (
                                      <div>
                                        <span className="text-muted-foreground">Role:</span>
                                        <span className="ml-2 text-foreground">{log.details.role}</span>
                                      </div>
                                    )}
                                    {log.details.type && (
                                      <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="ml-2 text-foreground">{log.details.type}</span>
                                      </div>
                                    )}
                                    {log.details.title && (
                                      <div>
                                        <span className="text-muted-foreground">Title:</span>
                                        <span className="ml-2 text-foreground">{log.details.title}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="pt-2 border-t border-border/40 mt-2">
                                    <span className="text-muted-foreground">IP Address:</span>
                                    <span className="ml-2 font-mono">{log.ipAddress || "N/A"}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          {isSuperAdmin && auditLogsData?.pagination && auditLogsData.pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <span className="text-sm text-muted-foreground">
                Page {auditLogsData.pagination.page} of {auditLogsData.pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage >= auditLogsData.pagination.pages}
                  onClick={() => setAuditPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
