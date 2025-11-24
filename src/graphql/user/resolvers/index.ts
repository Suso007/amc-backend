// User Resolvers (Placeholder)

import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql';

// Custom DateTime scalar
const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime custom scalar type',
    serialize(value: any) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    },
    parseValue(value: any) {
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new GraphQLError('DateTime must be a valid ISO 8601 date string');
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        throw new GraphQLError('DateTime must be a valid ISO 8601 date string');
    },
});

export const userResolvers = {
    DateTime: dateTimeScalar,

    Query: {
        hello: () => 'Hello from user server!',
    },

    Mutation: {
        ping: () => 'Pong from user server!',
    },
};
