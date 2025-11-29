// Proposal Document and Email Resolvers

import { GraphQLError } from 'graphql';
import prisma from '../../../config/database.js';
import { AdminContext } from '../context.js';
import googleDriveService from '../../../services/googleDriveService.js';
import emailService from '../../../services/emailService.js';

const requireAuth = (context: AdminContext) => {
    if (!context.user.isAuthenticated) {
        throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};

export const proposalDocumentResolvers = {
    Query: {
        proposalDocuments: async (
            _: any,
            { page = 1, limit = 10, proposalno }: { page?: number; limit?: number; proposalno?: string },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (proposalno) {
                where.proposalno = proposalno;
            }

            const total = await prisma.proposaldocument.count({ where });
            const data = await prisma.proposaldocument.findMany({
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

        proposalDocument: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const document = await prisma.proposaldocument.findUnique({
                where: { id },
            });

            if (!document) {
                throw new GraphQLError('Document not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return document;
        },

        emailRecords: async (
            _: any,
            { page = 1, limit = 10, proposalno }: { page?: number; limit?: number; proposalno?: string },
            context: AdminContext
        ) => {
            requireAuth(context);

            const where: any = {};

            if (proposalno) {
                where.proposalno = proposalno;
            }

            const total = await prisma.emailrecord.count({ where });
            const data = await prisma.emailrecord.findMany({
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

        emailRecord: async (_: any, { id }: { id: number }, context: AdminContext) => {
            requireAuth(context);

            const record = await prisma.emailrecord.findUnique({
                where: { id },
            });

            if (!record) {
                throw new GraphQLError('Email record not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            return record;
        },
    },

    Mutation: {
        generateProposalDocument: async (
            _: any,
            { proposalId }: { proposalId: number },
            context: AdminContext
        ) => {
            requireAuth(context);

            // Get proposal with all related data
            const proposal = await prisma.amcproposal.findUnique({
                where: { id: proposalId },
                include: {
                    customer: true,
                    items: {
                        include: {
                            location: true,
                            product: true,
                        },
                    },
                },
            });

            if (!proposal) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            // Prepare proposal data for document generation
            const proposalData = {
                proposalno: proposal.proposalno,
                proposaldate: new Date(proposal.proposaldate).toLocaleDateString('en-IN'),
                amcstartdate: new Date(proposal.amcstartdate).toLocaleDateString('en-IN'),
                amcenddate: new Date(proposal.amcenddate).toLocaleDateString('en-IN'),
                customerName: proposal.customer.name,
                contactPerson: proposal.customer.contactPerson,
                contractno: proposal.contractno || "",
                billingaddress: proposal.billingaddress || "",
                items: proposal.items.map((item: any) => ({
                    location: item.location?.displayName,
                    product: item.product.name,
                    serialno: item.serialno,
                    saccode: item.saccode,
                    quantity: item.quantity,
                    rate: Number(item.rate),
                    amount: Number(item.amount),
                })),
                total: Number(proposal.total),
                additionalcharge: Number(proposal.additionalcharge),
                discount: Number(proposal.discount),
                taxrate: Number(proposal.taxrate),
                taxamount: Number(proposal.taxamount),
                grandtotal: Number(proposal.grandtotal),
                termsconditions: proposal.termsconditions || "",
            };

            // Generate document
            const docLink = await googleDriveService.generateProposalDocument(proposalData);

            // Update proposal with document link
            await prisma.amcproposal.update({
                where: { id: proposalId },
                data: { doclink: docLink },
            });

            // Create document record
            const document = await prisma.proposaldocument.create({
                data: {
                    proposalno: proposal.proposalno,
                    doclink: docLink,
                    createdby: context.user.email || 'Unknown',
                },
            });

            return document;
        },

        sendProposalEmail: async (
            _: any,
            { input }: { input: { proposalId: number; email: string; message?: string } },
            context: AdminContext
        ) => {
            requireAuth(context);

            // Get proposal
            const proposal = await prisma.amcproposal.findUnique({
                where: { id: input.proposalId },
                include: {
                    customer: true,
                },
            });

            if (!proposal) {
                throw new GraphQLError('Proposal not found', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }

            // Check if document has been generated
            if (!proposal.doclink) {
                throw new GraphQLError('Proposal document not generated yet. Please generate the document first.', {
                    extensions: { code: 'DOCUMENT_NOT_FOUND' },
                });
            }

            let emailStatus = 'sent';
            let errorMessage: string | undefined;

            try {
                // Generate email HTML
                const emailHTML = emailService.generateProposalEmailHTML(
                    proposal.proposalno,
                    proposal.customer.name,
                    input.message
                );

                // Send email with PDF attachment
                await emailService.sendProposalEmail({
                    to: input.email,
                    subject: `AMC Proposal ${proposal.proposalno}`,
                    html: emailHTML,
                    attachmentUrl: proposal.doclink,
                    attachmentName: `Proposal_${proposal.proposalno}.pdf`,
                });
            } catch (error: any) {
                emailStatus = 'failed';
                errorMessage = error.message;
                console.error('Error sending proposal email:', error);
            }

            // Create email record
            const emailRecord = await prisma.emailrecord.create({
                data: {
                    proposalno: proposal.proposalno,
                    email: input.email,
                    status: emailStatus,
                    sentby: context.user.email || 'Unknown',
                    message: input.message || errorMessage,
                },
            });

            if (emailStatus === 'failed') {
                throw new GraphQLError(`Failed to send email: ${errorMessage}`, {
                    extensions: { code: 'EMAIL_SEND_ERROR' },
                });
            }

            return emailRecord;
        },
    },
};
