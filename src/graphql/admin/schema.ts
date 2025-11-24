// Admin GraphQL Schema (TypeDefs)

export const adminTypeDefs = `#graphql
  scalar DateTime
  scalar Decimal

  # ============================================
  # Authentication Types
  # ============================================

  type AdminUser {
    id: Int!
    email: String!
    name: String!
    role: String!
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
  }

  type LoginResponse {
    token: String!
    user: AdminUser!
  }

  # ============================================
  # Mail Setup Types
  # ============================================

  type MailSetup {
    id: Int!
    smtphost: String!
    smtpport: Int!
    smtpuser: String!
    smtppassword: String!
    enablessl: Boolean!
    sendername: String!
    senderemail: String!
    createdat: DateTime!
    updatedat: DateTime!
  }

  input MailSetupInput {
    smtphost: String!
    smtpport: Int!
    smtpuser: String!
    smtppassword: String!
    enablessl: Boolean!
    sendername: String!
    senderemail: String!
  }

  # ============================================
  # Customer Master Types
  # ============================================

  type CustomerMaster {
    id: Int!
    name: String!
    details: String
    contactPerson: String
    email: String
    address: String
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    locations: [CustomerLocation!]
    invoices: [Invoice!]
  }

  input CustomerMasterInput {
    name: String!
    details: String
    contactPerson: String
    email: String
    address: String
    status: String
  }

  input CustomerMasterUpdateInput {
    name: String
    details: String
    contactPerson: String
    email: String
    address: String
    status: String
  }

  # ============================================
  # Customer Location Types
  # ============================================

  type CustomerLocation {
    id: Int!
    customerId: Int!
    displayName: String!
    location: String
    contactPerson: String
    email: String
    phone1: String
    phone2: String
    address: String
    city: String
    state: String
    pin: String
    gstin: String
    pan: String
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    customer: CustomerMaster
  }

  input CustomerLocationInput {
    customerId: Int!
    displayName: String!
    location: String
    contactPerson: String
    email: String
    phone1: String
    phone2: String
    address: String
    city: String
    state: String
    pin: String
    gstin: String
    pan: String
    status: String
  }

  input CustomerLocationUpdateInput {
    customerId: Int
    displayName: String
    location: String
    contactPerson: String
    email: String
    phone1: String
    phone2: String
    address: String
    city: String
    state: String
    pin: String
    gstin: String
    pan: String
    status: String
  }

  # ============================================
  # Brand Types
  # ============================================

  type Brand {
    id: Int!
    name: String!
    details: String
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    products: [Product!]
  }

  input BrandInput {
    name: String!
    details: String
    status: String
  }

  input BrandUpdateInput {
    name: String
    details: String
    status: String
  }

  # ============================================
  # Category Types
  # ============================================

  type Category {
    id: Int!
    name: String!
    details: String
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    products: [Product!]
  }

  input CategoryInput {
    name: String!
    details: String
    status: String
  }

  input CategoryUpdateInput {
    name: String
    details: String
    status: String
  }

  # ============================================
  # Product Types
  # ============================================

  type Product {
    id: Int!
    name: String!
    details: String
    brandId: Int
    categoryId: Int
    model: String
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    brand: Brand
    category: Category
  }

  input ProductInput {
    name: String!
    details: String
    brandId: Int
    categoryId: Int
    model: String
    status: String
  }

  input ProductUpdateInput {
    name: String
    details: String
    brandId: Int
    categoryId: Int
    model: String
    status: String
  }

  # ============================================
  # Invoice Types
  # ============================================

  type Invoice {
    id: Int!
    customerId: Int!
    locationId: Int
    invoiceNo: String!
    invoiceDate: DateTime!
    total: Decimal!
    discount: Decimal!
    subtotal: Decimal!
    grandTotal: Decimal!
    status: String!
    createdat: DateTime!
    updatedat: DateTime!
    customer: CustomerMaster
    location: CustomerLocation
    items: [InvoiceItem!]
  }

  input InvoiceInput {
    customerId: Int!
    locationId: Int
    invoiceNo: String!
    invoiceDate: DateTime!
    total: Float!
    discount: Float
    subtotal: Float!
    grandTotal: Float!
    status: String
    items: [InvoiceItemInput!]
  }

  input InvoiceUpdateInput {
    customerId: Int
    locationId: Int
    invoiceNo: String
    invoiceDate: DateTime
    total: Float
    discount: Float
    subtotal: Float
    grandTotal: Float
    status: String
  }

  # ============================================
  # Invoice Item Types
  # ============================================

  type InvoiceItem {
    id: Int!
    invoiceId: Int!
    productId: Int!
    serialNo: String
    quantity: Int!
    amount: Decimal!
    createdat: DateTime!
    updatedat: DateTime!
    product: Product
    invoice: Invoice
  }

  input InvoiceItemInput {
    productId: Int!
    serialNo: String
    quantity: Int!
    amount: Float!
  }

  input InvoiceItemUpdateInput {
    invoiceId: Int
    productId: Int
    serialNo: String
    quantity: Int
    amount: Float
  }

  # ============================================
  # Pagination Types
  # ============================================

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type CustomerMasterPaginated {
    data: [CustomerMaster!]!
    pagination: PaginationInfo!
  }

  type CustomerLocationPaginated {
    data: [CustomerLocation!]!
    pagination: PaginationInfo!
  }

  type BrandPaginated {
    data: [Brand!]!
    pagination: PaginationInfo!
  }

  type CategoryPaginated {
    data: [Category!]!
    pagination: PaginationInfo!
  }

  type ProductPaginated {
    data: [Product!]!
    pagination: PaginationInfo!
  }

  type InvoicePaginated {
    data: [Invoice!]!
    pagination: PaginationInfo!
  }

  type InvoiceItemPaginated {
    data: [InvoiceItem!]!
    pagination: PaginationInfo!
  }

  # ============================================
  # Queries
  # ============================================

  type Query {
    # Auth
    me: AdminUser!

    # Mail Setup
    getMailSetup: MailSetup

    # Customer Master
    customers(page: Int, limit: Int, search: String, status: String): CustomerMasterPaginated!
    customer(id: Int!): CustomerMaster

    # Customer Locations
    customerLocations(page: Int, limit: Int, search: String, status: String, customerId: Int): CustomerLocationPaginated!
    customerLocation(id: Int!): CustomerLocation

    # Brands
    brands(page: Int, limit: Int, search: String, status: String): BrandPaginated!
    brand(id: Int!): Brand

    # Categories
    categories(page: Int, limit: Int, search: String, status: String): CategoryPaginated!
    category(id: Int!): Category

    # Products
    products(page: Int, limit: Int, search: String, status: String, brandId: Int, categoryId: Int): ProductPaginated!
    product(id: Int!): Product

    # Invoices
    invoices(page: Int, limit: Int, search: String, status: String, customerId: Int): InvoicePaginated!
    invoice(id: Int!): Invoice

    # Invoice Items
    invoiceItems(page: Int, limit: Int, invoiceId: Int): InvoiceItemPaginated!
    invoiceItem(id: Int!): InvoiceItem
  }

  # ============================================
  # Mutations
  # ============================================

  type Mutation {
    # Auth
    login(email: String!, password: String!): LoginResponse!

    # Mail Setup
    updateMailSetup(input: MailSetupInput!): MailSetup!

    # Customer Master
    createCustomer(input: CustomerMasterInput!): CustomerMaster!
    updateCustomer(id: Int!, input: CustomerMasterUpdateInput!): CustomerMaster!
    deleteCustomer(id: Int!): Boolean!

    # Customer Locations
    createCustomerLocation(input: CustomerLocationInput!): CustomerLocation!
    updateCustomerLocation(id: Int!, input: CustomerLocationUpdateInput!): CustomerLocation!
    deleteCustomerLocation(id: Int!): Boolean!

    # Brands
    createBrand(input: BrandInput!): Brand!
    updateBrand(id: Int!, input: BrandUpdateInput!): Brand!
    deleteBrand(id: Int!): Boolean!

    # Categories
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: Int!, input: CategoryUpdateInput!): Category!
    deleteCategory(id: Int!): Boolean!

    # Products
    createProduct(input: ProductInput!): Product!
    updateProduct(id: Int!, input: ProductUpdateInput!): Product!
    deleteProduct(id: Int!): Boolean!

    # Invoices
    createInvoice(input: InvoiceInput!): Invoice!
    updateInvoice(id: Int!, input: InvoiceUpdateInput!): Invoice!
    deleteInvoice(id: Int!): Boolean!

    # Invoice Items
    createInvoiceItem(invoiceId: Int!, input: InvoiceItemInput!): InvoiceItem!
    updateInvoiceItem(id: Int!, input: InvoiceItemUpdateInput!): InvoiceItem!
    deleteInvoiceItem(id: Int!): Boolean!
  }
`;
