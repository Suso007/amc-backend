// Invoice Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { InvoiceInput, InvoiceUpdateInput } from '../../../types/index.js';
import { Prisma } from '@prisma/client';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

// Helper function to recalculate invoice totals
const recalculateInvoiceTotals = async (invoiceId: number) => {
    // Get all items for this invoice
    const items = await prisma.invoiceitem.findMany({
        where: { invoiceId },
    });

    // Calculate total from all items (convert Decimal to number)
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

    // Get current invoice to get discount
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
    });

    if (!invoice) {
        throw new GraphQLError('Invoice not found', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // Calculate subtotal and grand total (convert Decimal to number)
    const discount = Number(invoice.discount) || 0;
    const subtotal = total - discount;
    const grandTotal = subtotal;

    // Update invoice with new totals
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            total,
            subtotal,
            grandTotal,
        },
    });
};

export const invoiceResolvers = {
    Query: {
        invoices: async (
            _: any,
            { page = 1, limit = 10, search, status, customerId }: { page?: number; limit?: number; search?: string; status?: string; customerId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { invoiceNo: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            if (customerId) {
                where.customerId = customerId;
            }

            const total = await prisma.invoice.count({ where });
            const data = await prisma.invoice.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    customer: true,
                    location: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        },

        invoice: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const invoice = await prisma.invoice.findUnique({
                where: { id },
                include: {
                    customer: true,
                    location: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!invoice) {
                throw new GraphQLError('Invoice not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return invoice;
        },
    },

    Mutation: {
        createInvoice: async (_: any, { input }: { input: InvoiceInput }, context: AdminContext) => {
            requireAuth(context);

            const { items, ...invoiceData } = input;

            // Create invoice with items in a transaction
            const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const newInvoice = await tx.invoice.create({
                    data: {
                        ...invoiceData,
                        status: invoiceData.status || 'pending',
                    },
                });

                if (items && items.length > 0) {
                    await tx.invoiceitem.createMany({
                        data: items.map((item) => ({
                            invoiceId: newInvoice.id,
                            productId: item.productId,
                            serialNo: item.serialNo,
                            quantity: item.quantity,
                            amount: item.amount,
                        })),
                    });
                }

                return await tx.invoice.findUnique({
                    where: { id: newInvoice.id },
                    include: {
                        customer: true,
                        location: true,
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });
            });

            return invoice;
        },

        updateInvoice: async (
            _: any,
            { id, input }: { id: number; input: InvoiceUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.invoice.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Invoice not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const invoice = await prisma.invoice.update({
                where: { id },
                data: input,
                include: {
                    customer: true,
                    location: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            // Recalculate totals after update (in case discount changed)
            await recalculateInvoiceTotals(id);

            // Fetch updated invoice with new totals
            return await prisma.invoice.findUnique({
                where: { id },
                include: {
                    customer: true,
                    location: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        },

        deleteInvoice: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.invoice.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Invoice not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.invoice.delete({ where: { id } });
            return true;
        },
    },

    Invoice: {
        customer: async (parent: any) => {
            return await prisma.customermaster.findUnique({
                where: { id: parent.customerId },
            });
        },
        location: async (parent: any) => {
            if (!parent.locationId) return null;
            return await prisma.customerlocation.findUnique({
                where: { id: parent.locationId },
            });
        },
        items: async (parent: any) => {
            return await prisma.invoiceitem.findMany({
                where: { invoiceId: parent.id },
                include: {
                    product: true,
                },
            });
        },
    },
};
