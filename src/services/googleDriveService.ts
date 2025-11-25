// Google Drive Service for Proposal Document Generation via Apps Script

import { GraphQLError } from 'graphql';

interface GenerateProposalDoc {
    templateId: string;
    folderId: string;
    proposalData: ProposalData;
}

interface ProposalData {
    proposalno: string;
    proposaldate: string;
    amcstartdate: string;
    amcenddate: string;
    customerName: string;
    contractno?: string;
    billingaddress?: string;
    items: Array<{
        location?: string;
        product: string;
        serialno?: string;
        quantity: number;
        rate: number;
        amount: number;
    }>;
    total: number;
    additionalcharge: number;
    discount: number;
    taxrate: number;
    taxamount: number;
    grandtotal: number;
}

interface AppsScriptResponse {
    status: string;
    pdfUrl?: string;
    previewLink?: string;
    fileId?: string;
    message?: string;
}

class GoogleDriveService {
    private readonly appsScriptEndpoint: string = 'https://script.google.com/macros/s/AKfycbwclYoC94GgTp6yVZNfZnPLwKUySZYbfd9_ISEHycJhw7DF8R08OvPXdNIuIhn4mLoX/exec';

    async generateProposalDocument(proposalData: ProposalData): Promise<string> {
        const templateId = process.env.GOOGLE_DOCS_TEMPLATE_ID;
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!templateId || !folderId) {
            throw new GraphQLError('Google Docs template or folder not configured', {
                extensions: { code: 'CONFIGURATION_ERROR' },
            });
        }

        try {
            const requestBody: GenerateProposalDoc = {
                templateId,
                folderId,
                proposalData,
            };

            const response = await fetch(this.appsScriptEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Apps Script returned ${response.status}: ${errorText}`);
            }

            const result = await response.json() as AppsScriptResponse;

            if (result.status === 'error') {
                throw new Error(result.message);
            }

            if (!result.pdfUrl) {
                throw new Error('No PDF URL returned from Apps Script');
            }

            return result.pdfUrl;
        } catch (error: any) {
            console.error('Error generating proposal document:', error);
            throw new GraphQLError(`Failed to generate proposal document: ${error.message}`, {
                extensions: { code: 'DOCUMENT_GENERATION_ERROR' },
            });
        }
    }
}

export default new GoogleDriveService();
