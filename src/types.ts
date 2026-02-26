
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  HYBRID = 'HYBRID',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  TECHNICIAN_VENDOR = 'TECHNICIAN_VENDOR',
  WHOLESALE_VENDOR = 'WHOLESALE_VENDOR',
  DIGITAL_MARKETER = 'DIGITAL_MARKETER',
  SEO_SPECIALIST = 'SEO_SPECIALIST',
  SMM_SPECIALIST = 'SMM_SPECIALIST',
  SMO_SPECIALIST = 'SMO_SPECIALIST'
}

export enum Permission {
  LEADS_CREATE = 'leads:create',
  LEADS_READ = 'leads:read',
  LEADS_UPDATE = 'leads:update',
  LEADS_DELETE = 'leads:delete',
  PRODUCTS_MANAGE = 'products:manage',
  PRODUCTS_READ = 'products:read',
  NEGOTIATIONS_MANAGE = 'negotiations:manage',
  ADMIN_USERS_EDIT = 'admin:users:edit',
  ADMIN_DASHBOARD_ACCESS = 'admin:dashboard:access',
  LISTINGS_READ = 'listings:read',
  PROFILE_EDIT = 'profile:edit',
  CART_MANAGE = 'cart:manage',
  SUPER_ADMIN_FULL_CONTROL = 'super_admin:full_control'
}

export enum LeadStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED', 
  ADMIN_REVIEW_PENDING = 'ADMIN_REVIEW_PENDING', 
  CLOSED = 'CLOSED', 
  NEGOTIATING = 'NEGOTIATING',
  FINALIZED = 'FINALIZED',
  HIDDEN = 'HIDDEN'
}

export enum NegotiationStatus {
  STARTED = 'STARTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  ACCEPTED = 'ACCEPTED',
  BUYER_PAYMENT_DONE = 'BUYER_PAYMENT_DONE',
  SELLER_PAYMENT_DONE = 'SELLER_PAYMENT_DONE',
  ADMIN_VERIFIED = 'ADMIN_VERIFIED',
  FINALIZED = 'FINALIZED',
  REJECTED = 'REJECTED'
}

export enum AvailabilityType {
  INSTANT = 'INSTANT',
  DAYS_1_3 = '1-3 DAYS',
  DAYS_3_7 = '3-7 DAYS',
  DAYS_7_PLUS = '7+ DAYS',
  PRE_ORDER = 'PRE-ORDER'
}

export type ExemptionScope = 'none' | 'buyer' | 'seller' | 'both';

// Fix: Added Category type
export type Category = string;

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isQuote?: boolean;
  quoteDetails?: {
    productName: string;
    quantity: number;
    quotedPrice: number;
    discount: number;
    visitRequired: boolean;
    visitCharges?: number;
    visitNotes?: string;
    installationRequired: boolean;
    installationCharges?: number;
    installationNotes?: string;
    otherCharges?: number;
    otherChargesRemark?: string;
    deliveryDays?: number;
    installationTime?: string;
    termsAndConditions?: string;
    finalCalculatedPrice: number;
    gstPercent: number;
    version: number;
    attachmentUrl?: string;
  };
  readReceipt?: boolean;
}

export interface Negotiation {
  id: string;
  entityId: string;
  entityType: 'LEAD' | 'PRODUCT' | 'SERVICE';
  buyerId: string;
  sellerId: string;
  currentOffer: number;
  status: NegotiationStatus;
  messages: Message[];
  createdAt: string;
  buyerPaymentId?: string;
  sellerPaymentId?: string;
}

// Fix: Added OrderStatus enum
export enum OrderStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Fix: Added Order interface
export interface Order {
  id: string;
  status: OrderStatus;
  serviceName: string;
  buyerId: string;
  buyerName: string;
  providerId?: string;
  providerName?: string;
  budget: number;
  finalPrice: number;
  phone: string;
  address?: string;
  city?: string;
  productItems?: any[];
  createdAt: string;
  paymentStatus: string;
  providerRatingFromBuyer?: number;
  buyerRatingFromProvider?: number;
}

// Fix: Added Service interface
export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  providerRole: UserRole;
  unit: string;
  vendorId: string;
  isPublished: boolean;
  visitRequired: boolean;
  visitCharges: number;
  installationRequired: boolean;
  installationCost: number;
  installationTime?: string;
  deliveryDays?: number;
  termsAndConditions?: string;
  gstPercent: number;
  hasSubOptions?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  isApproved: boolean;
  isVerified?: boolean;
  isLocked?: boolean;
  pending_verification?: boolean;
  pendingRole?: UserRole;
  authProvider: 'email' | 'google';
  profileImage: string;
  
  // Geospatial
  lat?: number;
  lng?: number;
  serviceRadius?: number; // in km
  
  // Structured Address
  house_no?: string;
  street?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  address?: string; // fallback
  
  // Company Details
  companyName?: string;
  gstNumber?: string;
  companyLogo?: string;
  concernedPersonName?: string;
  concernedPersonContact?: string;
  
  joinedDate: string;
  walletBalance?: number;
  photoUrl?: string;
  
  payment_exempt?: boolean;
  exemption_scope?: ExemptionScope;
  exemption_reason?: string;
  permissions?: string[];
  version?: number;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  companyName: string;
  brand: string;
  modelNumber: string;
  price: number;
  category: string;
  gstPercent: number;
  stock: number;
  specifications: string;
  description: string;
  availabilityType: AvailabilityType;
  availabilityDays: number;
  vendorId: string;
  vendorName: string;
  productImage: string;
  status?: 'active' | 'hidden';
  installationRequired?: boolean;
  installationCost?: number;
  visitRequired?: boolean;
  visitCharges?: number;
  installationTime?: string;
  termsAndConditions?: string;
}

export interface Lead {
  id: string;
  buyerId: string;
  buyerName: string;
  requirementName: string;
  description: string;
  budget: number;
  category: string;
  leadImage: string;
  quantity: number;
  gstRequired: boolean;
  negotiationAllowed: boolean;
  status: LeadStatus;
  createdAt: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
  // Fix: Added missing type property for LeadPostingForm
  type?: 'INDIVIDUAL' | 'BUSINESS';
}

export interface QuoteDetails {
  productName: string;
  quantity: number;
  quotedPrice: number;
  discount: number;
  visitRequired: boolean;
  visitCharges: number;
  installationRequired: boolean;
  installationCharges: number;
  otherCharges: number;
  otherChargesRemark: string;
  deliveryDays: number;
  installationTime: string;
  termsAndConditions: string;
  finalCalculatedPrice: number;
  gstPercent: number;
  version: number;
}

export interface Quote {
  id: string;
  vendorId: string;
  vendorName: string;
  leadId: string;
  price: number;
  gstAmount: number;
  discount: number;
  visitCharges: number;
  installationCost: number;
  finalPrice: number;
  terms: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  quoteDetails?: QuoteDetails;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quote' | 'payment' | 'system' | 'approval' | 'lock';
  isRead: boolean;
  timestamp: string;
}

export interface Payment {
  id: string;
  user_id: string;
  lead_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_type: 'buyer_fee' | 'seller_fee' | 'direct_buy';
  amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'exempt';
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verified_by_admin: boolean;
  user_name?: string;
}
