import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  X,
  ChevronLeft,
  Loader2,
} from "lucide-react";

function getDisplayName(user: any) {
  if (!user) return "Unknown";
  if (user.profile?.displayName) return user.profile.displayName;
  const fn = user.profile?.firstName || "";
  const ln = user.profile?.lastName || "";
  if (fn || ln) return `${fn} ${ln}`.trim();
  return user.email || "Unknown";
}

function getInitials(user: any) {
  const name = getDisplayName(user);
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getRoleBadge(role: string) {
  if (role === "admin") return { label: "Admin", cls: "bg-violet-100 text-violet-700" };
  if (role === "manager") return { label: "Manager", cls: "bg-blue-100 text-blue-700" };
  if (role === "support") return { label: "Support", cls: "bg-sky-100 text-sky-700" };
  return { label: role, cls: "bg-gray-100 text-gray-700" };
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function StaffMessagesPage() {
  const currentUser = api.getUser();
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: convData, isLoading: convsLoading } = useQuery({
    queryKey: ["staff-conversations"],
    queryFn: async () => {
      const res = await api.getStaffConversations();
      return res.data?.conversations || [];
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: membersData } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const res = await api.getStaffMembers();
      return res.data?.members || [];
    },
    staleTime: 60000,
  });

  const { data: convMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["staff-messages", activeConvId],
    queryFn: async () => {
      if (!activeConvId) return null;
      const res = await api.getStaffConversationMessages(activeConvId);
      return res.data;
    },
    enabled: !!activeConvId,
    refetchInterval: 4000,
    staleTime: 2000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConvId) throw new Error("No conversation");
      return api.sendStaffMessage(activeConvId, content);
    },
    onSuccess: () => {
      setComposerText("");
      queryClient.invalidateQueries({ queryKey: ["staff-messages", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["staff-conversations"] });
    },
  });

  const startConvMutation = useMutation({
    mutationFn: async ({ recipientId, message }: { recipientId: string; message?: string }) => {
      return api.createStaffConversation(recipientId, message);
    },
    onSuccess: (res) => {
      const convId = res.data?.conversation?._id;
      if (convId) {
        setActiveConvId(convId);
        setMobileShowChat(true);
      }
      setShowNewChat(false);
      setMemberSearch("");
      queryClient.invalidateQueries({ queryKey: ["staff-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["staff-messages", convId] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markStaffConversationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["staff-unread-count"] });
    },
  });

  useEffect(() => {
    if (activeConvId) {
      markReadMutation.mutate(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [convMessages?.messages]);

  const handleSend = () => {
    const text = composerText.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const conversations = convData || [];
  const members = membersData || [];

  const filteredMembers = memberSearch
    ? members.filter((m: any) =>
        getDisplayName(m).toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  const activeConv = conversations.find((c: any) => c._id === activeConvId);
  const otherParticipant = convMessages?.otherParticipant || activeConv?.otherParticipant;
  const messages = convMessages?.messages || [];

  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    setShowNewChat(false);
    setMobileShowChat(true);
  };

  const handleStartNewChat = (memberId: string) => {
    const existing = conversations.find((c: any) =>
      c.participants?.some((p: any) => (p._id || p) === memberId)
    );
    if (existing) {
      handleSelectConv(existing._id);
    } else {
      startConvMutation.mutate({ recipientId: memberId });
    }
  };

  return (
    <AdminLayout title="Staff Messages">
      <div className="flex gap-0 h-[calc(100vh-8rem)] rounded-xl border border-border/60 overflow-hidden shadow-sm bg-card">
        {/* Left panel */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border/60 flex flex-col bg-background",
            mobileShowChat && "hidden md:flex"
          )}
        >
          {/* Header */}
          <div className="px-4 py-4 border-b border-border/60 bg-background">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">Messages</h2>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setShowNewChat(!showNewChat);
                  setMemberSearch("");
                }}
              >
                {showNewChat ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showNewChat ? "Cancel" : "New"}
              </Button>
            </div>
            {showNewChat ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search staff..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-muted/40"
                />
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 h-8 text-sm bg-muted/40"
                  readOnly
                />
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            {showNewChat ? (
              <div className="p-2 space-y-0.5">
                {filteredMembers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">No staff found</div>
                ) : (
                  filteredMembers.map((member: any) => {
                    const role = getRoleBadge(member.role);
                    return (
                      <button
                        key={member._id}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
                        onClick={() => handleStartNewChat(member._id)}
                        disabled={startConvMutation.isPending}
                      >
                        <Avatar className="h-9 w-9 shrink-0 border border-border/40">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{getDisplayName(member)}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", role.cls)}>
                          {role.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {convsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground">Click "New" to message a team member</p>
                  </div>
                ) : (
                  conversations.map((conv: any) => {
                    const other = conv.otherParticipant;
                    const isActive = conv._id === activeConvId;
                    const unread = conv.unreadCount || 0;
                    return (
                      <button
                        key={conv._id}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left",
                          isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60"
                        )}
                        onClick={() => handleSelectConv(conv._id)}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-9 w-9 border border-border/40">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {getInitials(other)}
                            </AvatarFallback>
                          </Avatar>
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                              {unread > 9 ? "9+" : unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn("text-sm truncate", unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                              {getDisplayName(other)}
                            </p>
                            {conv.lastMessage?.createdAt && (
                              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.lastMessage.createdAt)}</span>
                            )}
                          </div>
                          {conv.lastMessage?.content && (
                            <p className={cn("text-xs truncate mt-0.5", unread > 0 ? "text-foreground" : "text-muted-foreground")}>
                              {conv.lastMessage.senderId?.toString() === currentUser?._id?.toString() ? "You: " : ""}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right panel - conversation */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background",
            !mobileShowChat && "hidden md:flex",
            mobileShowChat && "flex"
          )}
        >
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary/60" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground">Choose from the list or start a new message</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setShowNewChat(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Message
              </Button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 bg-background shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                  onClick={() => setMobileShowChat(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9 border border-border/40">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(otherParticipant)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{getDisplayName(otherParticipant)}</p>
                  {otherParticipant?.role && (
                    <p className="text-xs text-muted-foreground capitalize">{otherParticipant.role}</p>
                  )}
                </div>
                {otherParticipant?.role && (
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-flex", getRoleBadge(otherParticipant.role).cls)}>
                    {getRoleBadge(otherParticipant.role).label}
                  </span>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg: any, idx: number) => {
                      const isMe = msg.senderId?._id?.toString() === currentUser?._id?.toString() ||
                        msg.senderId?.toString() === currentUser?._id?.toString();
                      const sender = msg.senderId;
                      const prevMsg = messages[idx - 1];
                      const showAvatar =
                        !prevMsg ||
                        (prevMsg.senderId?._id || prevMsg.senderId)?.toString() !==
                          (msg.senderId?._id || msg.senderId)?.toString();

                      return (
                        <div
                          key={msg._id}
                          className={cn(
                            "flex gap-2 items-end",
                            isMe ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          {!isMe && (
                            <div className="shrink-0 w-7">
                              {showAvatar ? (
                                <Avatar className="h-7 w-7 border border-border/40">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {getInitials(sender)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] group",
                              isMe ? "items-end" : "items-start",
                              "flex flex-col gap-0.5"
                            )}
                          >
                            {showAvatar && !isMe && (
                              <p className="text-[10px] text-muted-foreground ml-1">{getDisplayName(sender)}</p>
                            )}
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              )}
                            >
                              {msg.content}
                            </div>
                            <p className="text-[10px] text-muted-foreground mx-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Composer */}
              <div className="px-4 py-3 border-t border-border/60 bg-background shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-muted/40 border-border/50 focus-visible:ring-1"
                    disabled={sendMutation.isPending}
                    maxLength={2000}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleSend}
                    disabled={!composerText.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
