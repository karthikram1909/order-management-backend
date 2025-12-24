require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const CatalogItem = require('../models/CatalogItem');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing (optional, maybe dangerous? let's not clear, just add if not exists, or just add new unique ones)
        // For simplicity of "testing", I'll valid unique constraints. 
        // Client mobileNumber is unique. Admin email is unique.

        // 1. Create Admin
        const adminEmail = 'admin@test.com';
        let admin = await Admin.findOne({ email: adminEmail });
        if (!admin) {
            admin = await new Admin({
                name: 'Super Admin',
                email: adminEmail,
                password: 'password123',
                role: 'ADMIN'
            }).save();
            console.log('Admin created');
        } else {
            console.log('Admin already exists');
        }

        // 2. Create Client
        const clientMobile = '9876543210';
        let client = await Client.findOne({ mobileNumber: clientMobile });
        if (!client) {
            client = await new Client({
                name: 'Test Client',
                mobileNumber: clientMobile,
                address: '123 Test St, Salem'
            }).save();
            console.log('Client created');
        } else {
            console.log('Client already exists');
        }

        // 3. Create Catalog Items
        const itemsData = [
            { itemName: 'Onion', unit: 'kg' },
            { itemName: 'Tomato', unit: 'kg' },
            { itemName: 'Oil', unit: 'liter' }
        ];

        const itemIds = [];
        for (const itemData of itemsData) {
            let item = await CatalogItem.findOne({ itemName: itemData.itemName });
            if (!item) {
                item = await new CatalogItem(itemData).save();
            }
            itemIds.push(item);
        }
        console.log('Items created/found');

        console.log('\n--- ID REFERENCE FOR POSTMAN ---');
        console.log(`ADMIN_EMAIL: ${admin.email}`);
        console.log(`ADMIN_PASSWORD: password123`);
        console.log(`CLIENT_ID: ${client._id}`);
        console.log(`ITEM_ONION_ID: ${itemIds[0]._id}`);
        console.log(`ITEM_TOMATO_ID: ${itemIds[1]._id}`);
        console.log('--------------------------------\n');

        process.exit(0);
    } catch (err) {
        console.error('SEED ERROR:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

seedData();
