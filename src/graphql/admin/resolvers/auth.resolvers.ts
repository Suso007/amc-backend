// Authentication Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { generateToken, comparePassword } from '../../../utils/auth.js';
import { AdminContext } from '../context.js';

export const authResolvers = {
    Query: {
        me: async (_: any, __: any, context: AdminContext) => {
            if (!context.user.isAuthenticated) {
                throw new GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }

            const user = await prisma.adminuser.findUnique({
                where: { id: context.user.userId },
            });

            if (!user) {
                throw new GraphQLError('User not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return user;
        },
    },

    Mutation: {
        login: async (_: any, { email, password }: { email: string; password: string }) => {
            const user = await prisma.adminuser.findUnique({
                where: { email },
            });

            if (!user) {
                throw new GraphQLError('Invalid credentials', {
                    extensions: { code: 'UNAUTHORIZED' },
                });
            }

            const isValidPassword = await comparePassword(password, user.password);

            if (!isValidPassword) {
                throw new GraphQLError('Invalid credentials', {
                    extensions: { code: 'UNAUTHORIZED' },
                });
            }

            if (user.status !== 'active') {
                throw new GraphQLError('Account is not active', {
                    extensions: { code: 'FORBIDDEN' },
                });
            }

            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });

            return {
                token,
                user,
            };
        },
    },
};
