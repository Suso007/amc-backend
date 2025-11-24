// Admin GraphQL Context

import { AuthContext } from '../../types/index.js';
import { verifyToken, extractTokenFromHeader } from '../../utils/auth.js';

export interface AdminContext {
    user: AuthContext;
}

export const createAdminContext = async ({ req }: any): Promise<AdminContext> => {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return {
            user: {
                isAuthenticated: false,
            },
        };
    }

    const payload = verifyToken(token);

    if (!payload) {
        return {
            user: {
                isAuthenticated: false,
            },
        };
    }

    return {
        user: {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            isAuthenticated: true,
        },
    };
};
