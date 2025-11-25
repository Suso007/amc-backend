// Proposal Item Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { ProposalItemInput, ProposalItemUpdateInput } from '../../../types/index.js';
import { recalculateProposalTotals } from './amcproposal.resolvers.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const proposalItemResolvers = {
    Query: {
        proposalItems: async (
            _: any,
            { page = 1, limit = 10, proposalId }: { page?: number; limit?: number; proposalId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (proposalId) {
                where.proposalId = proposalId;
            }

            const total = await prisma.proposalitem.count({ where });
            const data = await prisma.proposalitem.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    proposal: true,
                    location: true,
                    invoice: true,
                    product: {
                        include: {
                            brand: true,
                            category: true,
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

        proposalItem: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const item = await prisma.proposalitem.findUnique({
                where: { id },
                include: {
                    proposal: true,
                    location: true,
                    invoice: true,
                    product: {
                        include: {
                            brand: true,
                            category: true,
                        },
                    },
                },
            });

            if (!item) {
                throw new GraphQLError('Proposal item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return item;
        },
    },

    Mutation: {
        createProposalItem: async (
            _: any,
            { proposalId, input }: { proposalId: number; input: ProposalItemInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            // Verify proposal exists
            const proposal = await prisma.amcproposal.findUnique({
                where: { id: proposalId },
            });

            if (!proposal) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const item = await prisma.proposalitem.create({
                data: {
                    proposalId,
                    locationId: input.locationId,
                    invoiceId: input.invoiceId,
                    productId: input.productId,
                    serialno: input.serialno,
                    saccode: input.saccode,
                    quantity: input.quantity,
                    rate: input.rate,
                    amount: input.amount,
                },
                include: {
                    proposal: true,
                    location: true,
                    invoice: true,
                    product: {
                        include: {
                            brand: true,
                            category: true,
                        },
                    },
                },
            });

            // Recalculate proposal totals
            await recalculateProposalTotals(proposalId);

            return item;
        },

        updateProposalItem: async (
            _: any,
            { id, input }: { id: number; input: ProposalItemUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.proposalitem.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Proposal item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const updateData: any = {};

            if (input.proposalId !== undefined) updateData.proposalId = input.proposalId;
            if (input.locationId !== undefined) updateData.locationId = input.locationId;
            if (input.invoiceId !== undefined) updateData.invoiceId = input.invoiceId;
            if (input.productId !== undefined) updateData.productId = input.productId;
            if (input.serialno !== undefined) updateData.serialno = input.serialno;
            if (input.saccode !== undefined) updateData.saccode = input.saccode;
            if (input.quantity !== undefined) updateData.quantity = input.quantity;
            if (input.rate !== undefined) updateData.rate = input.rate;
            if (input.amount !== undefined) updateData.amount = input.amount;

            const item = await prisma.proposalitem.update({
                where: { id },
                data: updateData,
                include: {
                    proposal: true,
                    location: true,
                    invoice: true,
                    product: {
                        include: {
                            brand: true,
                            category: true,
                        },
                    },
                },
            });

            // Recalculate proposal totals
            await recalculateProposalTotals(existing.proposalId);

            return item;
        },

        deleteProposalItem: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.proposalitem.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Proposal item not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            const proposalId = existing.proposalId;

            await prisma.proposalitem.delete({ where: { id } });

            // Recalculate proposal totals
            await recalculateProposalTotals(proposalId);

            return true;
        },
    },

    ProposalItem: {
        proposal: async (parent: any) => {
            return await prisma.amcproposal.findUnique({
                where: { id: parent.proposalId },
            });
        },
        location: async (parent: any) => {
            if (!parent.locationId) return null;
            return await prisma.customerlocation.findUnique({
                where: { id: parent.locationId },
            });
        },
        invoice: async (parent: any) => {
            return await prisma.invoice.findUnique({
                where: { id: parent.invoiceId },
            });
        },
        product: async (parent: any) => {
            return await prisma.product.findUnique({
                where: { id: parent.productId },
                include: {
                    brand: true,
                    category: true,
                },
            });
        },
    },
};
