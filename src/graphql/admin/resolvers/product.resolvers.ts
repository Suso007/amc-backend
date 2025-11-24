// Product Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { ProductInput, ProductUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const productResolvers = {
    Query: {
        products: async (
            _: any,
            { page = 1, limit = 10, search, status, brandId, categoryId }: { page?: number; limit?: number; search?: string; status?: string; brandId?: number; categoryId?: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { details: { contains: search, mode: 'insensitive' } },
                    { model: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (status) {
                where.status = status;
            }

            if (brandId) {
                where.brandId = brandId;
            }

            if (categoryId) {
                where.categoryId = categoryId;
            }

            const total = await prisma.product.count({ where });
            const data = await prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdat: 'desc' },
                include: {
                    brand: true,
                    category: true,
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

        product: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const product = await prisma.product.findUnique({
                where: { id },
                include: {
                    brand: true,
                    category: true,
                },
            });

            if (!product) {
                throw new GraphQLError('Product not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return product;
        },
    },

    Mutation: {
        createProduct: async (_: any, { input }: { input: ProductInput }, context: AdminContext) => {
            requireAuth(context);

            return await prisma.product.create({
                data: {
                    ...input,
                    status: input.status || 'active',
                },
                include: {
                    brand: true,
                    category: true,
                },
            });
        },

        updateProduct: async (
            _: any,
            { id, input }: { id: number; input: ProductUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.product.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Product not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return await prisma.product.update({
                where: { id },
                data: input,
                include: {
                    brand: true,
                    category: true,
                },
            });
        },

        deleteProduct: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.product.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Product not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.product.delete({ where: { id } });
            return true;
        },
    },

    Product: {
        brand: async (parent: any) => {
            if (!parent.brandId) return null;
            return await prisma.brand.findUnique({
                where: { id: parent.brandId },
            });
        },
        category: async (parent: any) => {
            if (!parent.categoryId) return null;
            return await prisma.category.findUnique({
                where: { id: parent.categoryId },
            });
        },
    },
};
