// Invoice Item Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { InvoiceItemInput, InvoiceItemUpdateInput } from '../../../types/index.js';

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

export const invoiceItemResolvers = {
    Query: {
        invoiceItems: async (
            _: any,
            { page = 1, limit = 10, invoiceId }: { page?: number; limit?: number; invoiceId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (invoiceId) {
                where.invoiceId = invoiceId;
            }

            const total = await prisma.invoiceitem.count({ where });
            const data = await prisma.invoiceitem.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    product: true,
                    invoice: true,
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

        invoiceItem: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const item = await prisma.invoiceitem.findUnique({
                where: { id },
                include: {
                    product: true,
                    invoice: true,
                },
            });

            if (!item) {
                throw new GraphQLError('Invoice item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return item;
        },
    },

    Mutation: {
        createInvoiceItem: async (
            _: any,
            { invoiceId, input }: { invoiceId: number; input: InvoiceItemInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const item = await prisma.invoiceitem.create({
                data: {
                    invoiceId,
                    productId: input.productId,
                    serialNo: input.serialNo,
                    quantity: input.quantity,
                    amount: input.amount,
                },
                include: {
                    product: true,
                },
            });

            // Recalculate invoice totals
            await recalculateInvoiceTotals(invoiceId);

            return item;
        },

        updateInvoiceItem: async (
            _: any,
            { id, input }: { id: number; input: InvoiceItemUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.invoiceitem.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Invoice item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const item = await prisma.invoiceitem.update({
                where: { id },
                data: input,
                include: {
                    product: true,
                },
            });

            // Recalculate invoice totals
            await recalculateInvoiceTotals(existing.invoiceId);

            return item;
        },

        deleteInvoiceItem: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.invoiceitem.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Invoice item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const invoiceId = existing.invoiceId;

            await prisma.invoiceitem.delete({ where: { id } });

            // Recalculate invoice totals
            await recalculateInvoiceTotals(invoiceId);

            return true;
        },
    },

    InvoiceItem: {
        product: async (parent: any) => {
            return await prisma.product.findUnique({
                where: { id: parent.productId },
            });
        },
        invoice: async (parent: any) => {
            return await prisma.invoice.findUnique({
                where: { id: parent.invoiceId },
            });
        },
    },
};
