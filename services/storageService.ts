
import { User, Lead, Product, Negotiation, Order, Category, Notification, Payment, UserRole, LeadStatus, NegotiationStatus, Quote, Service } from '../types';

const KEYS = {
  USERS: 'yd_registry_users',
  PRODUCTS: 'yd_registry_products',
  LEADS: 'yd_registry_leads',
  NEGS: 'yd_registry_negs',
  PAYMENTS: 'yd_registry_payments',
  NOTIFS: 'yd_registry_notifs'
};

export const storageService = {
  API_URL: '/api/v1',
  token: localStorage.getItem('yd_auth_token') || '',
  SUPER_ADMIN_EMAIL: (import.meta as any).env?.VITE_SUPER_ADMIN_EMAIL || 'htharshit@gmail.com',
  isOnline: false,

  async init() {
    console.log(`[STORAGE] Initializing with API_URL: ${this.API_URL}`);
    this.token = localStorage.getItem('yd_auth_token') || '';
    await this.checkHealth();
  },

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  },

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.API_URL}/system/health`, { signal: AbortSignal.timeout(2000) });
      this.isOnline = res.ok;
      return res.ok;
    } catch (e) { 
      this.isOnline = false;
      return false; 
    }
  },

  async checkEmail(email: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      return data.exists;
    } catch (e) {
      return false;
    }
  },

  async register(userData: any) {
    try {
      const res = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (e) {
      return { status: 'error', message: 'Registry offline.' };
    }
  },

  async createLead(lead: Lead): Promise<{ status: string; id: string }> {
    const res = await fetch(`${this.API_URL}/leads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(lead)
    });
    return res.json();
  },

  async createProduct(product: Product): Promise<{ status: string; id: string }> {
    const res = await fetch(`${this.API_URL}/products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async login(email: string, password?: string) {
    try {
      const res = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        this.token = data.token;
        localStorage.setItem('yd_auth_token', data.token);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'Identity check failed.' };
    }
  },

  // Fix: Added missing forgotPassword method to satisfy Login component requirements
  async forgotPassword(email: string) {
    try {
      const res = await fetch(`${this.API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (e) {
      return { status: 'error', message: 'Recovery service unreachable.' };
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await fetch(`${this.API_URL}/auth/me`, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        // Re-calculate permissions if not present or for consistency
        if (user && !user.permissions) {
          user.permissions = this.getPermissionsForRoles(user.roles);
        }
        return user;
      }
    } catch (e) {}
    return null;
  },

  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes(permission) || perms.includes('admin:*');
  },

  getPermissionsForRoles(roles: string[]) {
    const permMap: Record<string, string[]> = {
      'BUYER': ['leads:create', 'leads:read', 'negotiations:manage', 'listings:read', 'profile:edit', 'cart:manage'],
      'SELLER': ['products:manage', 'leads:read', 'negotiations:manage', 'listings:read', 'profile:edit'],
      'ADMIN': ['admin:*', 'leads:read', 'products:read', 'negotiations:manage', 'listings:read', 'admin:dashboard:access'],
      'SUPER_ADMIN': ['admin:*']
    };
    
    const perms = new Set<string>();
    roles.forEach(role => {
      (permMap[role] || []).forEach(p => perms.add(p));
    });
    return Array.from(perms);
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${this.API_URL}/admin/users`, { headers: this.getHeaders() });
      const data = await res.json();
      return data.users || [];
    } catch (e) { return []; }
  },

  async adminUpdateUser(adminId: string, userId: string, updates: Partial<User>) {
    try {
      const res = await fetch(`${this.API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async resetDatabase() {
    try {
      const res = await fetch(`${this.API_URL}/admin/reset-db`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      return await res.json();
    } catch (e) { return { status: 'error', message: 'Reset service unreachable.' }; }
  },

  async getLeads(lat?: number, lng?: number, radius?: number): Promise<Lead[]> {
    try {
      let url = `${this.API_URL}/leads`;
      if (lat && lng && radius) {
        url += `?lat=${lat}&lng=${lng}&radius=${radius}`;
      }
      const res = await fetch(url, { headers: this.getHeaders() });
      const data = await res.json();
      return data.leads || [];
    } catch (e) { return []; }
  },

  async saveLead(lead: Lead) {
    try {
      const res = await fetch(`${this.API_URL}/leads`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(lead) });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${this.API_URL}/products`, { headers: this.getHeaders() });
      const data = await res.json();
      return data.products || [];
    } catch (e) { return []; }
  },

  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch(`${this.API_URL}/services`, { headers: this.getHeaders() });
      const data = await res.json();
      return data.services || [];
    } catch (e) { return []; }
  },

  async saveProduct(product: Product) {
    try {
      const res = await fetch(`${this.API_URL}/products`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(product) });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async submitQuote(quote: Partial<Quote>) {
    try {
      const res = await fetch(`${this.API_URL}/quotes`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(quote) });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async getQuotesForLead(leadId: string): Promise<Quote[]> {
    try {
      const res = await fetch(`${this.API_URL}/quotes/${leadId}`, { headers: this.getHeaders() });
      const data = await res.json();
      return data.quotes || [];
    } catch (e) { return []; }
  },

  async startNegotiation(neg: any) {
    try {
      const res = await fetch(`${this.API_URL}/negotiations/start`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(neg) });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async getNegotiations(userId: string): Promise<Negotiation[]> {
    try {
      const res = await fetch(`${this.API_URL}/negotiations/${userId}`, { headers: this.getHeaders() });
      const data = await res.json();
      return data.negotiations || [];
    } catch (e) { return []; }
  },

  async createRazorpayOrder(amount: number, leadId: string, type: string) {
    return { amount: amount * 100, orderId: `ORD-${Date.now()}`, isExempt: false };
  },

  async verifyPayment(paymentData: any) {
    return { success: true };
  },

  // Fix: Explicitly typed return value to include optional error property for NegotiationEngine
  async bypassExemption(leadId: string, type: string, negId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  },

  async deleteLead(id: string) {
    try {
      const res = await fetch(`${this.API_URL}/leads/${id}`, { method: 'DELETE', headers: this.getHeaders() });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async deleteProduct(id: string) {
    try {
      const res = await fetch(`${this.API_URL}/products/${id}`, { method: 'DELETE', headers: this.getHeaders() });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async updateUser(userId: string, updates: Partial<User>) {
    try {
      const res = await fetch(`${this.API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (e) { return { status: 'error' }; }
  },

  async getGovernancePayments(): Promise<Payment[]> { return []; },
  async verifyGovernancePayment(id: string, action: string) { return { success: true }; },
  async approveGovernanceNegotiation(id: string, admin: string) { return { success: true }; },
  async getNotifications(id: string) { return []; },
  async getOrders(): Promise<Order[]> { return []; },
  logAction(user: any, action: string, details: string) {
    console.debug(`[AUDIT] ${user?.name}: ${action} | ${details}`);
  }
};
