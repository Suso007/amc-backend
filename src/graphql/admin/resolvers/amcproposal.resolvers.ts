// AMC Proposal Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { AmcProposalInput, AmcProposalUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

// Helper function to recalculate proposal totals
export const recalculateProposalTotals = async (proposalId: number) => {
    // Get all items for this proposal
    const items = await prisma.proposalitem.findMany({
        where: { proposalId },
    });

    // Calculate total from all items (convert Decimal to number)
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

    // Get current proposal to get manual fields
    const proposal = await prisma.amcproposal.findUnique({
        where: { id: proposalId },
    });

    if (!proposal) {
        throw new GraphQLError('Proposal not found', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // Calculate tax amount and grand total (convert Decimal to number)
    const additionalcharge = Number(proposal.additionalcharge) || 0;
    const discount = Number(proposal.discount) || 0;
    const taxrate = Number(proposal.taxrate) || 0;

    // taxamount = (total + additionalcharge) * (taxrate / 100)
    const taxamount = (total + additionalcharge) * (taxrate / 100);

    // grandtotal = (total + additionalcharge + taxamount) - discount
    const grandtotal = (total + additionalcharge + taxamount) - discount;

    // Update proposal with new totals
    await prisma.amcproposal.update({
        where: { id: proposalId },
        data: {
            total,
            taxamount,
            grandtotal,
        },
    });
};

export const amcProposalResolvers = {
    Query: {
        amcProposals: async (
            _: any,
            { page = 1, limit = 10, search, status, customerId }: { page?: number; limit?: number; search?: string; status?: string; customerId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { proposalno: { contains: search, mode: 'insensitive' } },
                    { contractno: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.proposalstatus = status;
            }

            if (customerId) {
                where.customerId = customerId;
            }

            const total = await prisma.amcproposal.count({ where });
            const data = await prisma.amcproposal.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    customer: true,
                    items: true,
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

        amcProposal: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const proposal = await prisma.amcproposal.findUnique({
                where: { id },
                include: {
                    customer: true,
                    items: {
                        include: {
                            location: true,
                            invoice: true,
                            product: {
                                include: {
                                    brand: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!proposal) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return proposal;
        },
    },

    Mutation: {
        createAmcProposal: async (
            _: any,
            { input }: { input: AmcProposalInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            // Check if proposal number already exists
            const existing = await prisma.amcproposal.findUnique({
                where: { proposalno: input.proposalno },
            });

            if (existing) {
                throw new GraphQLError('Proposal number already exists', {
                    extensions: { code: 'DUPLICATE_ENTRY' },
                });
            }

            const proposal = await prisma.amcproposal.create({
                data: {
                    proposalno: input.proposalno,
                    proposaldate: new Date(input.proposaldate),
                    amcstartdate: new Date(input.amcstartdate),
                    amcenddate: new Date(input.amcenddate),
                    customerId: input.customerId,
                    contractno: input.contractno,
                    billingaddress: input.billingaddress,
                    additionalcharge: input.additionalcharge || 0,
                    discount: input.discount || 0,
                    taxrate: input.taxrate || 0,
                    proposalstatus: input.proposalstatus || 'new',
                    total: 0,
                    taxamount: 0,
                    grandtotal: 0,
                },
                include: {
                    customer: true,
                    items: true,
                },
            });

            return proposal;
        },

        updateAmcProposal: async (
            _: any,
            { id, input }: { id: number; input: AmcProposalUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.amcproposal.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            // Check if proposal number is being changed and if it already exists
            if (input.proposalno && input.proposalno !== existing.proposalno) {
                const duplicate = await prisma.amcproposal.findUnique({
                    where: { proposalno: input.proposalno },
                });

                if (duplicate) {
                    throw new GraphQLError('Proposal number already exists', {
                        extensions: { code: 'DUPLICATE_ENTRY' },
                    });
                }
            }

            const updateData: any = {};

            if (input.proposalno) updateData.proposalno = input.proposalno;
            if (input.proposaldate) updateData.proposaldate = new Date(input.proposaldate);
            if (input.amcstartdate) updateData.amcstartdate = new Date(input.amcstartdate);
            if (input.amcenddate) updateData.amcenddate = new Date(input.amcenddate);
            if (input.customerId) updateData.customerId = input.customerId;
            if (input.contractno !== undefined) updateData.contractno = input.contractno;
            if (input.billingaddress !== undefined) updateData.billingaddress = input.billingaddress;
            if (input.additionalcharge !== undefined) updateData.additionalcharge = input.additionalcharge;
            if (input.discount !== undefined) updateData.discount = input.discount;
            if (input.taxrate !== undefined) updateData.taxrate = input.taxrate;
            if (input.proposalstatus) updateData.proposalstatus = input.proposalstatus;

            const proposal = await prisma.amcproposal.update({
                where: { id },
                data: updateData,
                include: {
                    customer: true,
                    items: true,
                },
            });

            // Recalculate totals if manual fields changed
            if (input.additionalcharge !== undefined || input.discount !== undefined || input.taxrate !== undefined) {
                await recalculateProposalTotals(id);

                // Fetch updated proposal
                return await prisma.amcproposal.findUnique({
                    where: { id },
                    include: {
                        customer: true,
                        items: true,
                    },
                }) as any;
            }

            return proposal;
        },

        deleteAmcProposal: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.amcproposal.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.amcproposal.delete({ where: { id } });

            return true;
        },
    },

    AmcProposal: {
        customer: async (parent: any) => {
            return await prisma.customermaster.findUnique({
                where: { id: parent.customerId },
            });
        },
        items: async (parent: any) => {
            return await prisma.proposalitem.findMany({
                where: { proposalId: parent.id },
            });
        },
    },
};
