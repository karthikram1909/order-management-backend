require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Client = require('./src/models/Client');

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project4');
        console.log('Connected');

        const orders = await Order.find({}).populate('clientId');
        console.log('Total Orders:', orders.length);
        if (orders.length > 0) {
            console.log('Sample Order Status:', orders[0].orderStatus);
            console.log('Sample Order Client:', orders[0].clientId ? orders[0].clientId.name : 'Unpopulated/Null');
        } else {
            console.log('No orders found in DB.');
        }

        const clients = await Client.find({});
        console.log('Total Clients:', clients.length);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
