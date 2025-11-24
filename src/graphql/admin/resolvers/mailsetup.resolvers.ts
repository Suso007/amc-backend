// Mail Setup Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import { MailSetupInput } from '../../../types/index.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const mailSetupResolvers = {
    Query: {
        getMailSetup: async (_: any, __: any, context: AdminContext) => {
            requireAuth(context);

            const mailSetup = await prisma.mailsetup.findFirst();
            return mailSetup;
        },
    },

    Mutation: {
        updateMailSetup: async (_: any, { input }: { input: MailSetupInput }, context: AdminContext) => {
            requireAuth(context);

            // Check if mail setup exists
            const existing = await prisma.mailsetup.findFirst();

            if (existing) {
                // Update existing
                return await prisma.mailsetup.update({
                    where: { id: existing.id },
                    data: input,
                });
            } else {
                // Create new
                return await prisma.mailsetup.create({
                    data: input,
                });
            }
        },
    },
};
