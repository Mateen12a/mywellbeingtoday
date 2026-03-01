const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const url = endpoint.startsWith('/api') ? `${API_BASE}${endpoint}` : `${API_BASE}/api${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            return retryResponse.json();
          }
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      throw error;
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data?.requiresOtpReverification) {
        this.clearTokens();
        const email = data.data.email || '';
        window.location.href = `/auth/reverify?email=${encodeURIComponent(email)}`;
        return false;
      }
      if (data.success && data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async register(email: string, password: string, firstName: string, lastName: string, occupation?: string, occupationOther?: string, organisation?: string) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string; requiresVerification?: boolean; email?: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, occupation, occupationOther, organisation }),
      }
    );

    if (response.success && response.data && !response.data.requiresVerification) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
    }

    return response;
  }

  async registerProvider(email: string, password: string, firstName: string, lastName: string, providerData: any) {
    const response = await this.request<{ user: any; provider: any; accessToken: string; refreshToken: string; requiresVerification?: boolean; email?: string }>(
      '/auth/register-provider',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, providerData }),
      }
    );

    if (response.success && response.data && !response.data.requiresVerification) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
    }

    return response;
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string; requiresVerification?: boolean; email?: string; rememberMe?: boolean; isLoginVerification?: boolean }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      }
    );

    if (response.success && response.data && !response.data.requiresVerification) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
      localStorage.setItem('rememberMe', String(!!rememberMe));
    }

    return response;
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async reverifyOTP(email: string, otp: string): Promise<ApiResponse> {
    return this.request('/auth/reverify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resendOTP(email: string): Promise<ApiResponse> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    // Always clear local tokens first, then try to notify the server
    this.clearTokens();
    try {
      // Try to notify server but don't fail if it doesn't work
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Ignore server errors - local logout is what matters
    }
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(profile: any) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
  }

  async updateSettings(settings: any) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async verifyPassword(password: string) {
    return this.request<void>('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async resetPasswordWithOTP(email: string, otp: string, newPassword: string) {
    return this.request('/auth/reset-password-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async createActivity(data: any) {
    return this.request<{ activity: any }>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActivities(params?: { page?: number; limit?: number; category?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ activities: any[]; pagination: any }>(`/activities?${query}`);
  }

  async getTodayActivities() {
    return this.request<{ activities: any[]; summary: any }>('/activities/today');
  }

  async getActivityStats(days = 30) {
    return this.request<any>(`/activities/stats?days=${days}`);
  }

  async updateActivity(id: string, data: any) {
    return this.request<{ activity: any }>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: string) {
    return this.request<void>(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  async createMood(data: any) {
    return this.request<{ moodLog: any }>('/moods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMoods(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ moodLogs: any[]; pagination: any }>(`/moods?${query}`);
  }

  async getTodayMood() {
    return this.request<{ moodLogs: any[]; summary: any }>('/moods/today');
  }

  async getMoodStats(days = 30) {
    return this.request<any>(`/moods/stats?days=${days}`);
  }

  async quickMoodLog(moodScore: number, mood?: string) {
    return this.request<{ moodLog: any }>('/moods/quick', {
      method: 'POST',
      body: JSON.stringify({ moodScore, mood }),
    });
  }

  async getMoodLogs(params?: { page?: number; limit?: number; mood?: string; startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ moodLogs: any[]; pagination: any }>(`/moods?${query}`);
  }

  async createMoodLog(data: any) {
    return this.request<{ moodLog: any }>('/moods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMoodLog(id: string, data: any) {
    return this.request<{ moodLog: any }>(`/moods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMoodLog(id: string) {
    return this.request<void>(`/moods/${id}`, {
      method: 'DELETE',
    });
  }

  async generateWellbeingReport(days = 7) {
    return this.request<{ report: any }>('/wellbeing/report', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  async getWellbeingReports(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ reports: any[]; pagination: any }>(`/wellbeing/reports?${query}`);
  }

  async getLatestReport() {
    return this.request<{ report: any }>('/wellbeing/reports/latest');
  }

  async getDashboardSummary() {
    return this.request<{ summary: any }>('/wellbeing/dashboard');
  }

  async searchProviders(params?: any) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ providers: any[]; pagination: any }>(`/providers/search?${query}`);
  }

  async getProviders(params?: { 
    specialty?: string; 
    city?: string; 
    search?: string;
    acceptingNew?: boolean | string;
    consultationType?: string;
    page?: number; 
    limit?: number;
  }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.request<{ providers: any[]; pagination: any }>(`/providers/search?${query}`);
  }

  async getProvider(id: string) {
    return this.request<{ provider: any }>(`/providers/${id}`);
  }

  async createAppointment(data: any) {
    return this.request<{ appointment: any }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAppointments(params?: any) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ appointments: any[]; pagination: any }>(`/appointments?${query}`);
  }

  async getUpcomingAppointment() {
    return this.request<{ appointment: any }>('/appointments/upcoming');
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.request<{ appointment: any }>(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async checkPendingWithProvider(providerId: string) {
    return this.request<{ hasPending: boolean; appointment: any }>(`/appointments/pending-with/${providerId}`);
  }

  async getAdminUsers(params?: any) {
    const filteredParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ) : {};
    const query = new URLSearchParams(filteredParams as any).toString();
    return this.request<{ users: any[]; pagination: any }>(`/admin/users${query ? `?${query}` : ''}`);
  }

  async updateAdminUser(id: string, data: any) {
    return this.request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAdminProviders(params?: any) {
    const filteredParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ) : {};
    const query = new URLSearchParams(filteredParams as any).toString();
    return this.request<{ providers: any[]; pagination: any }>(`/admin/providers${query ? `?${query}` : ''}`);
  }

  async verifyProvider(id: string) {
    return this.request<{ provider: any }>(`/admin/providers/${id}/verify`, {
      method: 'POST',
    });
  }

  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async getAuditLogs(params?: any) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ logs: any[]; pagination: any }>(`/admin/audit-logs?${query}`);
  }

  async getSuperAdminStats() {
    return this.request<any>('/admin/superadmin-stats');
  }

  async getSubscriptionAnalytics() {
    return this.request<any>('/admin/subscription-analytics');
  }

  async getAdminAIInsights() {
    return this.request<{
      insights: {
        platformHealth: {
          status: 'healthy' | 'attention_needed' | 'critical';
          summary: string;
          metrics: Array<{ label: string; value: string; trend: 'up' | 'down' | 'stable' }>;
        };
        suggestions: Array<{ priority: 'high' | 'medium' | 'low'; title: string; description: string }>;
        userAlerts: Array<{ type: string; count: number; action: string }>;
        providerRecommendations: Array<{ type: string; message: string }>;
        source: 'ai' | 'fallback';
        generatedAt: string;
      };
      platformData: any;
    }>('/admin/ai-insights');
  }

  async rejectProvider(id: string, reason?: string) {
    return this.request<{ provider: any }>(`/admin/providers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async suspendProvider(id: string, reason?: string) {
    return this.request<{ provider: any }>(`/admin/providers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unsuspendProvider(id: string) {
    return this.request<{ provider: any }>(`/admin/providers/${id}/unsuspend`, {
      method: 'POST',
    });
  }

  async unverifyProvider(id: string, reason?: string) {
    return this.request<{ provider: any }>(`/admin/providers/${id}/unverify`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async disableUser(id: string) {
    return this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async createProviderProfile(data: any) {
    return this.request<{ provider: any }>('/providers/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProviderProfile() {
    return this.request<{ provider: any }>('/providers/profile/me');
  }

  async updateProviderProfile(data: any) {
    return this.request<{ provider: any }>('/providers/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProviderAppointments(params?: any) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ appointments: any[]; pagination: any }>(`/providers/appointments?${query}`);
  }

  async updateAppointmentStatus(appointmentId: string, status: string, providerNotes?: string) {
    return this.request<{ appointment: any }>(`/providers/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, providerNotes }),
    });
  }

  async getSharedReports() {
    return this.request<{ reports: any[] }>('/providers/shared-reports');
  }

  async searchUsersForCertificate(search: string) {
    return this.request<{ users: any[] }>(`/providers/users/search?search=${encodeURIComponent(search)}`);
  }

  async getProviderAIInsights() {
    return this.request<{ 
      insights: {
        summary: {
          totalPending: number;
          totalUpcoming: number;
          totalSharedReports: number;
          quickSummary: string;
        };
        patientCareInsights: Array<{
          patientName: string;
          insight: string;
          priority: 'high' | 'medium' | 'low';
        }>;
        suggestedFollowUps: Array<{
          patientName: string;
          reason: string;
          urgency: 'urgent' | 'soon' | 'routine';
        }>;
        actionItems: string[];
        source: 'ai' | 'fallback';
      };
    }>('/providers/ai-insights');
  }

  async providerAiChat(message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) {
    return this.request<{ message: string; sources: string[] }>('/providers/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }

  async getProviderConversations() {
    return this.request<{
      conversations: Array<{
        _id: string;
        providerId: string;
        userId: string;
        title: string;
        lastMessageAt: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/providers/ai-conversations');
  }

  async createProviderConversation() {
    return this.request<{
      conversation: {
        _id: string;
        providerId: string;
        userId: string;
        title: string;
        lastMessageAt: string;
        createdAt: string;
      };
    }>('/providers/ai-conversations', {
      method: 'POST'
    });
  }

  async getProviderConversation(conversationId: string) {
    return this.request<{
      conversation: {
        _id: string;
        providerId: string;
        title: string;
        lastMessageAt: string;
      };
      messages: Array<{
        _id: string;
        conversationId: string;
        role: 'user' | 'assistant';
        content: string;
        sources?: string[];
        createdAt: string;
      }>;
    }>(`/providers/ai-conversations/${conversationId}`);
  }

  async updateProviderConversationTitle(conversationId: string, title: string) {
    return this.request<{
      conversation: {
        _id: string;
        title: string;
      };
    }>(`/providers/ai-conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    });
  }

  async deleteProviderConversation(conversationId: string) {
    return this.request<{ message: string }>(`/providers/ai-conversations/${conversationId}`, {
      method: 'DELETE'
    });
  }

  async sendProviderChatMessage(conversationId: string, message: string) {
    return this.request<{
      userMessage: {
        _id: string;
        role: 'user';
        content: string;
        createdAt: string;
      };
      assistantMessage: {
        _id: string;
        role: 'assistant';
        content: string;
        answer: string;
        sources: string[];
        createdAt: string;
      };
    }>(`/providers/ai-conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getAISuggestedProviders(concerns?: string) {
    const query = concerns ? `?concerns=${encodeURIComponent(concerns)}` : '';
    return this.request<{ 
      aiSuggestion: {
        suggestedSpecialties: string[];
        reasoning: string;
        urgency: string;
        personalizedMessage: string;
        source: string;
      };
      providers: any[];
      userWellbeingSnapshot: {
        overallScore: number;
        wellbeingLevel: string;
        avgMoodScore: number | null;
      };
    }>(`/providers/ai-suggestions${query}`);
  }

  async downloadReport(reportId: string) {
    return this.request<{ report: any }>(`/wellbeing/reports/${reportId}`);
  }

  async getConversations(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ conversations: any[]; pagination: any }>(`/messages/conversations?${query}`);
  }

  async getConversationMessages(conversationId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ conversation: any; messages: any[]; pagination: any }>(
      `/messages/conversations/${conversationId}?${query}`
    );
  }

  async createConversation(data: { participantId: string; message?: string }) {
    return this.request<{ conversation: any }>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(conversationId: string, content: string, type: string = 'text') {
    return this.request<{ message: any }>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request<{ message: any }>(`/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  async getUnreadCount() {
    return this.request<{ unreadCount: number }>('/messages/unread-count');
  }

  async getCertificates(params?: { page?: number; limit?: number; type?: string; status?: string }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.request<{ certificates: any[]; pagination: any }>(`/certificates?${query}`);
  }

  async getCertificate(id: string) {
    return this.request<{ certificate: any }>(`/certificates/${id}`);
  }

  async createCertificate(data: {
    userId: string;
    type: string;
    title: string;
    description?: string;
    issueDate: string;
    expiryDate?: string;
    validFrom?: string;
    validUntil?: string;
    documentUrl?: string;
    issuedBy?: { name?: string; title?: string; organization?: string; registrationNumber?: string };
    notes?: string;
  }) {
    return this.request<{ certificate: any }>('/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCertificate(id: string, data: any) {
    return this.request<{ certificate: any }>(`/certificates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCertificate(id: string) {
    return this.request<void>(`/certificates/${id}`, {
      method: 'DELETE',
    });
  }

  async getCertificateSuggestion(userId: string, certificateType: string) {
    return this.request<{ suggestion: {
      suggestedTitle: string;
      suggestedDescription: string;
      suggestedNotes: string;
      reasoning: string;
      source: string;
    } }>('/certificates/ai-suggest', {
      method: 'POST',
      body: JSON.stringify({ userId, certificateType }),
    });
  }

  async reportConversation(data: { conversationId: string; reason: string; description?: string }) {
    return this.request<{ reportId: string }>('/messages/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPlatformActivity(params?: { type?: string; userId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.request<{ activities: any[]; counts: any; pagination: any }>(`/admin/activity?${query}`);
  }

  async getReportedChats(params?: { status?: string; page?: number; limit?: number }) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.request<{ reports: any[]; pendingCount: number; pagination: any }>(`/admin/reported-chats?${query}`);
  }

  async getReportedChatDetails(id: string) {
    return this.request<{ report: any }>(`/admin/reported-chats/${id}`);
  }

  async resolveReportedChat(id: string, data: { status: string; resolution?: string }) {
    return this.request<{ report: any }>(`/admin/reported-chats/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createSupportTicket(subject: string, message: string, options?: { category?: string; priority?: string; userRole?: string }) {
    return this.request<{ ticket: any }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, message, ...options }),
    });
  }

  async getSupportTickets(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ tickets: any[]; pagination: any }>(`/support/tickets?${query}`);
  }

  async getAdminSupportTickets(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ tickets: any[]; stats: any; pagination: any }>(`/support/admin/tickets?${query}`);
  }

  async updateSupportTicket(id: string, data: { status?: string; assignToSelf?: boolean }) {
    return this.request<{ ticket: any }>(`/support/admin/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async respondToSupportTicket(id: string, message: string) {
    return this.request<{ ticket: any }>(`/support/admin/tickets/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAdmins() {
    return this.request<{ admins: any[] }>('/admin/admins');
  }

  async createAdmin(data: { email: string; password: string; firstName: string; lastName: string; role: 'admin' | 'manager' }) {
    return this.request<{ user: any }>('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubscription() {
    return this.request<{
      subscription: {
        _id: string;
        userId: string;
        plan: 'free' | 'starter' | 'pro' | 'premium' | 'team' | 'franchise';
        status: 'active' | 'cancelled' | 'expired' | 'trial';
        stripeSubscriptionId?: string;
        stripeCustomerId?: string;
        trialEndsAt?: string;
        currentPeriodEnd?: string;
        cancelledAt?: string;
        usage?: {
          activityLogs: number;
          moodLogs: number;
          reportDownloads: number;
          directoryAccess: number;
          aiInteractions: number;
        };
        usagePeriodStart?: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        trialDaysRemaining: number;
      };
      pricing: Record<string, { price: number | null; interval: string | null; displayPrice: string; name: string }>;
      planLimits: Record<string, Record<string, number>>;
      stripeConfigured: boolean;
    }>('/subscription');
  }

  async startTrial() {
    return this.request<{
      subscription: any;
    }>('/subscription/start-trial', {
      method: 'POST',
    });
  }

  async upgradeSubscription(plan: string) {
    return this.request<{
      subscription: any;
      pricing: any;
    }>('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async cancelSubscription() {
    return this.request<{
      subscription: any;
    }>('/subscription/cancel', {
      method: 'POST',
    });
  }

  async getSubscriptionPricing() {
    return this.request<{
      pricing: Record<string, { price: number | null; interval: string | null; displayPrice: string; name: string }>;
      planLimits: Record<string, Record<string, number>>;
      trialDays: number;
      stripeConfigured: boolean;
    }>('/subscription/pricing');
  }

  async checkUsage(feature: string) {
    return this.request<{
      allowed: boolean;
      reason?: string;
      currentUsage?: number;
      limit?: number;
    }>('/subscription/check-usage', {
      method: 'POST',
      body: JSON.stringify({ feature }),
    });
  }

  async getUsage() {
    return this.request<{
      plan: string;
      usage: Record<string, number>;
      limits: Record<string, number>;
      usagePeriodStart: string;
    }>('/subscription/usage');
  }

  async createCheckoutSession(plan: string) {
    return this.request<{
      checkoutUrl?: string;
      sessionId?: string;
    }>('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async uploadFile(file: string, type: 'profile-picture' | 'chat-attachment' | 'document' | 'certificate' | 'report', extra?: Record<string, any>) {
    return this.request<{
      url: string;
      publicId: string;
      format: string;
      bytes: number;
    }>(`/upload/${type}`, {
      method: 'POST',
      body: JSON.stringify({ file, ...extra }),
    });
  }

  async getUploadStatus() {
    return this.request<{ configured: boolean }>('/upload/status');
  }

  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<ApiResponse> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (unreadOnly) params.set('unreadOnly', 'true');
    return this.request(`/notifications?${params.toString()}`);
  }

  async getUnreadNotificationCount(): Promise<ApiResponse> {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/mark-all-read', { method: 'PUT' });
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  async getVapidPublicKey(): Promise<ApiResponse> {
    return this.request('/push/vapid-key');
  }

  async subscribeToPush(subscription: PushSubscription): Promise<ApiResponse> {
    const sub = subscription.toJSON();
    return this.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys
      }),
    });
  }

  async unsubscribeFromPush(endpoint: string): Promise<ApiResponse> {
    return this.request('/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  async getPushSubscriptionStatus(): Promise<ApiResponse> {
    return this.request('/push/status');
  }

  async getSimpleInsights(params: { avgMood: number; avgStress?: number | null; avgEnergy?: number | null; totalActivities: number; moodTrend?: string; stressTrend?: string }) {
    const query = new URLSearchParams();
    query.set('avgMood', String(params.avgMood));
    if (params.avgStress != null) query.set('avgStress', String(params.avgStress));
    if (params.avgEnergy != null) query.set('avgEnergy', String(params.avgEnergy));
    query.set('totalActivities', String(params.totalActivities));
    if (params.moodTrend) query.set('moodTrend', params.moodTrend);
    if (params.stressTrend) query.set('stressTrend', params.stressTrend);
    return this.request(`/ai/simple-insights?${query.toString()}`);
  }

  async getMoodSuggestion(activityData: { category: string; title: string; description?: string }) {
    return this.request<{
      suggestion: {
        suggestedMood: string;
        alternativeMood: string;
        rationale: string;
        confidence: 'high' | 'medium' | 'low';
        generatedBy: 'ai' | 'rule-based';
      };
    }>('/ai/mood-suggestion', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }
}

export const api = new ApiClient();
export default api;
