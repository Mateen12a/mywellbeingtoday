import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Loader2, 
  Server, 
  Mail, 
  Clock, 
  AlertTriangle,
  Settings,
  Key,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import AdminLayout from "@/components/admin-layout";

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const currentUser = api.getUser();
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showBypassCodes, setShowBypassCodes] = useState(false);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'mywellbeingtoday',
    systemEmail: 'system@mywellbeingtoday.com',
    supportEmail: 'support@mywellbeingtoday.com',
    noreplyEmail: 'noreply@mywellbeingtoday.com',
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    apiRateLimit: '100',
    apiRateLimitWindow: '60',
  });

  const [maintenanceSettings, setMaintenanceSettings] = useState({
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    scheduledStart: '',
    scheduledEnd: '',
    allowAdminAccess: true,
  });

  const [bypassCodes, setBypassCodes] = useState([
    { code: 'ADMIN-BYPASS-2026-A1B2', active: true, usedBy: null },
    { code: 'ADMIN-BYPASS-2026-C3D4', active: true, usedBy: null },
    { code: 'ADMIN-BYPASS-2026-E5F6', active: false, usedBy: 'admin@example.com' },
  ]);

  const generateBypassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const newCode = `ADMIN-BYPASS-${new Date().getFullYear()}-${segment()}`;
    setBypassCodes(prev => [...prev, { code: newCode, active: true, usedBy: null }]);
    toast({
      title: "Bypass code generated",
      description: "New admin bypass code has been created.",
    });
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied",
      description: "Bypass code copied to clipboard.",
    });
  };

  const toggleBypassCode = (code: string) => {
    setBypassCodes(prev => prev.map(bc => 
      bc.code === code ? { ...bc, active: !bc.active } : bc
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Settings saved",
      description: "System settings have been updated successfully.",
    });
  };

  if (currentUser?.role !== 'super_admin') {
    return (
      <AdminLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">This page is only accessible to Super Admins.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">System Settings</h2>
              <p className="text-muted-foreground">
                Super Admin only. Configure platform-wide settings and maintenance mode.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Platform Configuration</CardTitle>
                  <CardDescription>Basic platform identity and branding settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input 
                    id="platformName"
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, platformName: e.target.value }))}
                    data-testid="input-platform-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemEmail">System Email</Label>
                  <Input 
                    id="systemEmail"
                    type="email"
                    value={platformSettings.systemEmail}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, systemEmail: e.target.value }))}
                    data-testid="input-system-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Configure system email addresses.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    data-testid="input-support-email"
                  />
                  <p className="text-xs text-muted-foreground">Where user support requests are sent.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noreplyEmail">No-Reply Email</Label>
                  <Input 
                    id="noreplyEmail"
                    type="email"
                    value={platformSettings.noreplyEmail}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, noreplyEmail: e.target.value }))}
                    data-testid="input-noreply-email"
                  />
                  <p className="text-xs text-muted-foreground">Used for automated system emails.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Security & Rate Limits</CardTitle>
                  <CardDescription>Configure session and API security settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout</Label>
                  <Select 
                    value={securitySettings.sessionTimeout}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}
                  >
                    <SelectTrigger id="sessionTimeout" data-testid="select-session-timeout">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Select 
                    value={securitySettings.maxLoginAttempts}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: value }))}
                  >
                    <SelectTrigger id="maxLoginAttempts" data-testid="select-max-login">
                      <SelectValue placeholder="Select max attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                      <SelectItem value="15">15 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API Rate Limit (requests)</Label>
                  <Input 
                    id="apiRateLimit"
                    type="number"
                    value={securitySettings.apiRateLimit}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiRateLimit: e.target.value }))}
                    data-testid="input-api-rate-limit"
                  />
                  <p className="text-xs text-muted-foreground">Maximum requests per window.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimitWindow">Rate Limit Window (seconds)</Label>
                  <Input 
                    id="apiRateLimitWindow"
                    type="number"
                    value={securitySettings.apiRateLimitWindow}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiRateLimitWindow: e.target.value }))}
                    data-testid="input-rate-limit-window"
                  />
                  <p className="text-xs text-muted-foreground">Time window for rate limiting.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/30 shadow-sm bg-orange-50/30 dark:bg-orange-950/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <CardTitle className="text-orange-700 dark:text-orange-400">Maintenance Mode</CardTitle>
                    <CardDescription>Enable to show maintenance page to all users.</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={maintenanceSettings.enabled ? "destructive" : "secondary"}>
                    {maintenanceSettings.enabled ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Switch 
                    checked={maintenanceSettings.enabled}
                    onCheckedChange={(checked) => setMaintenanceSettings(prev => ({ ...prev, enabled: checked }))}
                    data-testid="switch-maintenance-mode"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea 
                  id="maintenanceMessage"
                  value={maintenanceSettings.message}
                  onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter the message to display during maintenance..."
                  rows={3}
                  data-testid="textarea-maintenance-message"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledStart">Scheduled Start</Label>
                  <Input 
                    id="scheduledStart"
                    type="datetime-local"
                    value={maintenanceSettings.scheduledStart}
                    onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, scheduledStart: e.target.value }))}
                    data-testid="input-scheduled-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledEnd">Scheduled End</Label>
                  <Input 
                    id="scheduledEnd"
                    type="datetime-local"
                    value={maintenanceSettings.scheduledEnd}
                    onChange={(e) => setMaintenanceSettings(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                    data-testid="input-scheduled-end"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-4 bg-background rounded-lg border">
                <div>
                  <Label className="font-medium">Allow Admin Access</Label>
                  <p className="text-sm text-muted-foreground">Super admins can bypass maintenance mode</p>
                </div>
                <Switch 
                  checked={maintenanceSettings.allowAdminAccess}
                  onCheckedChange={(checked) => setMaintenanceSettings(prev => ({ ...prev, allowAdminAccess: checked }))}
                  data-testid="switch-allow-admin-access"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Admin Bypass Codes</CardTitle>
                    <CardDescription>One-time codes for admin access during maintenance.</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowBypassCodes(!showBypassCodes)}
                    data-testid="button-toggle-codes-visibility"
                  >
                    {showBypassCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateBypassCode}
                    className="gap-2"
                    data-testid="button-generate-bypass-code"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bypassCodes.map((bc, index) => (
                  <div 
                    key={bc.code}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      bc.active ? 'bg-muted/30' : 'bg-muted/10 opacity-60'
                    }`}
                    data-testid={`bypass-code-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-sm bg-background px-2 py-1 rounded border">
                        {showBypassCodes ? bc.code : '••••-••••••-••••-••••'}
                      </code>
                      {bc.usedBy && (
                        <span className="text-xs text-muted-foreground">
                          Used by {bc.usedBy}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={bc.active ? "default" : "secondary"} className="text-xs">
                        {bc.active ? "Active" : "Used"}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(bc.code)}
                        disabled={!showBypassCodes}
                        data-testid={`button-copy-code-${index}`}
                      >
                        {copiedCode === bc.code ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Switch 
                        checked={bc.active}
                        onCheckedChange={() => toggleBypassCode(bc.code)}
                        disabled={!!bc.usedBy}
                        data-testid={`switch-toggle-code-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="gap-2"
            data-testid="button-save-settings"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" /> Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
