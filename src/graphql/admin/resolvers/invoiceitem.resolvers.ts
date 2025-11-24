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

            return await prisma.invoiceitem.create({
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

            return await prisma.invoiceitem.update({
                where: { id },
                data: input,
                include: {
                    product: true,
                },
            });
        },

        deleteInvoiceItem: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.invoiceitem.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Invoice item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.invoiceitem.delete({ where: { id } });
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
