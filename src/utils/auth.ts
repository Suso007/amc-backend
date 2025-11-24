// JWT Authentication Utilities

import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Hash a password using argon2
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password);
};

/**
 * Compare a plain password with a hashed password
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        return false;
    }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
};
