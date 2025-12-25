const Order = require('../models/Order');

// Valid Transitions Map
const VALID_TRANSITIONS = {
    'NEW_INQUIRY': ['PENDING_PRICING', 'WAITING_CLIENT_APPROVAL', 'CANCELLED'],
    'PENDING_PRICING': ['WAITING_CLIENT_APPROVAL', 'NEW_INQUIRY', 'CANCELLED'],
    'WAITING_CLIENT_APPROVAL': ['ORDER_CONFIRMED', 'PENDING_PRICING', 'CANCELLED'],
    'ORDER_CONFIRMED': ['AWAITING_PAYMENT', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    'AWAITING_PAYMENT': ['PAYMENT_CLEARED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    'PAYMENT_CLEARED': ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': ['CLOSED'],
    'CLOSED': [],
    'CANCELLED': []
};

exports.updateOrderStatus = async (orderId, newStatus, actor, note = '') => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const currentStatus = order.orderStatus;

    // Validate Transition
    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Business Logic Checks
    if (newStatus === 'CLOSED') {
        if (order.paymentStatus !== 'PAID' || order.deliveryStatus !== 'CONFIRMED') {
            throw new Error('Cannot close order. Payment must be PAID and Delivery CONFIRMED.');
        }
    }

    // Update Status
    order.orderStatus = newStatus;

    // Audit Log
    order.auditLogs.push({
        action: 'STATUS_CHANGE',
        changedBy: actor,
        detail: `Changed status from ${currentStatus} to ${newStatus}. ${note}`,
        timestamp: new Date()
    });

    await order.save();
    return order;
};

exports.modifyOrderItems = async (orderId, newItems, actor) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    // Prevent modification if confirmed (unless Admin override - handled in controller/middleware)
    if (['ORDER_CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_CLEARED', 'IN_TRANSIT', 'DELIVERED', 'CLOSED'].includes(order.orderStatus)) {
        // This check might be redundant if controller handles role check, but good for safety
        // For now, assuming this service method is called after permission check
    }

    // Merge new items with existing prices to preserve unitPrice
    const mergedItems = newItems.map(newItem => {
        const existingItem = order.items.find(item =>
            item.itemId.toString() === newItem.itemId.toString()
        );

        return {
            itemId: newItem.itemId,
            quantity: newItem.quantity,
            unitPrice: existingItem ? existingItem.unitPrice : 0
            // totalPrice will be calculated by pre-save middleware
        };
    });

    order.items = mergedItems;

    // Reset prices if client modifies (Admin pricing needed again)
    // Or if simple quantity change, maybe keep unit price?
    // Use case: "If client adds new item -> revert to PENDING_PRICING"

    // Logic: Revert to PENDING_PRICING for Admin re-evaluation
    if (order.orderStatus !== 'NEW_INQUIRY') {
        order.orderStatus = 'PENDING_PRICING';
        order.auditLogs.push({
            action: 'STATUS_RESET',
            changedBy: 'SYSTEM',
            detail: 'Order modified by client, status reset to PENDING_PRICING',
            timestamp: new Date()
        });
    }

    order.auditLogs.push({
        action: 'ITEMS_UPDATED',
        changedBy: actor,
        detail: 'Items or quantities modified',
        timestamp: new Date()
    });

    await order.save();
    return order;
};
