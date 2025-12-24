require('dotenv').config();
const mongoose = require('mongoose');
const CatalogItem = require('../src/models/CatalogItem');
const Admin = require('../src/models/Admin');
const Client = require('../src/models/Client');
const Order = require('../src/models/Order');

const products = [
    {
        itemName: "Premium Steel Rods",
        description: "High-quality steel rods for construction, corrosion-resistant",
        unit: "kg",
    },
    {
        itemName: "Cement Portland",
        description: "Grade 43 Portland cement, ideal for general construction",
        unit: "box",
    },
    {
        itemName: "Sand (Fine)",
        description: "Fine-grain river sand, washed and filtered",
        unit: "ton",
    },
    {
        itemName: "Bricks (Red)",
        description: "Standard size red clay bricks, high durability",
        unit: "piece",
    },
    {
        itemName: "Aggregate (20mm)",
        description: "Crushed stone aggregate, 20mm size for concrete",
        unit: "kg",
    },
    {
        itemName: "TMT Bars 12mm",
        description: "Thermo-mechanically treated steel bars, Fe-500 grade",
        unit: "kg",
    },
];

const dummyClients = [
    {
        name: "John Doe Construction",
        mobileNumber: "+919876543210",
        address: "123 Construction Ave, Salem",
        otp: "1234",
        otpExpires: Date.now() + 3600000 // Valid for 1 hour
    },
    {
        name: "City Builders Ltd",
        mobileNumber: "+919876543211",
        address: "456 City Center, Salem",
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project4');
        console.log('MongoDB Connected');

        // Clear existing data
        await CatalogItem.deleteMany({});
        await Client.deleteMany({});
        await Order.deleteMany({});
        // await Admin.deleteMany({}); // Optional: Keep admin if you want

        console.log('Cleared DB');

        // Insert Products
        const createdProducts = await CatalogItem.insertMany(products);
        console.log('Seeded CatalogItems');

        // Insert Clients
        const createdClients = await Client.insertMany(dummyClients);
        console.log('Seeded Clients');

        // Insert Dummy Orders
        const orders = [
            {
                clientId: createdClients[0]._id,
                items: [
                    { itemId: createdProducts[0]._id, quantity: 100 }, // Steel Rods
                    { itemId: createdProducts[1]._id, quantity: 50 }   // Cement
                ],
                orderStatus: 'NEW_INQUIRY',
                auditLogs: [{ action: 'CREATED', changedBy: 'CLIENT', detail: 'Inquiry submitted' }]
            },
            {
                clientId: createdClients[1]._id,
                items: [
                    { itemId: createdProducts[3]._id, quantity: 5000 } // Bricks
                ],
                orderStatus: 'PENDING_PRICING', // Admin needs to price this
                auditLogs: [{ action: 'CREATED', changedBy: 'CLIENT', detail: 'Inquiry submitted' }]
            }
        ];

        await Order.insertMany(orders);
        console.log('Seeded Orders');

        // Seed Admin (Idempotent)
        const adminExists = await Admin.findOne({ email: 'admin@example.com' });
        if (!adminExists) {
            const admin = new Admin({
                username: 'admin',
                email: 'admin@example.com',
                password: 'password123',
                role: 'ADMIN'
            });
            await admin.save();
            console.log('Seeded Admin User');
        } else {
            console.log('Admin already exists');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
