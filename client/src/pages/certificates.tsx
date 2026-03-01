import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { 
  FileText, 
  Download, 
  Calendar, 
  Search,
  Plus,
  Eye,
  Trash2,
  Printer,
  AlertCircle,
  Loader2,
  Upload,
  FolderOpen,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  File,
  Image,
  FileType,
  Sparkles
} from "lucide-react";

interface Certificate {
  _id: string;
  userId: string;
  providerId?: {
    _id: string;
    businessName: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  type: 'sick_note' | 'fitness_certificate' | 'medical_clearance' | 'vaccination' | 'other';
  title: string;
  description: string;
  issueDate: string;
  expiryDate?: string;
  validFrom?: string;
  validUntil?: string;
  status: 'active' | 'expired' | 'revoked';
  documentUrl?: string;
  issuedBy?: {
    name?: string;
    title?: string;
    organization?: string;
    registrationNumber?: string;
  };
  notes?: string;
  verificationCode?: string;
  createdAt: string;
}

interface UserDocument {
  id: string;
  title: string;
  type: 'medical_record' | 'prescription' | 'lab_results' | 'insurance_card' | 'other';
  date: string;
  notes?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  createdAt: string;
}

const certificateTypeLabels: Record<string, string> = {
  sick_note: 'Sick Note',
  fitness_certificate: 'Fitness Certificate',
  medical_clearance: 'Medical Clearance',
  vaccination: 'Vaccination Record',
  other: 'Other'
};

const documentTypeLabels: Record<string, string> = {
  medical_record: 'Medical Record',
  prescription: 'Prescription',
  lab_results: 'Lab Results',
  insurance_card: 'Insurance Card',
  other: 'Other'
};

const documentTypeIcons: Record<string, React.ReactNode> = {
  medical_record: <FileText className="h-5 w-5" />,
  prescription: <FileType className="h-5 w-5" />,
  lab_results: <File className="h-5 w-5" />,
  insurance_card: <Shield className="h-5 w-5" />,
  other: <FolderOpen className="h-5 w-5" />
};

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'expired':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'revoked':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

const USER_DOCUMENTS_KEY = 'user_documents';

function getUserDocuments(): UserDocument[] {
  try {
    const stored = localStorage.getItem(USER_DOCUMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUserDocuments(documents: UserDocument[]) {
  localStorage.setItem(USER_DOCUMENTS_KEY, JSON.stringify(documents));
}

function UserDocumentCard({ 
  document, 
  onView, 
  onDelete 
}: { 
  document: UserDocument; 
  onView: () => void;
  onDelete: () => void;
}) {
  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = document.fileName;
    link.click();
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {documentTypeIcons[document.type]}
            {documentTypeLabels[document.type]}
          </Badge>
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          {document.fileType.startsWith('image/') ? (
            <Image className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
          {document.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {document.fileName} • {formatFileSize(document.fileSize)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Date: {formatDate(document.date)}</span>
        </div>
        {document.notes && (
          <>
            <Separator />
            <p className="text-sm line-clamp-2 text-muted-foreground">{document.notes}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2 gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onView}>
          <Eye className="h-4 w-4" /> View
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProviderCertificateCard({ 
  certificate, 
  onView 
}: { 
  certificate: Certificate; 
  onView: () => void;
}) {
  const issuerName = certificate.issuedBy?.name || certificate.providerId?.businessName || 'Healthcare Provider';
  
  const handleDownload = () => {
    if (certificate.documentUrl) {
      window.open(certificate.documentUrl, '_blank');
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant={certificate.status === "active" ? "default" : certificate.status === "revoked" ? "destructive" : "secondary"}
            className="flex items-center gap-1"
          >
            {getStatusIcon(certificate.status)}
            {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
          </Badge>
          {certificate.verificationCode && (
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              {certificate.verificationCode}
            </span>
          )}
        </div>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {certificate.title}
        </CardTitle>
        <CardDescription>
          {certificateTypeLabels[certificate.type] || certificate.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium text-foreground">Issued by:</span>
            {issuerName}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Issued: {formatDate(certificate.issueDate)}</span>
          </div>
          {(certificate.expiryDate || certificate.validUntil) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires: {formatDate(certificate.expiryDate || certificate.validUntil)}</span>
            </div>
          )}
        </div>
        {certificate.description && (
          <>
            <Separator />
            <p className="text-sm line-clamp-2 text-muted-foreground">{certificate.description}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2 gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={onView}>
          <Eye className="h-4 w-4" /> View Details
        </Button>
        {certificate.documentUrl ? (
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function UserDocumentDetailDialog({ 
  document, 
  open, 
  onOpenChange,
  onDelete
}: { 
  document: UserDocument | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileData;
    link.download = document.fileName;
    link.click();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document.fileType.startsWith('image/') ? (
              <Image className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            {document.title}
          </DialogTitle>
          <DialogDescription>
            {documentTypeLabels[document.type]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {document.fileType.startsWith('image/') && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img src={document.fileData} alt={document.title} className="w-full h-auto max-h-64 object-contain" />
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Document Date</span>
              <p className="font-medium">{formatDate(document.date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Uploaded</span>
              <p className="font-medium">{formatDate(document.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">File Name</span>
              <p className="font-medium truncate">{document.fileName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">File Size</span>
              <p className="font-medium">{formatFileSize(document.fileSize)}</p>
            </div>
          </div>
          
          {document.notes && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Notes</span>
                <p className="text-sm mt-1">{document.notes}</p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CertificateDetailDialog({ 
  certificate, 
  open, 
  onOpenChange
}: { 
  certificate: Certificate | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!certificate) return null;

  const issuerName = certificate.issuedBy?.name || certificate.providerId?.businessName || 'Healthcare Provider';
  const issuerTitle = certificate.issuedBy?.title || '';
  const issuerOrg = certificate.issuedBy?.organization || '';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {certificate.title}
          </DialogTitle>
          <DialogDescription>
            {certificateTypeLabels[certificate.type] || certificate.type}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge 
              variant={certificate.status === "active" ? "default" : certificate.status === "revoked" ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              {getStatusIcon(certificate.status)}
              {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
            </Badge>
            {certificate.verificationCode && (
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                Verification: {certificate.verificationCode}
              </span>
            )}
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Issue Date</span>
              <p className="font-medium">{formatDate(certificate.issueDate)}</p>
            </div>
            {certificate.expiryDate && (
              <div>
                <span className="text-muted-foreground">Expiry Date</span>
                <p className="font-medium">{formatDate(certificate.expiryDate)}</p>
              </div>
            )}
            {certificate.validFrom && (
              <div>
                <span className="text-muted-foreground">Valid From</span>
                <p className="font-medium">{formatDate(certificate.validFrom)}</p>
              </div>
            )}
            {certificate.validUntil && (
              <div>
                <span className="text-muted-foreground">Valid Until</span>
                <p className="font-medium">{formatDate(certificate.validUntil)}</p>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div>
            <span className="text-xs text-muted-foreground uppercase font-bold">Issued By</span>
            <p className="font-medium mt-1">{issuerName}</p>
            {issuerTitle && <p className="text-sm text-muted-foreground">{issuerTitle}</p>}
            {issuerOrg && <p className="text-sm text-muted-foreground">{issuerOrg}</p>}
            {certificate.issuedBy?.registrationNumber && (
              <p className="text-xs text-muted-foreground mt-1">Registration: {certificate.issuedBy.registrationNumber}</p>
            )}
          </div>
          
          {certificate.description && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">Description</span>
                <p className="text-sm mt-1">{certificate.description}</p>
              </div>
            </>
          )}
          
          {certificate.notes && (
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold">Notes</span>
              <p className="text-sm mt-1">{certificate.notes}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {certificate.documentUrl ? (
            <Button variant="outline" asChild>
              <a href={certificate.documentUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </a>
            </Button>
          ) : (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'medical_record' as string,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, '') });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }
    if (!formData.title) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        
        const newDocument: UserDocument = {
          id: crypto.randomUUID(),
          title: formData.title,
          type: formData.type as UserDocument['type'],
          date: formData.date,
          notes: formData.notes || undefined,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          fileData: base64Data,
          createdAt: new Date().toISOString()
        };

        const documents = getUserDocuments();
        documents.unshift(newDocument);
        saveUserDocuments(documents);

        toast({ title: 'Success', description: 'Document uploaded successfully' });
        onSuccess();
        onOpenChange(false);
        setFormData({
          title: '',
          type: 'medical_record',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsSubmitting(false);
      };
      reader.onerror = () => {
        toast({ title: 'Error', description: 'Failed to read file', variant: 'destructive' });
        setIsSubmitting(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload document', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>Upload your medical documents, records, or prescriptions</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click to upload or drag and drop</p>
                  <p className="text-xs mt-1">PDF, Images, or Documents (max 10MB)</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Annual Blood Test Results"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Document Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical_record">Medical Record</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab_results">Lab Results</SelectItem>
                <SelectItem value="insurance_card">Insurance Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Document Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this document..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateCertificateDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'sick_note' as string,
    title: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    validFrom: '',
    validUntil: '',
    notes: ''
  });

  const handleAiSuggest = async () => {
    if (!formData.userId) {
      toast({ title: 'Error', description: 'Please enter a Patient User ID first', variant: 'destructive' });
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await api.getCertificateSuggestion(formData.userId, formData.type);
      if (response.success && response.data?.suggestion) {
        const { suggestion } = response.data;
        setFormData(prev => ({
          ...prev,
          title: prev.title || suggestion.suggestedTitle,
          description: prev.description || suggestion.suggestedDescription,
          notes: suggestion.suggestedNotes
        }));
        toast({ 
          title: 'AI Suggestion Applied', 
          description: suggestion.source === 'ai' 
            ? 'Content generated based on patient wellbeing data' 
            : 'Default suggestion applied'
        });
      } else {
        throw new Error(response.message || 'Failed to get AI suggestion');
      }
    } catch (error: any) {
      toast({ 
        title: 'AI Suggestion Failed', 
        description: error.message || 'Could not generate suggestion', 
        variant: 'destructive' 
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.title) {
      toast({ title: 'Error', description: 'User ID and title are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createCertificate({
        userId: formData.userId,
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate || undefined,
        validFrom: formData.validFrom || undefined,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes || undefined
      });

      if (response.success) {
        toast({ title: 'Success', description: 'Certificate created successfully' });
        onSuccess();
        onOpenChange(false);
        setFormData({
          userId: '',
          type: 'sick_note',
          title: '',
          description: '',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          validFrom: '',
          validUntil: '',
          notes: ''
        });
      } else {
        throw new Error(response.message || 'Failed to create certificate');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create certificate', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue New Certificate</DialogTitle>
          <DialogDescription>Issue a new certificate for a patient</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Patient User ID *</Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="Enter patient's user ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Certificate Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick_note">Sick Note</SelectItem>
                <SelectItem value="fitness_certificate">Fitness Certificate</SelectItem>
                <SelectItem value="medical_clearance">Medical Clearance</SelectItem>
                <SelectItem value="vaccination">Vaccination Record</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Sick Leave Certificate"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Details about the certificate..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiSuggest}
                disabled={isAiLoading || !formData.userId}
                className="gap-1 text-xs"
              >
                {isAiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI Suggest
              </Button>
            </div>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Issue Certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="pt-2 gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </CardFooter>
    </Card>
  );
}

export default function Certificates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);

  const isProvider = user?.role === 'provider';

  useEffect(() => {
    setUserDocuments(getUserDocuments());
  }, []);

  const { data: certificatesData, isLoading, isError, error } = useQuery({
    queryKey: ['certificates', typeFilter, statusFilter],
    queryFn: async () => {
      const response = await api.getCertificates({
        type: typeFilter || undefined,
        status: statusFilter || undefined
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch certificates');
      }
      return response.data;
    }
  });

  const certificates = certificatesData?.certificates || [];
  
  const filteredCertificates = certificates.filter((cert: Certificate) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const issuerName = cert.issuedBy?.name || cert.providerId?.businessName || '';
    return (
      cert.title.toLowerCase().includes(searchLower) ||
      issuerName.toLowerCase().includes(searchLower) ||
      (certificateTypeLabels[cert.type] || cert.type).toLowerCase().includes(searchLower)
    );
  });

  const filteredDocuments = userDocuments.filter((doc: UserDocument) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(searchLower) ||
      doc.fileName.toLowerCase().includes(searchLower) ||
      (documentTypeLabels[doc.type] || doc.type).toLowerCase().includes(searchLower)
    );
  });

  const handleDocumentUploadSuccess = () => {
    setUserDocuments(getUserDocuments());
  };

  const handleDeleteDocument = (docId: string) => {
    const documents = getUserDocuments().filter(d => d.id !== docId);
    saveUserDocuments(documents);
    setUserDocuments(documents);
    setDocumentDialogOpen(false);
    setSelectedDocument(null);
    toast({ title: 'Success', description: 'Document deleted successfully' });
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['certificates'] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Documents & Certificates</h1>
          <p className="text-muted-foreground mt-1">
            Manage your health documents and view provider-issued certificates.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              My Documents
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Provider Certificates
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "documents" && (
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          )}
          {activeTab === "certificates" && isProvider && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Issue Certificate
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === "documents" ? "Search documents..." : "Search certificates..."} 
              className="pl-8 bg-background" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {activeTab === "certificates" && (
            <>
              <Select value={typeFilter || "all"} onValueChange={(val) => setTypeFilter(val === "all" ? "" : val)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sick_note">Sick Note</SelectItem>
                  <SelectItem value="fitness_certificate">Fitness Certificate</SelectItem>
                  <SelectItem value="medical_clearance">Medical Clearance</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <TabsContent value="documents" className="mt-6">
          {filteredDocuments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <UserDocumentCard
                  key={doc.id}
                  document={doc}
                  onView={() => {
                    setSelectedDocument(doc);
                    setDocumentDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No documents yet</h3>
              <p className="text-sm mb-4">
                {searchTerm 
                  ? 'No documents found matching your search.' 
                  : 'Upload your medical records, prescriptions, and other health documents.'}
              </p>
              {!searchTerm && (
                <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Your First Document
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          {isError && (
            <div className="py-12 text-center text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-60" />
              <p className="font-medium">Failed to load certificates</p>
              <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Please try again later'}</p>
            </div>
          )}

          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && !isError && filteredCertificates.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCertificates.map((cert: Certificate) => (
                <ProviderCertificateCard
                  key={cert._id}
                  certificate={cert}
                  onView={() => {
                    setSelectedCertificate(cert);
                    setCertificateDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
          
          {!isLoading && !isError && filteredCertificates.length === 0 && (
            <div className="py-16 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No certificates yet</h3>
              <p className="text-sm mb-4">
                {searchTerm || typeFilter || statusFilter 
                  ? 'No certificates found matching your filters.' 
                  : 'Certificates issued by healthcare providers will appear here.'}
              </p>
              {isProvider && !searchTerm && !typeFilter && !statusFilter && (
                <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Issue First Certificate
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UserDocumentDetailDialog
        document={selectedDocument}
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onDelete={() => selectedDocument && handleDeleteDocument(selectedDocument.id)}
      />

      <CertificateDetailDialog
        certificate={selectedCertificate}
        open={certificateDialogOpen}
        onOpenChange={setCertificateDialogOpen}
      />

      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleDocumentUploadSuccess}
      />

      {isProvider && (
        <CreateCertificateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
