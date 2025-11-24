// Admin Resolvers - Main Index

import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql';
import { authResolvers } from './auth.resolvers.js';
import { mailSetupResolvers } from './mailsetup.resolvers.js';
import { customerResolvers } from './customer.resolvers.js';
import { locationResolvers } from './location.resolvers.js';
import { brandResolvers } from './brand.resolvers.js';
import { categoryResolvers } from './category.resolvers.js';
import { productResolvers } from './product.resolvers.js';
import { invoiceResolvers } from './invoice.resolvers.js';
import { invoiceItemResolvers } from './invoiceitem.resolvers.js';

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

// Custom Decimal scalar
const decimalScalar = new GraphQLScalarType({
    name: 'Decimal',
    description: 'Decimal custom scalar type',
    serialize(value: any) {
        if (typeof value === 'object' && 'toNumber' in value) {
            return value.toNumber();
        }
        return Number(value);
    },
    parseValue(value: any) {
        return Number(value);
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
            return Number(ast.value);
        }
        throw new GraphQLError('Decimal must be a number');
    },
});

// Merge all resolvers
export const adminResolvers = {
    DateTime: dateTimeScalar,
    Decimal: decimalScalar,

    Query: {
        ...authResolvers.Query,
        ...mailSetupResolvers.Query,
        ...customerResolvers.Query,
        ...locationResolvers.Query,
        ...brandResolvers.Query,
        ...categoryResolvers.Query,
        ...productResolvers.Query,
        ...invoiceResolvers.Query,
        ...invoiceItemResolvers.Query,
    },

    Mutation: {
        ...authResolvers.Mutation,
        ...mailSetupResolvers.Mutation,
        ...customerResolvers.Mutation,
        ...locationResolvers.Mutation,
        ...brandResolvers.Mutation,
        ...categoryResolvers.Mutation,
        ...productResolvers.Mutation,
        ...invoiceResolvers.Mutation,
        ...invoiceItemResolvers.Mutation,
    },

    // Type resolvers
    CustomerMaster: customerResolvers.CustomerMaster,
    CustomerLocation: locationResolvers.CustomerLocation,
    Brand: brandResolvers.Brand,
    Category: categoryResolvers.Category,
    Product: productResolvers.Product,
    Invoice: invoiceResolvers.Invoice,
    InvoiceItem: invoiceItemResolvers.InvoiceItem,
};
