// Category Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { CategoryInput, CategoryUpdateInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const categoryResolvers = {
    Query: {
        categories: async (
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

            const total = await prisma.category.count({ where });
            const data = await prisma.category.findMany({
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

        category: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const category = await prisma.category.findUnique({
                where: { id },
                include: {
                    products: true,
                },
            });

            if (!category) {
                throw new GraphQLError('Category not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return category;
        },
    },

    Mutation: {
        createCategory: async (_: any, { input }: { input: CategoryInput }, context: AdminContext) => {
            requireAuth(context);

            return await prisma.category.create({
                data: {
                    ...input,
                    status: input.status || 'active',
                },
            });
        },

        updateCategory: async (
            _: any,
            { id, input }: { id: number; input: CategoryUpdateInput },
            context: AdminContext
        ) => {
            requireAuth(context);

            const existing = await prisma.category.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Category not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return await prisma.category.update({
                where: { id },
                data: input,
            });
        },

        deleteCategory: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const existing = await prisma.category.findUnique({ where: { id } });

            if (!existing) {
                throw new GraphQLError('Category not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            await prisma.category.delete({ where: { id } });
            return true;
        },
    },

    Category: {
        products: async (parent: any) => {
            return await prisma.product.findMany({
                where: { categoryId: parent.id },
            });
        },
    },
};
