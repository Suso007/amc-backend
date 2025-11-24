import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';

// GraphQL schemas and resolvers
import { adminTypeDefs } from './graphql/admin/schema.js';
import { adminResolvers } from './graphql/admin/resolvers/index.js';
import { createAdminContext } from './graphql/admin/context.js';
import { userTypeDefs } from './graphql/user/schema.js';
import { userResolvers } from './graphql/user/resolvers/index.js';
import { createUserContext } from './graphql/user/context.js';
import { prisma } from './config/database.js';

// Logger
const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
        },
    },
});


export async function startServer() {
    const app = express();
    const httpServer = http.createServer(app);

    // Middleware
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
    }));

    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    });

    // Admin GraphQL Server
    const adminServer = new ApolloServer({
        typeDefs: adminTypeDefs,
        resolvers: adminResolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        introspection: process.env.NODE_ENV !== 'production',
    });

    await adminServer.start();

    app.use(
        '/graphql/admin',
        cors<cors.CorsRequest>({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true,
        }),
        express.json(),
        expressMiddleware(adminServer, {
            context: createAdminContext,
        })
    );

    // User GraphQL Server
    const userServer = new ApolloServer({
        typeDefs: userTypeDefs,
        resolvers: userResolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        introspection: process.env.NODE_ENV !== 'production',
    });

    await userServer.start();

    app.use(
        '/graphql/user',
        cors<cors.CorsRequest>({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true,
        }),
        express.json(),
        expressMiddleware(userServer, {
            context: createUserContext,
        })
    );

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        logger.error(err);
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    });

    const PORT = process.env.PORT || 4000;

    await new Promise<void>((resolve) =>
        httpServer.listen({ port: PORT }, resolve)
    );

    logger.info(`🚀 Server ready`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`👨‍💼 Admin GraphQL: http://localhost:${PORT}/graphql/admin`);
    logger.info(`👤 User GraphQL: http://localhost:${PORT}/graphql/user`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        await adminServer.stop();
        await userServer.stop();
        httpServer.close(() => {
            logger.info('HTTP server closed');
            prisma.$disconnect();
            process.exit(0);
        });
    });
}