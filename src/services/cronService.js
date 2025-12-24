const cron = require('node-cron');
const Order = require('../models/Order');

const initCronJobs = () => {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Daily Credit Due Check...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueOrders = await Order.find({
            paymentType: 'CREDIT',
            paymentStatus: 'PENDING',
            creditDueDate: { $lte: today },
            orderStatus: { $ne: 'CLOSED' } // Don't remind for closed orders? Or maybe yes if unpaid.
        }).populate('clientId');

        dueOrders.forEach(order => {
            // Logic to notify Admin
            console.log(`[ALERT] Order #${order._id} for Client ${order.clientId?.name} is DUE/OVERDUE (Due: ${order.creditDueDate})`);

            // In a real app, send Email/SMS/Push Notification here
        });
    });
};

module.exports = initCronJobs;
