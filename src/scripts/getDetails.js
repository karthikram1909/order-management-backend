require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Client = require('../models/Client');
const CatalogItem = require('../models/CatalogItem');

const fetchIds = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await Admin.findOne();
        const client = await Client.findOne();
        const items = await CatalogItem.find();

        const fs = require('fs');
        fs.writeFileSync('details.json', JSON.stringify({
            adminId: admin?._id,
            adminEmail: admin?.email,
            clientId: client?._id,
            items: items.map(i => ({ id: i._id, name: i.itemName }))
        }, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
fetchIds();
