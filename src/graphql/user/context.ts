// User GraphQL Context

import { AuthContext } from '../../types/index.js';
import { verifyToken, extractTokenFromHeader } from '../../utils/auth.js';

export interface UserContext {
    user: AuthContext;
}

export const createUserContext = async ({ req }: any): Promise<UserContext> => {
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
