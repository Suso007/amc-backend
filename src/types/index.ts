// TypeScript interfaces for AMC Management System

import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// Authentication & Context
// ============================================

export interface AuthContext {
    userId?: number;
    email?: string;
    role?: string;
    isAuthenticated: boolean;
}

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: AdminUser;
}

// ============================================
// Pagination & Filtering
// ============================================

export interface PaginationInput {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface FilterInput {
    search?: string;
    status?: string;
    [key: string]: any;
}

// ============================================
// Mail Setup
// ============================================

export interface MailSetup {
    id: number;
    smtphost: string;
    smtpport: number;
    smtpuser: string;
    smtppassword: string;
    enablessl: boolean;
    sendername: string;
    senderemail: string;
    createdat: Date;
    updatedat: Date;
}

export interface MailSetupInput {
    smtphost: string;
    smtpport: number;
    smtpuser: string;
    smtppassword: string;
    enablessl: boolean;
    sendername: string;
    senderemail: string;
}

// ============================================
// Customer Master
// ============================================

export interface CustomerMaster {
    id: number;
    name: string;
    details?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    address?: string | null;
    status: string;
    createdat: Date;
    updatedat: Date;
    locations?: CustomerLocation[];
    invoices?: Invoice[];
}

export interface CustomerMasterInput {
    name: string;
    details?: string;
    contactPerson?: string;
    email?: string;
    address?: string;
    status?: string;
}

export interface CustomerMasterUpdateInput {
    name?: string;
    details?: string;
    contactPerson?: string;
    email?: string;
    address?: string;
    status?: string;
}

// ============================================
// Customer Location
// ============================================

export interface CustomerLocation {
    id: number;
    customerId: number;
    displayName: string;
    location?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    phone1?: string | null;
    phone2?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pin?: string | null;
    gstin?: string | null;
    pan?: string | null;
    status: string;
    createdat: Date;
    updatedat: Date;
    customer?: CustomerMaster;
    invoices?: Invoice[];
}

export interface CustomerLocationInput {
    customerId: number;
    displayName: string;
    location?: string;
    contactPerson?: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    city?: string;
    state?: string;
    pin?: string;
    gstin?: string;
    pan?: string;
    status?: string;
}

export interface CustomerLocationUpdateInput {
    customerId?: number;
    displayName?: string;
    location?: string;
    contactPerson?: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    city?: string;
    state?: string;
    pin?: string;
    gstin?: string;
    pan?: string;
    status?: string;
}

// ============================================
// Brand
// ============================================

export interface Brand {
    id: number;
    name: string;
    details?: string | null;
    status: string;
    createdat: Date;
    updatedat: Date;
    products?: Product[];
}

export interface BrandInput {
    name: string;
    details?: string;
    status?: string;
}

export interface BrandUpdateInput {
    name?: string;
    details?: string;
    status?: string;
}

// ============================================
// Category
// ============================================

export interface Category {
    id: number;
    name: string;
    details?: string | null;
    status: string;
    createdat: Date;
    updatedat: Date;
    products?: Product[];
}

export interface CategoryInput {
    name: string;
    details?: string;
    status?: string;
}

export interface CategoryUpdateInput {
    name?: string;
    details?: string;
    status?: string;
}

// ============================================
// Product
// ============================================

export interface Product {
    id: number;
    name: string;
    details?: string | null;
    brandId?: number | null;
    categoryId?: number | null;
    model?: string | null;
    status: string;
    createdat: Date;
    updatedat: Date;
    brand?: Brand | null;
    category?: Category | null;
    invoiceItems?: InvoiceItem[];
}

export interface ProductInput {
    name: string;
    details?: string;
    brandId?: number;
    categoryId?: number;
    model?: string;
    status?: string;
}

export interface ProductUpdateInput {
    name?: string;
    details?: string;
    brandId?: number;
    categoryId?: number;
    model?: string;
    status?: string;
}

// ============================================
// Invoice
// ============================================

export interface Invoice {
    id: number;
    customerId: number;
    locationId?: number | null;
    invoiceNo: string;
    invoiceDate: Date;
    total: Decimal;
    discount: Decimal;
    subtotal: Decimal;
    grandTotal: Decimal;
    status: string;
    createdat: Date;
    updatedat: Date;
    customer?: CustomerMaster;
    location?: CustomerLocation | null;
    items?: InvoiceItem[];
}

export interface InvoiceInput {
    customerId: number;
    locationId?: number;
    invoiceNo: string;
    invoiceDate: Date | string;
    total: number;
    discount?: number;
    subtotal: number;
    grandTotal: number;
    status?: string;
    items?: InvoiceItemInput[];
}

export interface InvoiceUpdateInput {
    customerId?: number;
    locationId?: number;
    invoiceNo?: string;
    invoiceDate?: Date | string;
    total?: number;
    discount?: number;
    subtotal?: number;
    grandTotal?: number;
    status?: string;
}

// ============================================
// Invoice Item
// ============================================

export interface InvoiceItem {
    id: number;
    invoiceId: number;
    productId: number;
    serialNo?: string | null;
    quantity: number;
    amount: Decimal;
    createdat: Date;
    updatedat: Date;
    invoice?: Invoice;
    product?: Product;
}

export interface InvoiceItemInput {
    invoiceId?: number;
    productId: number;
    serialNo?: string;
    quantity: number;
    amount: number;
}

export interface InvoiceItemUpdateInput {
    invoiceId?: number;
    productId?: number;
    serialNo?: string;
    quantity?: number;
    amount?: number;
}

// ============================================
// Admin User
// ============================================

export interface AdminUser {
    id: number;
    email: string;
    password: string;
    name: string;
    role: string;
    status: string;
    createdat: Date;
    updatedat: Date;
}

export interface AdminUserInput {
    email: string;
    password: string;
    name: string;
    role?: string;
    status?: string;
}
