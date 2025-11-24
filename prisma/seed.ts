// Database Seed Script with Sample Data

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hashPassword } from '../src/utils/auth.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ============================================
    // 1. Create Admin User
    // ============================================
    const adminEmail = 'admin@amc.com';
    const adminPassword = 'Admin@123';

    const existingAdmin = await prisma.adminuser.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists');
    } else {
        const hashedPassword = await hashPassword(adminPassword);

        const admin = await prisma.adminuser.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'System Administrator',
                role: 'admin',
                status: 'active',
            },
        });

        console.log('✅ Created admin user:');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Name: ${admin.name}`);
    }

    // ============================================
    // 2. Create Mail Setup
    // ============================================
    const existingMailSetup = await prisma.mailsetup.findFirst();

    if (existingMailSetup) {
        console.log('✅ Mail setup already exists');
    } else {
        await prisma.mailsetup.create({
            data: {
                smtphost: 'smtp.gmail.com',
                smtpport: 587,
                smtpuser: 'your-email@gmail.com',
                smtppassword: 'your-app-password',
                enablessl: true,
                sendername: 'AMC Management System',
                senderemail: 'noreply@amc.com',
            },
        });

        console.log('✅ Created default mail setup');
    }

    // ============================================
    // 3. Create Brands
    // ============================================
    console.log('\n📦 Creating brands...');
    const brandNames = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Canon', 'Epson', 'Cisco'];
    const brands = [];

    for (const brandName of brandNames) {
        const brand = await prisma.brand.create({
            data: {
                name: brandName,
                details: `${brandName} - ${faker.company.catchPhrase()}`,
                status: 'active',
            },
        });
        brands.push(brand);
    }
    console.log(`✅ Created ${brands.length} brands`);

    // ============================================
    // 4. Create Categories
    // ============================================
    console.log('\n📂 Creating categories...');
    const categoryNames = ['Laptops', 'Desktops', 'Printers', 'Servers', 'Networking', 'Monitors', 'Accessories'];
    const categories = [];

    for (const categoryName of categoryNames) {
        const category = await prisma.category.create({
            data: {
                name: categoryName,
                details: `${categoryName} - ${faker.commerce.productDescription()}`,
                status: 'active',
            },
        });
        categories.push(category);
    }
    console.log(`✅ Created ${categories.length} categories`);

    // ============================================
    // 5. Create Products
    // ============================================
    console.log('\n🖥️  Creating products...');
    const products = [];

    for (let i = 0; i < 20; i++) {
        const brand = faker.helpers.arrayElement(brands);
        const category = faker.helpers.arrayElement(categories);

        const product = await prisma.product.create({
            data: {
                name: `${brand.name} ${faker.commerce.productName()}`,
                details: faker.commerce.productDescription(),
                brandId: brand.id,
                categoryId: category.id,
                model: faker.string.alphanumeric(8).toUpperCase(),
                status: 'active',
            },
        });
        products.push(product);
    }
    console.log(`✅ Created ${products.length} products`);

    // ============================================
    // 6. Create Customers
    // ============================================
    console.log('\n👥 Creating customers...');
    const customers = [];

    for (let i = 0; i < 10; i++) {
        const customer = await prisma.customermaster.create({
            data: {
                name: faker.company.name(),
                details: faker.company.catchPhrase(),
                contactPerson: faker.person.fullName(),
                email: faker.internet.email(),
                address: faker.location.streetAddress(true),
                status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive']),
            },
        });
        customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // ============================================
    // 7. Create Customer Locations
    // ============================================
    console.log('\n📍 Creating customer locations...');
    let locationCount = 0;

    for (const customer of customers) {
        // Create 1-3 locations per customer
        const numLocations = faker.number.int({ min: 1, max: 3 });

        for (let i = 0; i < numLocations; i++) {
            await prisma.customerlocation.create({
                data: {
                    customerId: customer.id,
                    displayName: `${customer.name} - ${faker.location.city()} Branch`,
                    location: faker.location.city(),
                    contactPerson: faker.person.fullName(),
                    email: faker.internet.email(),
                    phone1: faker.string.numeric(10),
                    phone2: faker.helpers.maybe(() => faker.string.numeric(10), { probability: 0.5 }),
                    address: faker.location.streetAddress(true),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    pin: faker.location.zipCode('#####'),
                    gstin: faker.string.alphanumeric(15).toUpperCase(),
                    pan: faker.string.alphanumeric(10).toUpperCase(),
                    status: 'active',
                },
            });
            locationCount++;
        }
    }
    console.log(`✅ Created ${locationCount} customer locations`);

    // ============================================
    // 8. Create Invoices with Items
    // ============================================
    console.log('\n🧾 Creating invoices...');
    let invoiceCount = 0;

    for (const customer of customers) {
        // Get customer locations
        const customerLocations = await prisma.customerlocation.findMany({
            where: { customerId: customer.id },
        });

        // Create 1-5 invoices per customer
        const numInvoices = faker.number.int({ min: 1, max: 5 });

        for (let i = 0; i < numInvoices; i++) {
            const location = faker.helpers.arrayElement(customerLocations) as typeof customerLocations[0];
            const invoiceDate = faker.date.between({
                from: '2024-01-01',
                to: new Date()
            });

            // Create invoice
            const invoiceNo = `INV-${faker.string.numeric(6)}`;

            // Create invoice items first to calculate totals
            const numItems = faker.number.int({ min: 1, max: 5 });
            const items = [];
            let total = 0;

            for (let j = 0; j < numItems; j++) {
                const product = faker.helpers.arrayElement(products);
                const quantity = faker.number.int({ min: 1, max: 10 });
                const amount = parseFloat(faker.commerce.price({ min: 100, max: 50000 }));

                items.push({
                    productId: product.id,
                    serialNo: faker.string.alphanumeric(12).toUpperCase(),
                    quantity,
                    amount,
                });

                total += amount * quantity;
            }

            const discount = total * faker.number.float({ min: 0, max: 0.15 });
            const subtotal = total - discount;
            const grandTotal = subtotal;

            const invoice = await prisma.invoice.create({
                data: {
                    customerId: customer.id,
                    locationId: location.id,
                    invoiceNo,
                    invoiceDate,
                    total,
                    discount,
                    subtotal,
                    grandTotal,
                    status: faker.helpers.arrayElement(['pending', 'paid', 'cancelled', 'pending', 'paid']),
                },
            });

            // Create invoice items
            for (const item of items) {
                await prisma.invoiceitem.create({
                    data: {
                        invoiceId: invoice.id,
                        ...item,
                    },
                });
            }

            invoiceCount++;
        }
    }
    console.log(`✅ Created ${invoiceCount} invoices with items`);

    // ============================================
    // Summary
    // ============================================
    console.log('\n🎉 Database seed completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Brands: ${brands.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Customer Locations: ${locationCount}`);
    console.log(`   - Invoices: ${invoiceCount}`);
    console.log('\n🔐 Admin Login:');
    console.log(`   Email: admin@amc.com`);
    console.log(`   Password: Admin@123`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
