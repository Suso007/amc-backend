# AMC Management System - Backend

A complete backend system for Annual Maintenance Contract (AMC) management built with Apollo GraphQL, PostgreSQL, Prisma ORM, and JWT authentication.

## Features

- **Dual GraphQL Servers**: Separate endpoints for admin (`/graphql/admin`) and user (`/graphql/user`) operations
- **JWT Authentication**: Secure authentication with JWT tokens
- **Complete CRUD Operations**: Full create, read, update, delete operations for all entities
- **Pagination & Filtering**: Built-in pagination and search functionality
- **TypeScript**: Fully typed with TypeScript interfaces

## Tech Stack

- **Server**: Express.js with Apollo GraphQL Server
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Argon2 password hashing
- **Language**: TypeScript

## Project Structure

```
src/
├── config/
│   └── database.ts          # Prisma client configuration
├── graphql/
│   ├── admin/               # Admin GraphQL server
│   │   ├── schema.ts        # GraphQL schema (typeDefs)
│   │   ├── context.ts       # Authentication context
│   │   └── resolvers/       # All resolvers
│   │       ├── index.ts     # Main resolver aggregator
│   │       ├── auth.resolvers.ts
│   │       ├── mailsetup.resolvers.ts
│   │       ├── customer.resolvers.ts
│   │       ├── location.resolvers.ts
│   │       ├── brand.resolvers.ts
│   │       ├── category.resolvers.ts
│   │       ├── product.resolvers.ts
│   │       ├── invoice.resolvers.ts
│   │       └── invoiceitem.resolvers.ts
│   └── user/                # User GraphQL server (placeholder)
│       ├── schema.ts
│       ├── context.ts
│       └── resolvers/
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── auth.ts              # JWT & password utilities
└── server.ts                # Main server configuration
```

## Entities

1. **Mail Setup** - SMTP configuration
2. **Customer Master** - Customer information
3. **Customer Locations** - Customer location details
4. **Brand** - Product brands
5. **Category** - Product categories
6. **Product** - Products with brand/category relations
7. **Invoice** - Invoice headers
8. **Invoice Items** - Invoice line items
9. **Admin User** - Admin authentication

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory (use `.env.example` as reference):

```env
DATABASE_URL="postgresql://username:password@localhost:5432/amc_db?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

**Important**: Update the `DATABASE_URL` with your actual PostgreSQL credentials.

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Seed Database

This creates an initial admin user and mail setup:

```bash
npm run db:seed
```

**Default Admin Credentials:**
- Email: `admin@amc.com`
- Password: `Admin@123`

### 6. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

## GraphQL Endpoints

- **Admin**: `http://localhost:4000/graphql/admin`
- **User**: `http://localhost:4000/graphql/user`
- **Health Check**: `http://localhost:4000/health`

## Authentication

All GraphQL operations (except `login`) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login Example

```graphql
mutation Login {
  login(email: "admin@amc.com", password: "Admin@123") {
    token
    user {
      id
      email
      name
      role
    }
  }
}
```

Copy the returned `token` and use it in subsequent requests.

## Example Queries & Mutations

### Get Current User

```graphql
query Me {
  me {
    id
    email
    name
    role
  }
}
```

### Create Customer

```graphql
mutation CreateCustomer {
  createCustomer(input: {
    name: "ABC Corporation"
    email: "contact@abc.com"
    contactPerson: "John Doe"
    address: "123 Main St"
    status: "active"
  }) {
    id
    name
    email
  }
}
```

### Get Customers with Pagination

```graphql
query GetCustomers {
  customers(page: 1, limit: 10, search: "ABC") {
    data {
      id
      name
      email
      contactPerson
      status
    }
    pagination {
      page
      limit
      total
      totalPages
    }
  }
}
```

### Create Invoice with Items

```graphql
mutation CreateInvoice {
  createInvoice(input: {
    customerId: 1
    locationId: 1
    invoiceNo: "INV-2024-001"
    invoiceDate: "2024-11-24"
    total: 1000
    discount: 100
    subtotal: 900
    grandTotal: 900
    status: "pending"
    items: [
      {
        productId: 1
        serialNo: "SN001"
        quantity: 2
        amount: 500
      }
    ]
  }) {
    id
    invoiceNo
    grandTotal
    items {
      id
      quantity
      amount
      product {
        name
      }
    }
  }
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run compile` - Compile TypeScript to JavaScript
- `npm start` - Build and start production server
- `npm run db:seed` - Seed database with initial data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database Schema

The database schema is defined in `prisma/schema.prisma`. All tables include:
- Auto-incrementing `id`
- `createdat` timestamp (auto-generated)
- `updatedat` timestamp (auto-updated)
- `status` field for soft deletes (where applicable)

## Security Features

- **Password Hashing**: Argon2 algorithm for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers middleware
- **Input Validation**: GraphQL schema validation

## Development

The project uses:
- **TypeScript** for type safety
- **Pino** for logging
- **Morgan** for HTTP request logging
- **ESM** modules (type: "module" in package.json)

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Update `JWT_SECRET` with a strong secret key
3. Configure `ALLOWED_ORIGINS` with your frontend URLs
4. Run database migrations: `npx prisma migrate deploy`
5. Build: `npm run compile`
6. Start: `node dist/server.js`

## Future Enhancements

- User GraphQL server implementation
- File upload for invoices/documents
- Email notifications using mail setup
- Advanced reporting and analytics
- Role-based access control (RBAC)

## License

ISC

## Author

Susovan Pal
