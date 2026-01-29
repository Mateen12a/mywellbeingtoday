import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Send, Bot, User, Loader2, Plus, MessageSquare, Trash2, Edit2, Check, X, Mic,
  LayoutDashboard, Calendar as CalendarIcon, FileText, Award, Settings, LogOut, LifeBuoy, Copy, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useLocation } from "wouter";
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


function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult[0]) {
          const transcript = lastResult[0].transcript;
          onTranscript(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  return { isListening, isSupported, toggleListening };
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt?: string;
};

type Conversation = {
  _id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  isCreating,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background">
      <div className="p-4 border-b">
        <Button 
          onClick={onNewChat} 
          disabled={isCreating}
          className="w-full gap-2"
          data-testid="button-new-chat"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  selectedId === conv._id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => editingId !== conv._id && onSelect(conv._id)}
                data-testid={`conversation-${conv._id}`}
              >
                {editingId === conv._id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="h-7 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); saveEdit(); }}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(conv.lastMessageAt)}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); startEditing(conv._id, conv.title); }}
                        data-testid={`button-rename-${conv._id}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}
                        data-testid={`button-delete-${conv._id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn("flex mb-3 sm:mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className="flex flex-col gap-1 max-w-[92%] sm:max-w-[80%]">
        <div
          className={cn(
            "rounded-xl px-3 py-2 sm:px-5 sm:py-4",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border shadow-sm"
          )}
        >
          {isUser ? (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 sm:mb-3 last:mb-0 text-sm sm:text-[15px] leading-6 sm:leading-7">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 sm:pl-5 mb-2 sm:mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm sm:text-[15px] leading-6 sm:leading-7 pl-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-3 sm:mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold mb-2 mt-2 sm:mt-3 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold mb-2 mt-2 sm:mt-3 first:mt-0">{children}</h3>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-2 sm:p-3 rounded-lg overflow-x-auto mb-2 sm:mb-3 text-xs sm:text-sm">{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-3 sm:pl-4 italic my-2 sm:my-3">{children}</blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && (
          <div className="flex items-center gap-2 ml-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground"
              data-testid="button-copy-response"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

export default function ProviderAIAssistant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInputValue(prev => prev ? `${prev} ${text}` : text);
  }, []);
  
  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceTranscript);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/provider-dashboard" },
    { id: "bookings", label: "Appointments", icon: CalendarIcon, href: "/provider-dashboard?tab=bookings" },
    { id: "messages", label: "Messages", icon: MessageSquare, href: "/provider-dashboard?tab=messages" },
    { id: "reports", label: "Patient Reports", icon: FileText, href: "/provider-dashboard?tab=reports" },
    { id: "profile", label: "Profile", icon: User, href: "/provider-dashboard?tab=profile" },
    { id: "certificates", label: "Certificates", icon: Award, href: "/provider-dashboard?tab=certificates" },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles, isActive: true },
    { id: "support", label: "Support", icon: LifeBuoy, href: "/provider-dashboard?tab=support" },
    { id: "settings", label: "Settings", icon: Settings, href: "/provider-settings" },
  ];

  const handleLogout = async () => {
    try {
      await api.logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['/api/providers/ai-conversations'],
    queryFn: () => api.getProviderConversations(),
  });

  const { data: conversationData, isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/providers/ai-conversations', selectedConversationId],
    queryFn: () => selectedConversationId ? api.getProviderConversation(selectedConversationId) : null,
    enabled: !!selectedConversationId,
  });

  const createConversation = useMutation({
    mutationFn: () => api.createProviderConversation(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/ai-conversations'] });
      if (response.data?.conversation?._id) {
        setSelectedConversationId(response.data.conversation._id);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const renameConversation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => 
      api.updateProviderConversationTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/ai-conversations'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => api.deleteProviderConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/ai-conversations'] });
      if (selectedConversationId === conversationToDelete) {
        setSelectedConversationId(null);
      }
      setConversationToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      api.sendProviderChatMessage(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/ai-conversations', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/ai-conversations'] });
      setInputValue('');
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const conversations = conversationsData?.data?.conversations || [];
  const messages: Message[] = conversationData?.data?.messages?.map((m: any) => ({
    id: m._id,
    role: m.role,
    content: m.content,
    sources: m.sources,
    createdAt: m.createdAt,
  })) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    let convId = selectedConversationId;
    
    if (!convId) {
      const result = await createConversation.mutateAsync();
      convId = result.data?.conversation?._id || null;
      if (convId) {
        setSelectedConversationId(convId);
      }
    }
    
    if (convId) {
      sendMessage.mutate({ conversationId: convId, message: inputValue.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteClick = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation.mutate(conversationToDelete);
    }
    setDeleteDialogOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/10">
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 border-b flex items-center px-4 bg-white dark:bg-background">
            <a href="/" className="flex items-center gap-2 font-bold text-xl w-full text-foreground overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/logo5.png" alt="Logo" className="h-8 w-8 object-contain" />
              <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden font-serif">
                mywellbeingtoday
              </span>
            </a>
          </SidebarHeader>
          <SidebarContent className="bg-white dark:bg-background">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={(item as any).isActive}
                        onClick={() => {
                          if ((item as any).href) {
                            setLocation((item as any).href);
                          }
                        }}
                        tooltip={item.label}
                        size="lg"
                        className="transition-all duration-200"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className="p-2 bg-white dark:bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
            <div className="px-3 py-2 text-center border-t mt-2 group-data-[collapsible=icon]:hidden">
              <p className="text-[10px] text-muted-foreground">Built by Airfns Softwares</p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-hidden">
          <div className="flex h-screen">
            <div className="hidden md:flex w-72 border-r bg-white dark:bg-background flex-col">
              {loadingConversations ? (
                <div className="p-4 space-y-2 w-full">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversationId}
                  onSelect={handleSelectConversation}
                  onNewChat={() => createConversation.mutate()}
                  onRename={(id, title) => renameConversation.mutate({ id, title })}
                  onDelete={handleDeleteClick}
                  isCreating={createConversation.isPending}
                />
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 p-2 sm:p-4 border-b bg-white dark:bg-background">
                <div className="flex items-center gap-2 min-w-0">
                  <SidebarTrigger className="shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-semibold text-sm sm:text-lg truncate">AI Assistant</h1>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">Your provider workflow assistant</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden shrink-0 text-xs"
                  onClick={() => createConversation.mutate()}
                  disabled={createConversation.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>

              <ScrollArea className="flex-1 p-2 sm:p-4 bg-muted/10">
                {!selectedConversationId && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome to Your AI Assistant</h2>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-4 sm:mb-6">
                      I can help with patient communications, templates, and platform guidance.
                    </p>
                    <div className="grid gap-2 w-full max-w-md">
                      <Button 
                        variant="outline" 
                        className="justify-start text-left h-auto py-2 sm:py-3 text-xs sm:text-sm"
                        onClick={() => setInputValue("Create an appointment confirmation template")}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
                        <span className="truncate">Appointment confirmation template</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start text-left h-auto py-2 sm:py-3 text-xs sm:text-sm"
                        onClick={() => setInputValue("Help me write a follow-up message for a patient")}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
                        <span className="truncate">Write patient follow-up message</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start text-left h-auto py-2 sm:py-3 text-xs sm:text-sm"
                        onClick={() => setInputValue("What platform features can help me manage my practice?")}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
                        <span className="truncate">Platform features for my practice</span>
                      </Button>
                    </div>
                  </div>
                ) : loadingMessages ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="h-24 w-2/3 ml-auto" />
                    <Skeleton className="h-16 w-3/4" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}
                    {sendMessage.isPending && (
                      <div className="flex mb-3 sm:mb-4 justify-start">
                        <div className="bg-muted rounded-xl px-3 py-2 sm:px-4 sm:py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </ScrollArea>

              <div className="p-2 sm:p-4 border-t bg-white dark:bg-background">
                <div className="flex gap-2 max-w-4xl mx-auto">
                  <div className="flex-1 flex gap-2 items-center bg-muted/50 border rounded-lg px-2 sm:px-3">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      className="border-0 focus-visible:ring-0 flex-1 text-sm sm:text-base bg-transparent"
                      disabled={sendMessage.isPending}
                      data-testid="input-message"
                    />
                    {isSupported && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleListening}
                        className={cn(
                          "h-8 w-8 shrink-0",
                          isListening && "text-destructive animate-pulse"
                        )}
                        type="button"
                        data-testid="button-voice-input"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sendMessage.isPending}
                    className="shrink-0"
                    data-testid="button-send"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
