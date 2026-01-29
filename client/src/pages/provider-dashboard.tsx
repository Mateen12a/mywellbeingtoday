import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  MessageSquare,
  Bell,
  ShieldCheck,
  MoreVertical,
  Search,
  User,
  Paperclip,
  Send,
  CheckCheck,
  Filter,
  AlertCircle,
  FileText,
  LogOut,
  LayoutDashboard,
  Award,
  ChevronRight,
  Check,
  X,
  Loader2,
  Settings,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Copy,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bot,
  Trash2,
  Save,
  LifeBuoy,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator as UiSeparator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";

const UNLOCK_DURATION_MS = 5 * 60 * 1000;

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Helper function to format markdown-like text in AI messages
const formatAiMessage = (text: string) => {
  // Split by newlines to preserve line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const segments: React.ReactNode[] = [];
    
    // Simple approach: split and process bold first
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    
    boldParts.forEach((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text
        const content = part.slice(2, -2);
        segments.push(
          <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">
            {content}
          </strong>
        );
      } else if (part) {
        // Check for italic in remaining text
        const italicParts = part.split(/(\*[^*]+\*)/g);
        italicParts.forEach((italicPart, italicIndex) => {
          if (italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) {
            const content = italicPart.slice(1, -1);
            segments.push(
              <em key={`${lineIndex}-${partIndex}-${italicIndex}`} className="italic">
                {content}
              </em>
            );
          } else if (italicPart) {
            segments.push(<span key={`${lineIndex}-${partIndex}-${italicIndex}`}>{italicPart}</span>);
          }
        });
      }
    });
    
    return (
      <span key={lineIndex}>
        {segments.length > 0 ? segments : line}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

const useSearchParams = () => {
  const [search, setSearch] = useState(window.location.search);
  
  useEffect(() => {
    const onChange = () => setSearch(window.location.search);
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      onChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      onChange();
    };

    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
  
  return new URLSearchParams(search);
};

export default function ProviderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showPasswordVerifyDialog, setShowPasswordVerifyDialog] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [unlockTimestamp, setUnlockTimestamp] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [editProfileForm, setEditProfileForm] = useState({
    title: '',
    specialty: '',
    businessName: '',
    phone: '',
    street: '',
    city: '',
    postcode: '',
    bio: '',
  });
  
  const [showIssueCertificateDialog, setShowIssueCertificateDialog] = useState(false);
  const [aiInsightsExpanded, setAiInsightsExpanded] = useState(true);
  
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [aiMessageInput, setAiMessageInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [savedAutoResponses, setSavedAutoResponses] = useState<Array<{ id: string; title: string; content: string; category: string }>>([
    { id: '1', title: 'New Patient Welcome', content: 'Thank you for reaching out! I appreciate you choosing our practice. I will review your inquiry and respond within 24 hours. If this is urgent, please contact the clinic directly.', category: 'general' },
    { id: '2', title: 'Appointment Confirmation', content: 'Your appointment has been confirmed. Please arrive 15 minutes early and bring any relevant medical records. If you need to reschedule, please contact us at least 24 hours in advance.', category: 'appointments' },
  ]);
  const [showAutoResponsesPanel, setShowAutoResponsesPanel] = useState(false);
  const [showCertificateSuccessDialog, setShowCertificateSuccessDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createdCertificate, setCreatedCertificate] = useState<any>(null);
  const [certificateForm, setCertificateForm] = useState({
    type: '',
    customType: '',
    title: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });

  // Support ticket state
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false);
  const [showTicketDetailsDialog, setShowTicketDetailsDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: '' as string,
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: '',
  });
  
  const isUnlocked = unlockTimestamp !== null && Date.now() - unlockTimestamp < UNLOCK_DURATION_MS;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      if (tab === "schedule") setActiveTab("bookings");
      else if (tab === "settings") setActiveTab("profile");
      else setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['providerProfile'],
    queryFn: async () => {
      const response = await api.getProviderProfile();
      return response.data?.provider;
    },
    retry: false,
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['providerAppointments', statusFilter],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.getProviderAppointments(params);
      return response.data;
    },
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const { data: sharedReportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['sharedReports'],
    queryFn: async () => {
      const response = await api.getSharedReports();
      return response.data?.reports || [];
    },
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      return response.data;
    },
    refetchOnMount: 'always',
    staleTime: 1 * 60 * 1000,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversationMessages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await api.getConversationMessages(selectedConversation);
      return response.data;
    },
    enabled: !!selectedConversation,
    refetchOnMount: 'always',
    staleTime: 30 * 1000,
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await api.getUnreadCount();
      return response.data?.unreadCount || 0;
    },
    refetchOnMount: 'always',
    staleTime: 1 * 60 * 1000,
  });

  const { data: aiInsightsData, isLoading: aiInsightsLoading, refetch: refetchAiInsights } = useQuery({
    queryKey: ['providerAiInsights'],
    queryFn: async () => {
      const response = await api.getProviderAIInsights();
      return response.data?.insights;
    },
    refetchOnMount: 'always',
    staleTime: 5 * 60 * 1000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      return api.updateAppointmentStatus(appointmentId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerAppointments'] });
      toast({
        title: "Appointment updated",
        description: "The appointment status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return api.sendMessage(conversationId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversationMessages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const createCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.createCertificate(data);
    },
    onSuccess: (response: any) => {
      const certificate = response.data?.certificate;
      setCreatedCertificate(certificate);
      setShowIssueCertificateDialog(false);
      setShowCertificateSuccessDialog(true);
      resetCertificateForm();
      toast({
        title: "Certificate issued",
        description: "The certificate has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate",
        variant: "destructive",
      });
    },
  });

  const { data: supportTicketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['providerSupportTickets'],
    queryFn: async () => {
      const response = await api.getSupportTickets({ limit: 20 });
      return response.data?.tickets || [];
    },
    refetchOnMount: 'always',
    staleTime: 2 * 60 * 1000,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; category: string; priority: string; description: string }) => {
      const response = await api.createSupportTicket(data.subject, data.description, {
        category: data.category,
        priority: data.priority,
        userRole: 'provider'
      });
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerSupportTickets'] });
      setNewTicketForm({ subject: '', category: '', priority: 'medium', description: '' });
      setShowCreateTicketDialog(false);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!showIssueCertificateDialog) {
      return;
    }
    
    const searchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const response = await api.searchUsersForCertificate(userSearchQuery);
        setUserSearchResults(response.data?.users || []);
      } catch (error) {
        console.error('Failed to search users:', error);
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, showIssueCertificateDialog]);

  const resetCertificateForm = () => {
    setCertificateForm({
      type: '',
      customType: '',
      title: '',
      description: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      notes: '',
    });
    setSelectedUser(null);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleIssueCertificate = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user to issue the certificate to.",
        variant: "destructive",
      });
      return;
    }

    if (!certificateForm.type || !certificateForm.title || !certificateForm.issueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (type, title, issue date).",
        variant: "destructive",
      });
      return;
    }

    if (certificateForm.type === 'other' && !certificateForm.customType.trim()) {
      toast({
        title: "Error",
        description: "Please specify the custom certificate type.",
        variant: "destructive",
      });
      return;
    }

    const finalType = certificateForm.type === 'other' ? certificateForm.customType : certificateForm.type;

    createCertificateMutation.mutate({
      userId: selectedUser._id,
      type: finalType,
      title: certificateForm.title,
      description: certificateForm.description,
      issueDate: certificateForm.issueDate,
      expiryDate: certificateForm.expiryDate || undefined,
      notes: certificateForm.notes,
    });
  };

  const copyVerificationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Verification code copied to clipboard.",
    });
  };

  const handleSendMessage = () => {
    if (!selectedConversation || !messageInput.trim()) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  // AI Assistant suggested prompts
  const aiSuggestedPrompts = [
    { text: "Help me create an auto-response for new patient inquiries", icon: MessageSquare },
    { text: "Draft a message for appointment reminders", icon: CalendarIcon },
    { text: "Suggest a response for medication questions", icon: FileText },
    { text: "Create a follow-up message template", icon: Users },
  ];

  // AI response generation (simulated for demo/MVP)
  const generateAiResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('auto-response') || lowerMessage.includes('auto response') || lowerMessage.includes('new patient')) {
      return `Here's a professional auto-response for new patient inquiries:\n\n"Thank you for contacting our practice! We've received your message and appreciate you reaching out. A member of our team will review your inquiry and respond within 24 hours during business hours.\n\nIf this is a medical emergency, please call 999 or go to your nearest A&E.\n\nWarm regards,\n[Your Practice Name]"\n\nWould you like me to help you customize this message, or shall I save it as an auto-response?`;
    }
    
    if (lowerMessage.includes('appointment') || lowerMessage.includes('reminder')) {
      return `Here's a professional appointment reminder template:\n\n"Dear [Patient Name],\n\nThis is a friendly reminder about your upcoming appointment:\n\n📅 Date: [Appointment Date]\n⏰ Time: [Appointment Time]\n📍 Location: [Practice Address]\n\nPlease arrive 15 minutes early and bring:\n- Valid ID\n- Insurance card (if applicable)\n- List of current medications\n- Any relevant medical records\n\nIf you need to reschedule, please contact us at least 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest regards,\n[Your Name]"\n\nWould you like to customize this template?`;
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('prescription')) {
      return `Here's a suggested response for medication-related inquiries:\n\n"Thank you for your question about your medication. For your safety, I want to provide you with accurate information.\n\n[If about dosage]: Please follow the dosage instructions provided on your prescription. If you're unsure, please contact our office to clarify.\n\n[If about side effects]: Some common side effects may include [list relevant ones]. If you experience severe symptoms, please seek immediate medical attention.\n\n[If about refills]: To request a refill, please allow 48-72 hours for processing. You can request refills through your patient portal or by calling our office.\n\nPlease note: For urgent medication concerns, contact our office directly or speak with a pharmacist.\n\nBest regards,\n[Your Name]"\n\nShall I help you customize this for a specific medication or situation?`;
    }
    
    if (lowerMessage.includes('follow-up') || lowerMessage.includes('follow up')) {
      return `Here's a follow-up message template:\n\n"Dear [Patient Name],\n\nI hope this message finds you well. I wanted to follow up on your recent visit on [Date].\n\nHow are you feeling since we last met? I wanted to check:\n- Have your symptoms improved?\n- Are you experiencing any concerns with your treatment plan?\n- Do you have any questions about your care?\n\nPlease don't hesitate to reach out if you need anything. We're here to support your health journey.\n\nIf you'd like to schedule a follow-up appointment, please let us know.\n\nWarm regards,\n[Your Name]"\n\nWould you like me to adjust this for a specific condition or situation?`;
    }
    
    if (lowerMessage.includes('save') || lowerMessage.includes('store')) {
      return `I can help you save that as an auto-response! To save a message template:\n\n1. Click the "Manage Auto-Responses" button below\n2. Add a title for your template\n3. Paste or type your message content\n4. Choose a category (general, appointments, medications, etc.)\n5. Click Save\n\nYour saved auto-responses will be available for quick use when messaging patients. Would you like me to draft another template, or do you have other questions?`;
    }

    // Default response
    return `I'm here to help you with patient communications! Here's what I can assist with:\n\n📝 **Auto-Responses**: Create professional templates for common patient inquiries\n📅 **Appointment Messages**: Draft reminders, confirmations, and rescheduling notices\n💊 **Medication Guidance**: Templates for prescription and medication-related questions\n👤 **Follow-up Messages**: Check-in templates for patient care\n\nTry asking me something like:\n- "Help me create an auto-response for new patients"\n- "Draft an appointment reminder message"\n- "Suggest a response for medication questions"\n\nWhat would you like help with today?`;
  };

  const handleSendAiMessage = async () => {
    if (!aiMessageInput.trim()) return;
    
    const userMessage: typeof aiMessages[0] = {
      id: Date.now().toString(),
      role: 'user',
      content: aiMessageInput.trim(),
      timestamp: new Date(),
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    const messageToSend = aiMessageInput.trim();
    setAiMessageInput("");
    setIsAiTyping(true);
    
    try {
      const history = aiMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await api.providerAiChat(messageToSend, history);
      
      const aiResponse: typeof aiMessages[0] = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.message || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse: typeof aiMessages[0] = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSuggestedPromptClick = async (prompt: string) => {
    const userMessage: typeof aiMessages[0] = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    setAiMessageInput("");
    setIsAiTyping(true);
    
    try {
      const history = aiMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await api.providerAiChat(prompt, history);
      
      const aiResponse: typeof aiMessages[0] = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.message || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse: typeof aiMessages[0] = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleDeleteAutoResponse = (id: string) => {
    setSavedAutoResponses(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Deleted",
      description: "Auto-response has been removed.",
    });
  };

  const handleCopyAutoResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Auto-response copied to clipboard.",
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    if (!unlockTimestamp) {
      setRemainingTime(0);
      return;
    }

    const updateRemainingTime = () => {
      const elapsed = Date.now() - unlockTimestamp;
      const remaining = Math.max(0, UNLOCK_DURATION_MS - elapsed);
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setUnlockTimestamp(null);
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [unlockTimestamp]);

  useEffect(() => {
    if (profileData && showEditProfileDialog) {
      setEditProfileForm({
        title: profileData.professionalInfo?.title || '',
        specialty: profileData.professionalInfo?.specialty || profileData.professionalInfo?.specialties?.[0] || '',
        businessName: profileData.practice?.name || profileData.businessInfo?.name || '',
        phone: profileData.contactInfo?.phone || profileData.userId?.profile?.phone || '',
        street: profileData.practice?.address?.street || profileData.contactInfo?.address?.street || '',
        city: profileData.practice?.address?.city || profileData.contactInfo?.address?.city || '',
        postcode: profileData.practice?.address?.postcode || profileData.contactInfo?.address?.postcode || '',
        bio: profileData.professionalInfo?.bio || '',
      });
    }
  }, [profileData, showEditProfileDialog]);

  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEditProfileClick = () => {
    setShowEditProfileDialog(true);
  };

  const handleLockClick = () => {
    if (isUnlocked) {
      setUnlockTimestamp(null);
      toast({
        title: "Fields locked",
        description: "Profile fields have been locked.",
      });
    } else {
      setShowPasswordVerifyDialog(true);
    }
  };

  const handleVerifyPassword = async () => {
    if (!verifyPasswordInput) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const response = await api.verifyPassword(verifyPasswordInput);
      if (response.success) {
        setUnlockTimestamp(Date.now());
        setShowPasswordVerifyDialog(false);
        setVerifyPasswordInput('');
        toast({
          title: "Fields unlocked",
          description: "You can now edit your profile. Fields will auto-lock in 5 minutes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Incorrect password",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.updateProviderProfile(data);
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
      setShowEditProfileDialog(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      professionalInfo: {
        title: editProfileForm.title,
        specialty: editProfileForm.specialty,
        bio: editProfileForm.bio,
      },
      businessInfo: {
        name: editProfileForm.businessName,
      },
      practice: {
        name: editProfileForm.businessName,
        address: {
          street: editProfileForm.street,
          city: editProfileForm.city,
          postcode: editProfileForm.postcode,
        },
      },
      contactInfo: {
        phone: editProfileForm.phone,
        address: {
          street: editProfileForm.street,
          city: editProfileForm.city,
          postcode: editProfileForm.postcode,
        },
      },
    });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Appointments", icon: CalendarIcon },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadCountData && unreadCountData > 0 ? String(unreadCountData) : undefined },
    { id: "reports", label: "Patient Reports", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles, href: "/provider-ai-assistant" },
    { id: "support", label: "Support", icon: LifeBuoy },
    { id: "settings", label: "Settings", icon: Settings, href: "/provider-settings" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getProviderName = () => {
    if (!profileData) return "";
    const user = profileData.userId;
    // Capitalize title properly (e.g., "dr" -> "Dr.", "professor" -> "Professor")
    let title = profileData.professionalInfo?.title || "Dr.";
    if (title && typeof title === 'string') {
      title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      // Ensure title ends with period if it's an abbreviation
      if (!title.endsWith('.') && (title.toLowerCase() === 'dr' || title.toLowerCase() === 'mr' || title.toLowerCase() === 'mrs' || title.toLowerCase() === 'ms' || title.toLowerCase() === 'mx' || title.toLowerCase() === 'prof')) {
        title = title + '.';
      }
    }
    const firstName = user?.profile?.firstName || "";
    const lastName = user?.profile?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName.startsWith(title)) {
      return fullName;
    }
    return `${title} ${fullName}`.trim();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday: new Date().toDateString() === date.toDateString(),
      isTomorrow: new Date(Date.now() + 86400000).toDateString() === date.toDateString(),
    };
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTicketStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  const getTicketStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  const getTicketPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return { variant: 'destructive' as const, label: 'High' };
      case 'medium': return { variant: 'secondary' as const, label: 'Medium' };
      case 'low': return { variant: 'outline' as const, label: 'Low' };
      default: return { variant: 'secondary' as const, label: priority };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'Technical';
      case 'billing': return 'Billing';
      case 'account': return 'Account';
      case 'verification': return 'Verification';
      case 'other': return 'Other';
      default: return category;
    }
  };

  const formatTicketDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleCreateTicket = () => {
    if (!newTicketForm.subject || !newTicketForm.category || !newTicketForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(newTicketForm);
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTicketDetailsDialog(true);
  };

  const supportTickets = supportTicketsData || [];
  const filteredTickets = ticketFilter === 'all' 
    ? supportTickets 
    : supportTickets.filter((t: any) => t.status === ticketFilter);

  const appointments = appointmentsData?.appointments || [];
  const todayAppointments = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.dateTime).toDateString();
    return aptDate === new Date().toDateString();
  });

  const upcomingAppointments = appointments.filter((apt: any) => {
    return new Date(apt.dateTime) >= new Date() && 
           (apt.status === 'pending' || apt.status === 'confirmed');
  });

  const pendingAppointments = appointments.filter((apt: any) => apt.status === 'pending');

  const uniquePatients = new Set(appointments.map((apt: any) => apt.userId?._id)).size;

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];
  const currentConversation = messagesData?.conversation;

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/10">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need to be registered as a provider to access this dashboard.
            </p>
            <Button onClick={() => setLocation('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verificationStatus = profileData?.verification?.isVerified ? "verified" : "pending";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/10">
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 border-b flex items-center px-4 bg-white">
             <a href="/" className="flex items-center gap-2 font-bold text-xl w-full text-foreground overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/logo5.png" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-serif">
                  mywellbeingtoday
                </span>
             </a>
          </SidebarHeader>
          <SidebarContent className="bg-white">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id}
                        onClick={() => {
                          if ((item as any).href) {
                            setLocation((item as any).href);
                          } else {
                            setActiveTab(item.id);
                          }
                        }}
                        tooltip={item.label}
                        size="lg"
                        className="transition-all duration-200"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                        {item.badge && (
                           <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] group-data-[collapsible=icon]:hidden">
                              {item.badge}
                           </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className="bg-white">
             <SidebarMenu>
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
                   onClick={handleLogout}
                 >
                    <LogOut className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             </SidebarMenu>
             <div className="px-3 py-2 text-center border-t mt-2 group-data-[collapsible=icon]:hidden">
               <p className="text-[10px] text-muted-foreground">Built by Airfns Softwares</p>
             </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-hidden flex flex-col h-screen">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4 shadow-sm sticky top-0 z-10 w-full">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <UiSeparator orientation="vertical" className="mr-1 sm:mr-2 h-4 hidden sm:block" />
            
            <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden min-w-0">
               <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                 {profileLoading ? (
                   <Skeleton className="h-6 w-32 sm:w-48 md:w-64" />
                 ) : (
                   <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-serif font-bold text-foreground truncate">
                     <span className="hidden sm:inline">{getGreeting()}, </span>
                     <span className="sm:hidden">Hi, </span>
                     {getProviderName()}
                   </h1>
                 )}
                 {verificationStatus === "verified" && (
                   <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 gap-1 pl-1 pr-2 py-0.5 hidden lg:inline-flex shrink-0">
                      <ShieldCheck className="w-3 h-3 fill-emerald-600 text-white" /> Verified
                   </Badge>
                 )}
                 {verificationStatus === "pending" && (
                   <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 pl-1 pr-2 py-0.5 hidden lg:inline-flex shrink-0">
                      <Clock className="w-3 h-3" /> Pending Verification
                   </Badge>
                 )}
               </div>

               <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                 <div className="hidden lg:flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full text-xs font-bold text-secondary-foreground shrink-0 border border-secondary">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>
                      {new Date().toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                 </div>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative rounded-full">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      {pendingAppointments.length > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500 rounded-full border-2 border-background shadow-sm animate-pulse" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 rounded-xl" align="end">
                     <div className="p-4 border-b">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                     </div>
                     <div className="p-4">
                        {pendingAppointments.length > 0 ? (
                          <div className="space-y-4">
                             {pendingAppointments.slice(0, 3).map((apt: any) => (
                                <div key={apt._id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors text-left">
                                   <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                                   <div>
                                      <p className="font-semibold text-sm">New Booking Request</p>
                                      <p className="text-xs text-muted-foreground">
                                        {apt.userId?.profile?.firstName} {apt.userId?.profile?.lastName} requested an appointment.
                                      </p>
                                   </div>
                                </div>
                             ))}
                          </div>
                        ) : (
                          <p className="text-center text-sm text-muted-foreground">No new notifications</p>
                        )}
                     </div>
                  </PopoverContent>
                 </Popover>
               </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
             
             {activeTab === "dashboard" && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">Welcome back{profileData ? `, ${getProviderName()}` : ''}</h2>
                        <p className="text-muted-foreground">Here's your practice overview for today.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                         {appointmentsLoading ? (
                           [...Array(4)].map((_, i) => (
                             <Card key={i} className="shadow-sm border border-border/60">
                               <CardContent className="p-6">
                                 <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                 <Skeleton className="h-8 w-16 mb-2" />
                                 <Skeleton className="h-4 w-24" />
                               </CardContent>
                             </Card>
                           ))
                         ) : (
                           <>
                             <Card
                               onClick={() => setActiveTab("bookings")}
                               className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                             >
                               <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                                     <CalendarIcon className="w-6 h-6" />
                                   </div>
                                 </div>
                                 <div>
                                   <h3 className="text-2xl font-bold tracking-tight text-foreground">{todayAppointments.length}</h3>
                                   <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">Today's Appointments</p>
                                   <p className="text-xs text-muted-foreground mt-2">{upcomingAppointments.length} upcoming total</p>
                                 </div>
                               </CardContent>
                             </Card>

                             <Card
                               onClick={() => setActiveTab("messages")}
                               className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                             >
                               <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-transform duration-300">
                                     <MessageSquare className="w-6 h-6" />
                                   </div>
                                 </div>
                                 <div>
                                   <h3 className="text-2xl font-bold tracking-tight text-foreground">{conversations.length}</h3>
                                   <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">Conversations</p>
                                   <p className="text-xs text-muted-foreground mt-2">{unreadCountData || 0} unread messages</p>
                                 </div>
                               </CardContent>
                             </Card>

                             <Card
                               onClick={() => setActiveTab("bookings")}
                               className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                             >
                               <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform duration-300">
                                     <Users className="w-6 h-6" />
                                   </div>
                                 </div>
                                 <div>
                                   <h3 className="text-2xl font-bold tracking-tight text-foreground">{uniquePatients}</h3>
                                   <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">Patients</p>
                                   <p className="text-xs text-muted-foreground mt-2">From appointments</p>
                                 </div>
                               </CardContent>
                             </Card>

                             <Card
                               onClick={() => setActiveTab("profile")}
                               className="shadow-sm border border-border/60 bg-card hover:shadow-md transition-all duration-300 cursor-pointer group"
                             >
                               <CardContent className="p-6">
                                 <div className="flex items-center justify-between mb-4">
                                   <div className={`h-12 w-12 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-300 ${
                                     verificationStatus === 'verified' 
                                       ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                       : 'bg-amber-50 text-amber-600 border-amber-100'
                                   }`}>
                                     <ShieldCheck className="w-6 h-6" />
                                   </div>
                                 </div>
                                 <div>
                                   <h3 className="text-2xl font-bold tracking-tight text-foreground capitalize">{verificationStatus}</h3>
                                   <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-primary transition-colors">Profile Status</p>
                                   <p className="text-xs text-muted-foreground mt-2">
                                     {verificationStatus === 'verified' ? 'All docs approved' : 'Awaiting review'}
                                   </p>
                                 </div>
                               </CardContent>
                             </Card>
                           </>
                         )}
                    </div>

                    <Card className="border border-border/60 shadow-sm bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20">
                      <CardHeader 
                        className="flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setAiInsightsExpanded(!aiInsightsExpanded)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              Insights
                            </CardTitle>
                            <CardDescription>
                              {aiInsightsData?.summary?.quickSummary || 'Analyzing your practice data...'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              refetchAiInsights();
                            }}
                            disabled={aiInsightsLoading}
                          >
                            <RefreshCw className={`h-4 w-4 ${aiInsightsLoading ? 'animate-spin' : ''}`} />
                          </Button>
                          {aiInsightsExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      {aiInsightsExpanded && (
                        <CardContent className="pt-0">
                          {aiInsightsLoading ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                  <Skeleton key={i} className="h-16 rounded-lg" />
                                ))}
                              </div>
                              <Skeleton className="h-24 rounded-lg" />
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-sm">
                                  <div className="text-2xl font-bold text-amber-600">{aiInsightsData?.summary?.totalPending || 0}</div>
                                  <div className="text-sm text-muted-foreground">Pending Reviews</div>
                                </div>
                                <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-sm">
                                  <div className="text-2xl font-bold text-blue-600">{aiInsightsData?.summary?.totalUpcoming || 0}</div>
                                  <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                                </div>
                                <div className="bg-white dark:bg-card rounded-lg p-4 border shadow-sm">
                                  <div className="text-2xl font-bold text-emerald-600">{aiInsightsData?.summary?.totalSharedReports || 0}</div>
                                  <div className="text-sm text-muted-foreground">Shared Reports</div>
                                </div>
                              </div>

                              {aiInsightsData?.patientCareInsights && aiInsightsData.patientCareInsights.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4 text-violet-600" />
                                    Patient Care Insights
                                  </h4>
                                  <div className="space-y-2">
                                    {aiInsightsData.patientCareInsights.map((insight: any, idx: number) => (
                                      <div key={idx} className="bg-white dark:bg-card rounded-lg p-3 border flex items-start gap-3">
                                        <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                                          insight.priority === 'high' ? 'bg-red-500' :
                                          insight.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                        }`} />
                                        <div>
                                          <div className="font-medium text-sm">{insight.patientName}</div>
                                          <div className="text-sm text-muted-foreground">{insight.insight}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {aiInsightsData?.suggestedFollowUps && aiInsightsData.suggestedFollowUps.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    Suggested Follow-ups
                                  </h4>
                                  <div className="space-y-2">
                                    {aiInsightsData.suggestedFollowUps.map((followUp: any, idx: number) => (
                                      <div key={idx} className="bg-white dark:bg-card rounded-lg p-3 border flex items-start justify-between gap-3">
                                        <div>
                                          <div className="font-medium text-sm">{followUp.patientName}</div>
                                          <div className="text-sm text-muted-foreground">{followUp.reason}</div>
                                        </div>
                                        <Badge variant={
                                          followUp.urgency === 'urgent' ? 'destructive' :
                                          followUp.urgency === 'soon' ? 'secondary' : 'outline'
                                        } className="shrink-0">
                                          {followUp.urgency}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {aiInsightsData?.actionItems && aiInsightsData.actionItems.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Recommended Actions
                                  </h4>
                                  <div className="bg-white dark:bg-card rounded-lg p-4 border">
                                    <ul className="space-y-2">
                                      {aiInsightsData.actionItems.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                          <ChevronRight className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}

                              {(!aiInsightsData?.patientCareInsights?.length && 
                                !aiInsightsData?.suggestedFollowUps?.length && 
                                !aiInsightsData?.actionItems?.length) && (
                                <div className="text-center py-6 text-muted-foreground">
                                  <p className="text-sm">No specific insights available yet. As you receive more patient data, AI insights will appear here.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>

                     <div className="grid md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 border border-border/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Today's Schedule</CardTitle>
                                    <CardDescription>You have {todayAppointments.length} appointments today.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setActiveTab("bookings")}>
                                    Manage Schedule <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {appointmentsLoading ? (
                                  <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="flex-1">
                                          <Skeleton className="h-5 w-32 mb-2" />
                                          <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                      </div>
                                    ))}
                                  </div>
                                ) : todayAppointments.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No appointments scheduled for today</p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {todayAppointments.slice(0, 5).map((apt: any) => {
                                      const { time } = formatDateTime(apt.dateTime);
                                      const patientName = `${apt.userId?.profile?.firstName || ''} ${apt.userId?.profile?.lastName || ''}`.trim() || 'Patient';
                                      return (
                                        <div key={apt._id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                                          <div className="flex flex-col items-center justify-center h-12 w-12 bg-background rounded-lg border text-sm font-bold">
                                            {time}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-semibold">{patientName}</h4>
                                            <p className="text-xs text-muted-foreground capitalize">{apt.type?.replace('_', ' ')}</p>
                                          </div>
                                          <Badge variant={getStatusBadgeVariant(apt.status)} className={apt.status === "confirmed" ? "bg-emerald-500" : ""}>
                                            {apt.status}
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Frequently used tasks</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button className="w-full flex items-center justify-start" variant="outline" onClick={() => setActiveTab("messages")}>
                                    <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div className="text-left ml-3 min-w-0">
                                        <div className="font-semibold truncate">Check Messages</div>
                                        <div className="text-xs text-muted-foreground truncate">View patient inquiries</div>
                                    </div>
                                </Button>
                                <Button className="w-full flex items-center justify-start" variant="outline" onClick={() => setActiveTab("reports")}>
                                    <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="text-left ml-3 min-w-0">
                                        <div className="font-semibold truncate">View Reports</div>
                                        <div className="text-xs text-muted-foreground truncate">Shared wellbeing reports</div>
                                    </div>
                                </Button>
                                <Button className="w-full flex items-center justify-start" variant="outline" onClick={() => setActiveTab("profile")}>
                                    <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 flex items-center justify-center">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="text-left ml-3 min-w-0">
                                        <div className="font-semibold truncate">Update Profile</div>
                                        <div className="text-xs text-muted-foreground truncate">Edit your details</div>
                                    </div>
                                </Button>
                                <Button className="w-full flex items-center justify-start" variant="outline" onClick={() => setActiveTab("certificates")}>
                                    <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 flex items-center justify-center">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div className="text-left ml-3 min-w-0">
                                        <div className="font-semibold truncate">View Certificates</div>
                                        <div className="text-xs text-muted-foreground truncate">Manage credentials</div>
                                    </div>
                                </Button>
                            </CardContent>
                        </Card>
                     </div>
                </div>
             )}

             {activeTab === "bookings" && (
                <div className="grid xl:grid-cols-3 gap-6">
                   <div className="xl:col-span-2 space-y-6">
                      <Card className="border-none shadow-sm">
                         <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b">
                            <div>
                               <h3 className="text-lg font-semibold">Appointments</h3>
                               <p className="text-sm text-muted-foreground">Manage your patient appointments.</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                               <Select value={statusFilter} onValueChange={setStatusFilter}>
                                  <SelectTrigger className="w-[130px] h-9">
                                     <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="all">All Status</SelectItem>
                                     <SelectItem value="confirmed">Confirmed</SelectItem>
                                     <SelectItem value="pending">Pending</SelectItem>
                                     <SelectItem value="completed">Completed</SelectItem>
                                     <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                         </div>
                         
                         <CardContent className="p-6">
                            {appointmentsLoading ? (
                              <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-muted/30 border rounded-xl gap-4">
                                    <div className="flex items-center gap-4">
                                      <Skeleton className="h-14 w-14 rounded-xl" />
                                      <div>
                                        <Skeleton className="h-6 w-32 mb-2" />
                                        <Skeleton className="h-4 w-24" />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Skeleton className="h-6 w-20" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : appointments.length === 0 ? (
                              <div className="text-center py-12 text-muted-foreground">
                                <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                                <p>You don't have any appointments yet.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                 {appointments.map((apt: any) => {
                                   const { time, date, isToday, isTomorrow } = formatDateTime(apt.dateTime);
                                   const patientName = `${apt.userId?.profile?.firstName || ''} ${apt.userId?.profile?.lastName || ''}`.trim() || 'Patient';
                                   const patientInitials = getInitials(apt.userId?.profile?.firstName, apt.userId?.profile?.lastName);
                                   
                                   return (
                                     <div key={apt._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-muted/30 border rounded-xl hover:shadow-md transition-all gap-4 group">
                                        <div className="flex items-center gap-4">
                                           <div className="flex flex-col items-center justify-center h-14 w-14 bg-background text-primary rounded-xl font-bold border shadow-sm">
                                              <span className="text-[10px] uppercase font-medium text-muted-foreground">
                                                {isToday ? "TOD" : isTomorrow ? "TOM" : date.split(' ')[0]}
                                              </span>
                                              <span className="text-lg leading-none">{time}</span>
                                           </div>
                                           <div>
                                              <h4 className="font-bold text-lg">{patientName}</h4>
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                 <Badge variant="outline" className="text-xs font-normal bg-background capitalize">
                                                   {apt.type?.replace('_', ' ')}
                                                 </Badge>
                                                 {apt.reason && (
                                                   <span className="text-xs truncate max-w-[200px]">{apt.reason}</span>
                                                 )}
                                              </div>
                                           </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-dashed">
                                           <Badge 
                                             variant={getStatusBadgeVariant(apt.status)} 
                                             className={apt.status === "confirmed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                           >
                                              {apt.status}
                                           </Badge>
                                           
                                           {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                             <DropdownMenu>
                                               <DropdownMenuTrigger asChild>
                                                 <Button variant="ghost" size="icon" disabled={updateStatusMutation.isPending}>
                                                   {updateStatusMutation.isPending ? (
                                                     <Loader2 className="h-4 w-4 animate-spin" />
                                                   ) : (
                                                     <MoreVertical className="h-4 w-4" />
                                                   )}
                                                 </Button>
                                               </DropdownMenuTrigger>
                                               <DropdownMenuContent align="end">
                                                 {apt.status === 'pending' && (
                                                   <DropdownMenuItem
                                                     onClick={() => updateStatusMutation.mutate({ appointmentId: apt._id, status: 'confirmed' })}
                                                     className="text-emerald-600"
                                                   >
                                                     <Check className="h-4 w-4 mr-2" />
                                                     Confirm
                                                   </DropdownMenuItem>
                                                 )}
                                                 {apt.status === 'confirmed' && (
                                                   <DropdownMenuItem
                                                     onClick={() => updateStatusMutation.mutate({ appointmentId: apt._id, status: 'completed' })}
                                                     className="text-blue-600"
                                                   >
                                                     <CheckCheck className="h-4 w-4 mr-2" />
                                                     Mark Complete
                                                   </DropdownMenuItem>
                                                 )}
                                                 <DropdownMenuItem
                                                   onClick={() => updateStatusMutation.mutate({ appointmentId: apt._id, status: 'cancelled' })}
                                                   className="text-destructive"
                                                 >
                                                   <X className="h-4 w-4 mr-2" />
                                                   Cancel
                                                 </DropdownMenuItem>
                                               </DropdownMenuContent>
                                             </DropdownMenu>
                                           )}
                                        </div>
                                     </div>
                                   );
                                 })}
                              </div>
                            )}
                         </CardContent>
                      </Card>
                   </div>
                   
                   <div className="space-y-6">
                      <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CalendarIcon className="w-32 h-32" />
                         </div>
                         <CardContent className="p-6 relative z-10">
                            <h3 className="text-xl font-bold mb-1">Today's Overview</h3>
                            <p className="text-primary-foreground/80 mb-6">
                              You have {todayAppointments.length} appointments today.
                            </p>
                            
                            <div className="space-y-4">
                               <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                  <span className="text-sm font-medium">Completed</span>
                                  <span className="font-bold text-lg">
                                    {todayAppointments.filter((a: any) => a.status === 'completed').length}/{todayAppointments.length}
                                  </span>
                               </div>
                               <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                  <span className="text-sm font-medium">Pending Requests</span>
                                  <span className="font-bold text-lg">{pendingAppointments.length}</span>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                   </div>
                </div>
             )}

             {activeTab === "messages" && (
                <div className="h-[calc(100vh-200px)] min-h-[500px] border bg-card shadow-sm rounded-xl flex overflow-hidden">
                   <div className="hidden md:flex w-64 lg:w-80 border-r bg-muted/10 flex-col shrink-0">
                      <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
                         <h3 className="font-semibold mb-3">Messages</h3>
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search conversations..." className="pl-8 bg-background h-9 text-sm" />
                         </div>
                      </div>
                      <ScrollArea className="flex-1">
                         <div className="flex flex-col p-2 gap-1">
                            <p className="text-xs text-muted-foreground px-3 py-1 font-medium uppercase tracking-wide">Patient Conversations</p>
                            
                            {conversationsLoading ? (
                              [...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3 p-3">
                                  <Skeleton className="h-10 w-10 rounded-full" />
                                  <div className="flex-1">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                  </div>
                                </div>
                              ))
                            ) : conversations.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                No conversations yet
                              </div>
                            ) : (
                              conversations.map((conv: any) => {
                                const otherParticipant = conv.participants?.find((p: any) => p._id !== api.getUser()?._id);
                                const fullName = otherParticipant 
                                  ? `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() 
                                  : '';
                                const name = fullName || otherParticipant?.email || 'Unknown';
                                const initials = getInitials(otherParticipant?.firstName, otherParticipant?.lastName) || (otherParticipant?.email?.charAt(0)?.toUpperCase() || '?');
                                
                                return (
                                  <button 
                                     key={conv._id}
                                     className={`flex items-start gap-3 p-3 text-left transition-all rounded-lg group ${
                                       selectedConversation === conv._id 
                                         ? 'bg-background shadow-sm ring-1 ring-border' 
                                         : 'hover:bg-background/50 hover:shadow-sm'
                                     }`}
                                     onClick={() => {
                                       setSelectedConversation(conv._id);
                                     }}
                                  >
                                     <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10 border border-border">
                                           <AvatarFallback className="bg-primary/5 text-primary font-medium text-xs">
                                             {initials}
                                           </AvatarFallback>
                                        </Avatar>
                                     </div>
                                     <div className="flex-1 overflow-hidden min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                           <span className={`font-semibold text-sm truncate ${
                                             conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'
                                           }`}>
                                             {name}
                                           </span>
                                           <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                             {conv.lastMessage?.createdAt 
                                               ? new Date(conv.lastMessage.createdAt).toLocaleDateString() 
                                               : ''}
                                           </span>
                                        </div>
                                        <p className={`text-xs truncate ${
                                          conv.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                                        }`}>
                                           {conv.lastMessage?.content || 'No messages yet'}
                                        </p>
                                     </div>
                                     {conv.unreadCount > 0 && (
                                       <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                         {conv.unreadCount}
                                       </Badge>
                                     )}
                                  </button>
                                );
                              })
                            )}
                         </div>
                      </ScrollArea>
                   </div>
                   
                   <div className="flex-1 flex flex-col min-w-0 bg-background">
                      {selectedConversation && currentConversation ? (
                        <>
                          <div className="p-4 border-b flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                   <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                     {(() => {
                                       const other = currentConversation.participants?.find((p: any) => p._id !== api.getUser()?._id);
                                       return getInitials(other?.firstName, other?.lastName);
                                     })()}
                                   </AvatarFallback>
                                </Avatar>
                                <div>
                                   <h4 className="font-semibold text-sm">
                                     {(() => {
                                       const other = currentConversation.participants?.find((p: any) => p._id !== api.getUser()?._id);
                                       const fullName = `${other?.firstName || ''} ${other?.lastName || ''}`.trim();
                                       return fullName || other?.email || 'Unknown';
                                     })()}
                                   </h4>
                                </div>
                             </div>
                             <div className="flex gap-1">
                                <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => toast({ title: "Clear chat", description: "This feature is coming soon." })}>
                                         Clear chat
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast({ title: "Archive", description: "This feature is coming soon." })}>
                                         Archive
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast({ title: "Block user", description: "This feature is coming soon." })}>
                                         Block user
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast({ title: "Report", description: "This feature is coming soon." })}>
                                         Report
                                      </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                          </div>
                          
                          <ScrollArea className="flex-1 p-4 bg-secondary/5">
                             <div className="space-y-4 max-w-3xl mx-auto">
                                {messagesLoading ? (
                                  [...Array(5)].map((_, i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                                      <Skeleton className="h-10 w-48 rounded-2xl" />
                                    </div>
                                  ))
                                ) : messages.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No messages yet. Start the conversation!
                                  </div>
                                ) : (
                                  messages.map((msg: any) => {
                                    const isMe = msg.senderId?._id === api.getUser()?._id || msg.senderId === api.getUser()?._id;
                                    return (
                                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                         <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div 
                                               className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                                                  isMe 
                                                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                                  : 'bg-white border rounded-tl-none'
                                               }`}
                                            >
                                               {msg.content}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                               <span className="text-[10px] text-muted-foreground">
                                                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                               </span>
                                               {isMe && msg.read && <CheckCheck className="h-3 w-3 text-primary" />}
                                            </div>
                                         </div>
                                      </div>
                                    );
                                  })
                                )}
                             </div>
                          </ScrollArea>
                          
                          <div className="p-4 border-t bg-background">
                             <div className="flex gap-2 max-w-3xl mx-auto">
                                <Button variant="ghost" size="icon" className="shrink-0"><Paperclip className="h-5 w-5" /></Button>
                                <Input 
                                   placeholder="Type a message..." 
                                   className="flex-1"
                                   value={messageInput}
                                   onChange={(e) => setMessageInput(e.target.value)}
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter' && !e.shiftKey) {
                                       e.preventDefault();
                                       handleSendMessage();
                                     }
                                   }}
                                />
                                <Button 
                                  size="icon" 
                                  onClick={handleSendMessage}
                                  disabled={sendMessageMutation.isPending || !messageInput.trim()}
                                >
                                  {sendMessageMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                            <p>Choose a conversation from the list to start messaging</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
             )}

             {activeTab === "reports" && (
                <div className="space-y-6">
                   <div className="flex flex-col gap-2">
                     <h2 className="text-2xl font-bold tracking-tight">Shared Wellbeing Reports</h2>
                     <p className="text-muted-foreground">View wellbeing reports shared by your patients.</p>
                   </div>
                   
                   {reportsLoading ? (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                       {[...Array(3)].map((_, i) => (
                         <Card key={i}>
                           <CardContent className="p-6">
                             <Skeleton className="h-6 w-32 mb-4" />
                             <Skeleton className="h-4 w-full mb-2" />
                             <Skeleton className="h-4 w-3/4" />
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   ) : !sharedReportsData || sharedReportsData.length === 0 ? (
                     <Card>
                       <CardContent className="p-12 text-center">
                         <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">No shared reports</h3>
                         <p className="text-muted-foreground">
                           Patients haven't shared any wellbeing reports with you yet.
                         </p>
                       </CardContent>
                     </Card>
                   ) : (
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                       {sharedReportsData.map((report: any) => {
                         const patientName = `${report.userId?.profile?.firstName || ''} ${report.userId?.profile?.lastName || ''}`.trim() || 'Patient';
                         return (
                           <Card key={report._id} className="hover:shadow-md transition-shadow">
                             <CardHeader>
                               <CardTitle className="text-lg">{patientName}</CardTitle>
                               <CardDescription>
                                 Report from {new Date(report.createdAt).toLocaleDateString()}
                               </CardDescription>
                             </CardHeader>
                             <CardContent>
                               <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                   <span className="text-sm text-muted-foreground">Wellbeing Score</span>
                                   <Badge variant={
                                     report.scores?.overall >= 70 ? 'default' : 
                                     report.scores?.overall >= 40 ? 'secondary' : 'destructive'
                                   }>
                                     {report.scores?.overall || 'N/A'}
                                   </Badge>
                                 </div>
                                 {report.analysis?.summary && (
                                   <p className="text-sm text-muted-foreground line-clamp-3">
                                     {report.analysis.summary}
                                   </p>
                                 )}
                                 <Button variant="outline" size="sm" className="w-full mt-4">
                                   View Full Report
                                 </Button>
                               </div>
                             </CardContent>
                           </Card>
                         );
                       })}
                     </div>
                   )}
                </div>
             )}

             {activeTab === "profile" && (
                <div className="max-w-4xl mx-auto">
                   <Card>
                      <CardContent className="p-8">
                         {profileLoading ? (
                           <div className="text-center">
                             <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                             <Skeleton className="h-7 w-48 mx-auto mb-2" />
                             <Skeleton className="h-5 w-32 mx-auto" />
                           </div>
                         ) : (
                           <>
                             <div className="text-center mb-8">
                               <div className="h-24 w-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                                 {profileData?.userId?.profile?.avatarUrl ? (
                                   <img 
                                     src={profileData.userId.profile.avatarUrl} 
                                     alt="Profile" 
                                     className="h-24 w-24 rounded-full object-cover"
                                   />
                                 ) : (
                                   <User className="h-10 w-10 text-muted-foreground" />
                                 )}
                               </div>
                               <h3 className="text-xl font-bold">{getProviderName()}</h3>
                               <p className="text-muted-foreground capitalize">
                                 {profileData?.professionalInfo?.specialties?.join(', ')?.replace(/_/g, ' ') || 'Healthcare Provider'}
                               </p>
                               {verificationStatus === "verified" && (
                                 <Badge className="mt-2 bg-emerald-500">
                                   <ShieldCheck className="w-3 h-3 mr-1" /> Verified Provider
                                 </Badge>
                               )}
                             </div>
                             
                             <div className="grid md:grid-cols-2 gap-6">
                               <div>
                                 <h4 className="font-semibold mb-3">Professional Information</h4>
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Registration #</span>
                                     <span>{profileData?.professionalInfo?.registrationNumber || 'N/A'}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Experience</span>
                                     <span>{profileData?.professionalInfo?.yearsOfExperience || 0} years</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Languages</span>
                                     <span>{profileData?.professionalInfo?.languages?.join(', ') || 'English'}</span>
                                   </div>
                                 </div>
                               </div>
                               
                               <div>
                                 <h4 className="font-semibold mb-3">Practice Details</h4>
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Practice</span>
                                     <span>{profileData?.practice?.name || 'N/A'}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">City</span>
                                     <span>{profileData?.practice?.address?.city || 'N/A'}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-muted-foreground">Accepting Patients</span>
                                     <span>{profileData?.availability?.acceptingNewPatients ? 'Yes' : 'No'}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             {profileData?.professionalInfo?.bio && (
                               <div className="mt-6">
                                 <h4 className="font-semibold mb-2">About</h4>
                                 <p className="text-sm text-muted-foreground">{profileData.professionalInfo.bio}</p>
                               </div>
                             )}
                             
                             <div className="mt-8 text-center">
                               <Button variant="outline" onClick={handleEditProfileClick} className="gap-2">
                                 <Pencil className="h-4 w-4" />
                                 Edit Profile
                               </Button>
                             </div>
                           </>
                         )}
                      </CardContent>
                   </Card>
                </div>
             )}
             
             {activeTab === "certificates" && (
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
                       <p className="text-muted-foreground">Issue and manage medical certificates for your patients.</p>
                     </div>
                     <Button onClick={() => setShowIssueCertificateDialog(true)} className="gap-2">
                       <Plus className="h-4 w-4" />
                       Issue New Certificate
                     </Button>
                   </div>
                   
                   <Card>
                      <CardContent className="p-8 text-center">
                         <div className="h-24 w-24 bg-muted/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Award className="h-10 w-10 text-muted-foreground" />
                         </div>
                         <h3 className="text-xl font-bold">Certificates Management</h3>
                         <p className="text-muted-foreground mb-6">
                           Issue medical certificates to your patients. Each certificate includes a unique verification code.
                         </p>
                         <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                           <Badge variant="outline">Sick Notes</Badge>
                           <Badge variant="outline">Fitness Certificates</Badge>
                           <Badge variant="outline">Medical Clearance</Badge>
                           <Badge variant="outline">Vaccination Records</Badge>
                         </div>
                      </CardContent>
                   </Card>
                </div>
             )}

             {activeTab === "support" && (
                <div className="max-w-4xl mx-auto space-y-6">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                       <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
                       <p className="text-muted-foreground">Get help from our support team.</p>
                     </div>
                     <Button onClick={() => setShowCreateTicketDialog(true)} className="gap-2" data-testid="button-create-ticket">
                       <Plus className="h-4 w-4" />
                       New Ticket
                     </Button>
                   </div>

                   <div className="flex items-center gap-3">
                     <Select value={ticketFilter} onValueChange={setTicketFilter}>
                       <SelectTrigger className="w-[180px]" data-testid="select-ticket-filter">
                         <Filter className="h-4 w-4 mr-2" />
                         <SelectValue placeholder="Filter by status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Tickets</SelectItem>
                         <SelectItem value="open">Open</SelectItem>
                         <SelectItem value="in_progress">In Progress</SelectItem>
                         <SelectItem value="resolved">Resolved</SelectItem>
                       </SelectContent>
                     </Select>
                     <div className="text-sm text-muted-foreground">
                       {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                     </div>
                   </div>
                   
                   {ticketsLoading ? (
                     <Card>
                        <CardContent className="p-8 text-center">
                           <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                           <p className="text-muted-foreground">Loading support tickets...</p>
                        </CardContent>
                     </Card>
                   ) : filteredTickets.length === 0 ? (
                     <Card>
                        <CardContent className="p-8 text-center">
                           <div className="h-24 w-24 bg-muted/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                              <LifeBuoy className="h-10 w-10 text-muted-foreground" />
                           </div>
                           <h3 className="text-xl font-bold">No Support Tickets</h3>
                           <p className="text-muted-foreground mb-6">
                             {ticketFilter === 'all' 
                               ? "You haven't created any support tickets yet. Need help? Create a new ticket to get assistance from our support team."
                               : `No ${getTicketStatusLabel(ticketFilter).toLowerCase()} tickets found.`
                             }
                           </p>
                           {ticketFilter === 'all' && (
                             <Button onClick={() => setShowCreateTicketDialog(true)} className="gap-2">
                               <Plus className="h-4 w-4" />
                               Create Your First Ticket
                             </Button>
                           )}
                        </CardContent>
                     </Card>
                   ) : (
                     <div className="space-y-4">
                       {filteredTickets.map((ticket) => {
                         const priorityBadge = getTicketPriorityBadge(ticket.priority || 'medium');
                         const responses = ticket.responses || [];
                         return (
                           <Card 
                             key={ticket._id || ticket.id} 
                             className="cursor-pointer hover:shadow-md transition-shadow"
                             onClick={() => handleViewTicket(ticket)}
                             data-testid={`card-ticket-${ticket._id || ticket.id}`}
                           >
                             <CardContent className="p-4">
                               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 flex-wrap mb-2">
                                     <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                                   </div>
                                   <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                     {ticket.message || ticket.description || ''}
                                   </p>
                                   <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                     <Badge variant="outline" className="text-xs">
                                       {getCategoryLabel(ticket.category || 'general')}
                                     </Badge>
                                     <span>Created {formatTicketDate(ticket.createdAt)}</span>
                                     {responses.length > 0 && (
                                       <span className="flex items-center gap-1">
                                         <MessageSquare className="h-3 w-3" />
                                         {responses.length} response{responses.length !== 1 ? 's' : ''}
                                       </span>
                                     )}
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0">
                                   <Badge variant={priorityBadge.variant} className="text-xs">
                                     {priorityBadge.label}
                                   </Badge>
                                   <Badge 
                                     variant={getTicketStatusBadgeVariant(ticket.status)} 
                                     className={`text-xs ${
                                       ticket.status === 'open' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                       ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                       'bg-green-100 text-green-700 border-green-200'
                                     }`}
                                   >
                                     {getTicketStatusLabel(ticket.status)}
                                   </Badge>
                                   <Button variant="ghost" size="icon">
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         );
                       })}
                     </div>
                   )}
                </div>
             )}

          </main>
        </SidebarInset>
      </div>

      <Dialog open={showCreateTicketDialog} onOpenChange={setShowCreateTicketDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and our support team will get back to you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject *</Label>
              <Input
                id="ticket-subject"
                placeholder="Brief summary of your issue"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                data-testid="input-ticket-subject"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-category">Category *</Label>
                <Select 
                  value={newTicketForm.category} 
                  onValueChange={(value) => setNewTicketForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="select-ticket-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select 
                  value={newTicketForm.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setNewTicketForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger data-testid="select-ticket-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description *</Label>
              <Textarea
                id="ticket-description"
                placeholder="Please provide details about your issue..."
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
                data-testid="textarea-ticket-description"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateTicketDialog(false);
                setNewTicketForm({ subject: '', category: '', priority: 'medium', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={!newTicketForm.subject || !newTicketForm.category || !newTicketForm.description}
              data-testid="button-submit-ticket"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTicketDetailsDialog} onOpenChange={(open) => {
        setShowTicketDetailsDialog(open);
        if (!open) setSelectedTicket(null);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-lg">{selectedTicket.subject}</DialogTitle>
                    <DialogDescription className="mt-1">
                      Ticket #{selectedTicket.id} · Created {formatTicketDate(selectedTicket.createdAt)}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getTicketPriorityBadge(selectedTicket.priority).variant}>
                      {getTicketPriorityBadge(selectedTicket.priority).label} Priority
                    </Badge>
                    <Badge 
                      className={`${
                        selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        selectedTicket.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      {getTicketStatusLabel(selectedTicket.status)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{getCategoryLabel(selectedTicket.category)}</Badge>
                    <span>·</span>
                    <span>Last updated {formatTicketDate(selectedTicket.updatedAt)}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {selectedTicket.responses.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Conversation History
                    </h4>
                    <div className="space-y-3">
                      {selectedTicket.responses.map((response: any) => (
                        <div 
                          key={response.id} 
                          className={`p-4 rounded-lg ${
                            response.from === 'support' 
                              ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900' 
                              : 'bg-muted/50 border border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className={`text-xs ${response.from === 'support' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                                  {response.from === 'support' ? 'S' : 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {response.from === 'support' ? 'Support Team' : 'You'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTicketDate(response.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.status !== 'resolved' && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-100">Awaiting Response</p>
                        <p className="text-amber-700 dark:text-amber-300">
                          Our support team typically responds within 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100">Ticket Resolved</p>
                        <p className="text-green-700 dark:text-green-300">
                          This ticket has been resolved. If you need further assistance, please create a new ticket.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTicketDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your professional profile information.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                {isUnlocked && remainingTime > 0 && (
                  <div className="flex items-center gap-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span>{formatRemainingTime(remainingTime)}</span>
                  </div>
                )}
                <Button
                  variant={isUnlocked ? "outline" : "secondary"}
                  size="sm"
                  onClick={handleLockClick}
                  className={`gap-2 ${isUnlocked ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
                >
                  {isUnlocked ? (
                    <>
                      <LockOpen className="h-4 w-4" />
                      Lock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Unlock
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName" className="flex items-center gap-2">
                  First Name
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input 
                  id="edit-firstName" 
                  value={profileData?.userId?.profile?.firstName || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName" className="flex items-center gap-2">
                  Last Name
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input 
                  id="edit-lastName" 
                  value={profileData?.userId?.profile?.lastName || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="flex items-center gap-2">
                  Title
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Select 
                  value={editProfileForm.title}
                  onValueChange={(value) => setEditProfileForm(prev => ({ ...prev, title: value }))}
                  disabled={!isUnlocked}
                >
                  <SelectTrigger className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue placeholder="Select Title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Mx.">Mx.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialty" className="flex items-center gap-2">
                  Specialty
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Select 
                  value={editProfileForm.specialty}
                  onValueChange={(value) => setEditProfileForm(prev => ({ ...prev, specialty: value }))}
                  disabled={!isUnlocked}
                >
                  <SelectTrigger className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue placeholder="Select Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_practitioner">General Practitioner</SelectItem>
                    <SelectItem value="psychologist">Psychologist</SelectItem>
                    <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                    <SelectItem value="nutritionist">Nutritionist</SelectItem>
                    <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="life_coach">Life Coach</SelectItem>
                    <SelectItem value="wellness_coach">Wellness Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-businessName" className="flex items-center gap-2">
                Business Name
                {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Input 
                id="edit-businessName" 
                placeholder="Wellness Clinic"
                value={editProfileForm.businessName}
                onChange={(e) => setEditProfileForm(prev => ({ ...prev, businessName: e.target.value }))}
                disabled={!isUnlocked}
                className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="flex items-center gap-2">
                  Phone
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  id="edit-phone" 
                  placeholder="+44 7700 900000"
                  value={editProfileForm.phone}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isUnlocked}
                  className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="flex items-center gap-2">
                  Email
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input 
                  id="edit-email" 
                  value={profileData?.userId?.email || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-street" className="flex items-center gap-2">
                  Street Address
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  id="edit-street" 
                  placeholder="123 Health St"
                  value={editProfileForm.street}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, street: e.target.value }))}
                  disabled={!isUnlocked}
                  className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city" className="flex items-center gap-2">
                  City
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  id="edit-city" 
                  placeholder="London"
                  value={editProfileForm.city}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, city: e.target.value }))}
                  disabled={!isUnlocked}
                  className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postcode" className="flex items-center gap-2">
                  Postcode
                  {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  id="edit-postcode" 
                  placeholder="W1A 1AA"
                  value={editProfileForm.postcode}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, postcode: e.target.value }))}
                  disabled={!isUnlocked}
                  className={!isUnlocked ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-bio" className="flex items-center gap-2">
                Bio
                {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Textarea 
                id="edit-bio" 
                placeholder="Tell patients about your experience and approach..."
                className={`min-h-[100px] ${!isUnlocked ? "bg-muted cursor-not-allowed" : ""}`}
                value={editProfileForm.bio}
                onChange={(e) => setEditProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isUnlocked}
              />
            </div>
            
            {!isUnlocked && (
              <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 text-sm text-muted-foreground">
                <Lock className="h-5 w-5" />
                <span>Click "Unlock" above and enter your password to edit your profile.</span>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowEditProfileDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending || !isUnlocked}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordVerifyDialog} onOpenChange={(open) => {
        setShowPasswordVerifyDialog(open);
        if (!open) setVerifyPasswordInput('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              Please enter your password to unlock the profile fields for 5 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verifyPassword">Password</Label>
              <Input
                id="verifyPassword"
                type="password"
                placeholder="Enter your password"
                value={verifyPasswordInput}
                onChange={(e) => setVerifyPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyPassword();
                  }
                }}
                disabled={isVerifyingPassword}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordVerifyDialog(false);
                setVerifyPasswordInput('');
              }}
              disabled={isVerifyingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword || !verifyPasswordInput}
            >
              {isVerifyingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Unlock Fields
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showIssueCertificateDialog} onOpenChange={(open) => {
        setShowIssueCertificateDialog(open);
        if (!open) resetCertificateForm();
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Issue New Certificate
            </DialogTitle>
            <DialogDescription>
              Create a medical certificate for a patient. A unique verification code will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Patient *</Label>
              <p className="text-sm text-muted-foreground">Only patients who have booked appointments or sent you messages are shown.</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your connected patients..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  className="pl-10"
                />
                {isSearchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {userSearchResults.length > 0 && !selectedUser && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {userSearchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserSearchQuery('');
                        setUserSearchResults([]);
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profile?.avatarUrl} />
                        <AvatarFallback>
                          {user.profile?.firstName?.charAt(0) || ''}{user.profile?.lastName?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.profile?.avatarUrl} />
                      <AvatarFallback>
                        {selectedUser.profile?.firstName?.charAt(0) || ''}{selectedUser.profile?.lastName?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {userSearchResults.length === 0 && !isSearchingUsers && !selectedUser && userSearchQuery.length === 0 && (
                <div className="p-4 border rounded-lg bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">No connected patients found. Patients will appear here after they book an appointment or send you a message.</p>
                </div>
              )}
              
              {userSearchQuery.length >= 1 && userSearchResults.length === 0 && !isSearchingUsers && !selectedUser && (
                <p className="text-sm text-muted-foreground">No connected patients found matching "{userSearchQuery}"</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cert-type">Certificate Type *</Label>
                <Select 
                  value={certificateForm.type}
                  onValueChange={(value) => setCertificateForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="cert-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick_note">Sick Note</SelectItem>
                    <SelectItem value="fitness_certificate">Fitness Certificate</SelectItem>
                    <SelectItem value="medical_clearance">Medical Clearance</SelectItem>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cert-title">Title *</Label>
                <Input
                  id="cert-title"
                  placeholder="e.g., Medical Certificate"
                  value={certificateForm.title}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
            </div>

            {certificateForm.type === 'other' && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label htmlFor="cert-custom-type">Specify Certificate Type *</Label>
                <Input
                  id="cert-custom-type"
                  placeholder="e.g., Travel Medical Certificate"
                  value={certificateForm.customType}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, customType: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cert-description">Description</Label>
              <Textarea
                id="cert-description"
                placeholder="Describe the purpose of this certificate..."
                value={certificateForm.description}
                onChange={(e) => setCertificateForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cert-issue-date">Issue Date *</Label>
                <Input
                  id="cert-issue-date"
                  type="date"
                  value={certificateForm.issueDate}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cert-expiry-date">Expiry Date (Optional)</Label>
                <Input
                  id="cert-expiry-date"
                  type="date"
                  value={certificateForm.expiryDate}
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cert-notes">Additional Notes</Label>
              <Textarea
                id="cert-notes"
                placeholder="Any additional details or notes..."
                value={certificateForm.notes}
                onChange={(e) => setCertificateForm(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Verification Code</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    A unique verification code will be automatically generated for this certificate.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowIssueCertificateDialog(false);
                resetCertificateForm();
              }}
              disabled={createCertificateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleIssueCertificate}
              disabled={createCertificateMutation.isPending || !selectedUser || !certificateForm.type || !certificateForm.title}
            >
              {createCertificateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Issue Certificate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertificateSuccessDialog} onOpenChange={(open) => {
        setShowCertificateSuccessDialog(open);
        if (!open) setCreatedCertificate(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Certificate Issued Successfully
            </DialogTitle>
            <DialogDescription>
              The certificate has been created and is now available to the patient.
            </DialogDescription>
          </DialogHeader>
          
          {createdCertificate && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{createdCertificate.type?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium">{createdCertificate.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span className="font-medium">
                    {new Date(createdCertificate.issueDate).toLocaleDateString()}
                  </span>
                </div>
                {createdCertificate.expiryDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-medium">
                      {new Date(createdCertificate.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Verification Code</p>
                    <p className="text-lg font-mono font-bold text-green-700 dark:text-green-300">
                      {createdCertificate.verificationCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyVerificationCode(createdCertificate.verificationCode)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowCertificateSuccessDialog(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
