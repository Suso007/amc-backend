// Customer Location Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { CustomerLocationInput, CustomerLocationUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const locationResolvers = {
    Query: {
        customerLocations: async (
            _: any,
            { page = 1, limit = 10, search, status, customerId }: { page?: number; limit?: number; search?: string; status?: string; customerId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { displayName: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            if (customerId) {
                where.customerId = customerId;
            }

            const total = await prisma.customerlocation.count({ where });
            const data = await prisma.customerlocation.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    customer: true,
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

        customerLocation: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const location = await prisma.customerlocation.findUnique({
                where: { id },
                include: {
                    customer: true,
                },
            });

            if (!location) {
                throw new GraphQLError('Customer location not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return location;
        },
    },

    Mutation: {
        createCustomerLocation: async (_: any, { input }: { input: CustomerLocationInput }, context: AdminContext) => {
            requireAuth(context);

            return await prisma.customerlocation.create({
                data: {
                    ...input,
                    status: input.status || 'active',
                },
            });
        },

        updateCustomerLocation: async (
            _: any,
            { id, input }: { id: number; input: CustomerLocationUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.customerlocation.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Customer location not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return await prisma.customerlocation.update({
                where: { id },
                data: input,
            });
        },

        deleteCustomerLocation: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.customerlocation.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Customer location not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.customerlocation.delete({ where: { id } });
            return true;
        },
    },

    CustomerLocation: {
        customer: async (parent: any) => {
            return await prisma.customermaster.findUnique({
                where: { id: parent.customerId },
            });
        },
    },
};
