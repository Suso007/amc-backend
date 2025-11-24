// Customer Master Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { CustomerMasterInput, CustomerMasterUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const customerResolvers = {
    Query: {
        customers: async (
            _: any,
            { page = 1, limit = 10, search, status }: { page?: number; limit?: number; search?: string; status?: string },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { contactPerson: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            const total = await prisma.customermaster.count({ where });
            const data = await prisma.customermaster.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    locations: true,
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

        customer: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const customer = await prisma.customermaster.findUnique({
                where: { id },
                include: {
                    locations: true,
                    invoices: true,
                },
            });

            if (!customer) {
                throw new GraphQLError('Customer not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return customer;
        },
    },

    Mutation: {
        createCustomer: async (_: any, { input }: { input: CustomerMasterInput }, context: AdminContext) => {
            requireAuth(context);

            return await prisma.customermaster.create({
                data: {
                    ...input,
                    status: input.status || 'active',
                },
            });
        },

        updateCustomer: async (
            _: any,
            { id, input }: { id: number; input: CustomerMasterUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.customermaster.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Customer not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return await prisma.customermaster.update({
                where: { id },
                data: input,
            });
        },

        deleteCustomer: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.customermaster.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Customer not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.customermaster.delete({ where: { id } });
            return true;
        },
    },

    CustomerMaster: {
        locations: async (parent: any) => {
            return await prisma.customerlocation.findMany({
                where: { customerId: parent.id },
            });
        },
        invoices: async (parent: any) => {
            return await prisma.invoice.findMany({
                where: { customerId: parent.id },
            });
        },
    },
};
