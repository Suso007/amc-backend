// Brand Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { BrandInput, BrandUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const brandResolvers = {
    Query: {
        brands: async (
            _: any,
            { page = 1, limit = 10, search, status }: { page?: number; limit?: number; search?: string; status?: string },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { details: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            const total = await prisma.brand.count({ where });
            const data = await prisma.brand.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
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

        brand: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const brand = await prisma.brand.findUnique({
                where: { id },
                include: {
                    products: true,
                },
            });

            if (!brand) {
                throw new GraphQLError('Brand not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return brand;
        },
    },

    Mutation: {
        createBrand: async (_: any, { input }: { input: BrandInput }, context: AdminContext) => {
            requireAuth(context);

            return await prisma.brand.create({
                data: {
                    ...input,
                    status: input.status || 'active',
                },
            });
        },

        updateBrand: async (
            _: any,
            { id, input }: { id: number; input: BrandUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.brand.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Brand not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return await prisma.brand.update({
                where: { id },
                data: input,
            });
        },

        deleteBrand: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.brand.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Brand not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.brand.delete({ where: { id } });
            return true;
        },
    },

    Brand: {
        products: async (parent: any) => {
            return await prisma.product.findMany({
                where: { brandId: parent.id },
            });
        },
    },
};
