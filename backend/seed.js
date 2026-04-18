import mongoose from 'mongoose';
import { connectDatabase } from './src/config/db.js';
import { env } from './src/config/env.js';
import { Booking } from './src/models/Booking.js';
import { BookingMessage } from './src/models/BookingMessage.js';
import { Cart } from './src/models/Cart.js';
import { Coupon } from './src/models/Coupon.js';
import { Order } from './src/models/Order.js';
import { Product } from './src/models/Product.js';
import { Review } from './src/models/Review.js';
import { Service } from './src/models/Service.js';
import { SupplierLedger } from './src/models/SupplierLedger.js';
import { SupplierProfile } from './src/models/SupplierProfile.js';
import { SupportTicket } from './src/models/SupportTicket.js';
import { User } from './src/models/User.js';
import { refreshProductRating, refreshServiceRating } from './src/services/ratingService.js';
import { createSupplierPayment as createSupplierPaymentEntry } from './src/utils/ledger.js';

const images = {
  electrical:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  mechanical:
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80',
  modules:
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=1200&q=80',
  service:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
};

function date(value) {
  return new Date(value);
}

function timeline(entries) {
  return entries.map((entry) => ({
    status: entry.status,
    timestamp: date(entry.timestamp),
    note: entry.note || '',
  }));
}

async function resetDatabase() {
  await Promise.all([
    User.deleteMany({}),
    SupplierProfile.deleteMany({}),
    Product.deleteMany({}),
    Service.deleteMany({}),
    Cart.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Booking.deleteMany({}),
    BookingMessage.deleteMany({}),
    Review.deleteMany({}),
    SupplierLedger.deleteMany({}),
    SupportTicket.deleteMany({}),
  ]);
}

async function createUsers() {
  const admin = await User.create({
    name: 'Campus Admin',
    email: 'admin@campusconnect.com',
    password: 'Admin@123',
    role: 'admin',
  });

  const buyers = await User.create([
    {
      name: 'Buyer One',
      email: 'buyer1@campusconnect.com',
      password: 'Buyer@123',
    },
    {
      name: 'Buyer Two',
      email: 'buyer2@campusconnect.com',
      password: 'Buyer@123',
    },
    {
      name: 'Buyer Three',
      email: 'buyer3@campusconnect.com',
      password: 'Buyer@123',
    },
    {
      name: 'Buyer Four',
      email: 'buyer4@campusconnect.com',
      password: 'Buyer@123',
    },
  ]);

  const suppliers = await User.create([
    {
      name: 'Supplier One',
      email: 'supplier1@campusconnect.com',
      password: 'Supplier@123',
      role: 'supplier',
    },
    {
      name: 'Supplier Two',
      email: 'supplier2@campusconnect.com',
      password: 'Supplier@123',
      role: 'supplier',
    },
    {
      name: 'Supplier Three',
      email: 'supplier3@campusconnect.com',
      password: 'Supplier@123',
      role: 'supplier',
    },
  ]);

  return { admin, buyers, suppliers };
}

async function createCarts(users) {
  await Cart.insertMany(
    users.map((user) => ({
      userId: user._id,
      items: [],
      couponCode: '',
    })),
  );
}

async function createSupplierProfiles(suppliers) {
  return SupplierProfile.insertMany([
    {
      userId: suppliers[0]._id,
      fullName: 'Supplier One',
      studentId: 'CCS-2601',
      collegeName: 'Campus Connect Institute',
      department: 'Electrical Engineering',
      contactNumber: '9876543201',
      upiOrBankDetails: 'supplier1@upi',
      govIdUrl: 'https://drive.google.com/file/d/supplier1-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/supplier1-student/view',
      status: 'approved',
      approvedAt: date('2026-01-12T10:00:00.000Z'),
    },
    {
      userId: suppliers[1]._id,
      fullName: 'Supplier Two',
      studentId: 'CCS-2602',
      collegeName: 'Campus Connect Institute',
      department: 'Mechanical Engineering',
      contactNumber: '9876543202',
      upiOrBankDetails: 'supplier2@upi',
      govIdUrl: 'https://drive.google.com/file/d/supplier2-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/supplier2-student/view',
      status: 'approved',
      approvedAt: date('2026-01-15T10:00:00.000Z'),
    },
    {
      userId: suppliers[2]._id,
      fullName: 'Supplier Three',
      studentId: 'CCS-2603',
      collegeName: 'Campus Connect Institute',
      department: 'Electronics Engineering',
      contactNumber: '9876543203',
      upiOrBankDetails: 'supplier3@upi',
      govIdUrl: 'https://drive.google.com/file/d/supplier3-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/supplier3-student/view',
      status: 'approved',
      approvedAt: date('2026-01-18T10:00:00.000Z'),
      paymentRequestRaised: true,
      paymentRequestRaisedAt: date('2026-04-11T08:00:00.000Z'),
      paymentRequestNote: 'Please release the pending March-April payout.',
    },
  ]);
}

async function createCoupons(admin) {
  return Coupon.insertMany([
    {
      code: 'CAMPUS10',
      description: '10% off across the marketplace',
      type: 'percent',
      value: 10,
      maxDiscount: 300,
      minOrderValue: 1000,
      usageLimit: 100,
      perUserLimit: 2,
      startsAt: date('2026-03-01T00:00:00.000Z'),
      endsAt: date('2026-05-30T23:59:59.000Z'),
      isActive: true,
      createdBy: admin._id,
    },
    {
      code: 'LABSAVE250',
      description: 'Flat Rs 250 off on larger orders',
      type: 'flat',
      value: 250,
      maxDiscount: 0,
      minOrderValue: 2500,
      usageLimit: 50,
      perUserLimit: 1,
      startsAt: date('2026-03-15T00:00:00.000Z'),
      endsAt: date('2026-05-15T23:59:59.000Z'),
      isActive: true,
      createdBy: admin._id,
    },
    {
      code: 'OLD100',
      description: 'Expired flat discount',
      type: 'flat',
      value: 100,
      maxDiscount: 0,
      minOrderValue: 500,
      usageLimit: 10,
      perUserLimit: 1,
      startsAt: date('2026-01-01T00:00:00.000Z'),
      endsAt: date('2026-02-01T23:59:59.000Z'),
      isActive: false,
      createdBy: admin._id,
    },
  ]);
}

const serviceSeed = [
  { title: 'Tutoring', category: 'Academic Support', price: 1200, duration: '2 hours' },
  { title: 'PCB Design', category: 'Electronics Services', price: 2800, duration: '3 days' },
  { title: '3D Printing', category: 'Fabrication', price: 2200, duration: '2 days' },
  { title: 'Lab Assistance', category: 'Academic Support', price: 900, duration: '90 minutes' },
  { title: 'Project Help', category: 'Project Services', price: 1800, duration: '2 sessions' },
  { title: 'Coding Help', category: 'Programming', price: 1600, duration: '2 hours' },
];

async function createServices() {
  return Service.insertMany(
    serviceSeed.map((service) => ({
      ...service,
      description: `${service.title} support for campus buyers with admin-managed delivery and follow-up.`,
      imageUrl: images.service,
      availability: 'Mon-Sat, 10:00 AM to 7:00 PM',
      status: 'active',
      isFeatured: true,
    })),
  );
}

const productSeed = [
  {
    supplierIndex: 0,
    listingSource: 'supplier',
    title: 'Digital Clamp Meter',
    category: 'Electrical',
    condition: 'like-new',
    quotedPrice: 1350,
    sellingPrice: 1650,
    discountPercent: 8,
    availableStock: 12,
    lowStockThreshold: 3,
    status: 'approved',
    imageUrl: images.electrical,
  },
  {
    supplierIndex: 0,
    listingSource: 'supplier',
    title: 'Relay Control Board',
    category: 'Electronic Modules',
    condition: 'new',
    quotedPrice: 420,
    sellingPrice: 590,
    discountPercent: 5,
    availableStock: 16,
    lowStockThreshold: 4,
    status: 'approved',
    imageUrl: images.modules,
  },
  {
    supplierIndex: 0,
    listingSource: 'supplier',
    title: 'CNC Tool Holder',
    category: 'Mechanical',
    condition: 'good',
    quotedPrice: 880,
    sellingPrice: 1120,
    discountPercent: 10,
    availableStock: 10,
    lowStockThreshold: 3,
    status: 'approved',
    imageUrl: images.mechanical,
  },
  {
    supplierIndex: 0,
    listingSource: 'supplier',
    title: 'Breadboard Power Supply',
    category: 'Electronic Modules',
    condition: 'new',
    quotedPrice: 310,
    sellingPrice: 470,
    discountPercent: 6,
    availableStock: 18,
    lowStockThreshold: 4,
    status: 'approved',
    imageUrl: images.modules,
  },
  {
    supplierIndex: 1,
    listingSource: 'supplier',
    title: 'Three Phase Contactor',
    category: 'Electrical',
    condition: 'good',
    quotedPrice: 1420,
    sellingPrice: 1790,
    discountPercent: 7,
    availableStock: 8,
    lowStockThreshold: 2,
    status: 'approved',
    imageUrl: images.electrical,
  },
  {
    supplierIndex: 1,
    listingSource: 'supplier',
    title: 'Pneumatic Fitting Kit',
    category: 'Mechanical',
    condition: 'new',
    quotedPrice: 980,
    sellingPrice: 1260,
    discountPercent: 12,
    availableStock: 14,
    lowStockThreshold: 3,
    status: 'approved',
    imageUrl: images.mechanical,
  },
  {
    supplierIndex: 1,
    listingSource: 'supplier',
    title: 'Sensor Interface Shield',
    category: 'Electronic Modules',
    condition: 'like-new',
    quotedPrice: 760,
    sellingPrice: 980,
    discountPercent: 9,
    availableStock: 15,
    lowStockThreshold: 4,
    status: 'approved',
    imageUrl: images.modules,
  },
  {
    supplierIndex: 1,
    listingSource: 'supplier',
    title: 'Gear Coupling Set',
    category: 'Mechanical',
    condition: 'good',
    quotedPrice: 650,
    sellingPrice: 860,
    discountPercent: 4,
    availableStock: 20,
    lowStockThreshold: 5,
    status: 'approved',
    imageUrl: images.mechanical,
  },
  {
    supplierIndex: 2,
    listingSource: 'supplier',
    title: 'DC Bench Power Lead Set',
    category: 'Electrical',
    condition: 'like-new',
    quotedPrice: 540,
    sellingPrice: 720,
    discountPercent: 5,
    availableStock: 11,
    lowStockThreshold: 3,
    status: 'approved',
    imageUrl: images.electrical,
  },
  {
    supplierIndex: 2,
    listingSource: 'supplier',
    title: 'Stepper Motor Driver Board',
    category: 'Electronic Modules',
    condition: 'new',
    quotedPrice: 830,
    sellingPrice: 1100,
    discountPercent: 11,
    availableStock: 9,
    lowStockThreshold: 3,
    status: 'approved',
    imageUrl: images.modules,
  },
  {
    supplierIndex: 2,
    listingSource: 'supplier',
    title: 'Aluminum Bearing Block',
    category: 'Mechanical',
    condition: 'new',
    quotedPrice: 460,
    sellingPrice: null,
    discountPercent: 0,
    availableStock: 0,
    lowStockThreshold: 3,
    status: 'pending',
    imageUrl: images.mechanical,
  },
  {
    supplierIndex: 2,
    listingSource: 'supplier',
    title: 'Oscilloscope Probe Pair',
    category: 'Electrical',
    condition: 'fair',
    quotedPrice: 390,
    sellingPrice: null,
    discountPercent: 0,
    availableStock: 0,
    lowStockThreshold: 2,
    status: 'rejected',
    rejectionReason: 'Please upload a clearer product image and correct the condition details.',
    imageUrl: images.electrical,
  },
  {
    supplierIndex: null,
    listingSource: 'admin',
    title: 'Soldering Iron Station',
    category: 'Electrical',
    condition: 'new',
    quotedPrice: 0,
    sellingPrice: 2400,
    discountPercent: 15,
    availableStock: 13,
    lowStockThreshold: 4,
    status: 'approved',
    imageUrl: images.electrical,
  },
  {
    supplierIndex: null,
    listingSource: 'admin',
    title: '3D Printer Nozzle Pack',
    category: 'Mechanical',
    condition: 'new',
    quotedPrice: 0,
    sellingPrice: 900,
    discountPercent: 5,
    availableStock: 22,
    lowStockThreshold: 5,
    status: 'approved',
    imageUrl: images.mechanical,
  },
  {
    supplierIndex: null,
    listingSource: 'admin',
    title: 'ESP32 Development Module',
    category: 'Electronic Modules',
    condition: 'new',
    quotedPrice: 0,
    sellingPrice: 980,
    discountPercent: 10,
    availableStock: 18,
    lowStockThreshold: 4,
    status: 'approved',
    imageUrl: images.modules,
  },
];

async function createProducts(admin, suppliers) {
  return Product.insertMany(
    productSeed.map((product) => {
      const basePrice =
        product.sellingPrice === null || product.sellingPrice === undefined
          ? Number(product.quotedPrice || 0)
          : Number(product.sellingPrice || 0);
      const effectiveDiscount = Number(product.discountPercent || 0) > 0 ? Number(product.discountPercent || 0) : 0;
      const finalPrice = Math.round(basePrice * (1 - effectiveDiscount / 100));

      return {
        title: product.title,
        description: `${product.title} for campus labs, projects, and rapid prototyping.`,
        category: product.category,
        imageUrl: product.imageUrl,
        condition: product.condition,
        quotedPrice: product.quotedPrice,
        sellingPrice: product.sellingPrice,
        discountPercent: product.discountPercent,
        discountActive: Number(product.discountPercent || 0) > 0,
        finalPrice,
        availableStock: product.availableStock,
        lowStockThreshold: product.lowStockThreshold,
        unitsSold: 0,
        isFeatured: product.status === 'approved',
        isFlashSale:
          product.title === 'ESP32 Development Module' || product.title === 'Soldering Iron Station',
        hasLowStockAlert: false,
        status: product.status,
        rejectionReason: product.rejectionReason || '',
        approvedAt: product.status === 'approved' ? date('2026-02-25T09:00:00.000Z') : null,
        approvedBy: product.status === 'approved' ? admin._id : null,
        listingSource: product.listingSource,
        supplierId: product.supplierIndex === null ? null : suppliers[product.supplierIndex]._id,
      };
    }),
  );
}

function buildOrderItem(productDoc, quantity) {
  return {
    productId: productDoc._id,
    supplierId: productDoc.supplierId || null,
    title: productDoc.title,
    category: productDoc.category,
    imageUrl: productDoc.imageUrl,
    quantity,
    quotedPrice: Number(productDoc.quotedPrice || 0),
    sellingPrice:
      productDoc.sellingPrice === null || productDoc.sellingPrice === undefined
        ? Number(productDoc.quotedPrice || 0)
        : Number(productDoc.sellingPrice || 0),
    discountPercent: productDoc.discountActive ? Number(productDoc.discountPercent || 0) : 0,
    finalUnitPrice: Number(productDoc.finalPrice || 0),
    lineTotal: Number((Number(productDoc.finalPrice || 0) * quantity).toFixed(2)),
    supplierPayable: Number((Number(productDoc.quotedPrice || 0) * quantity).toFixed(2)),
  };
}

async function createOrders(buyers, products) {
  const productMap = new Map(products.map((product) => [product.title, product]));
  const orders = [
    {
      buyerId: buyers[0]._id,
      items: [
        buildOrderItem(productMap.get('Digital Clamp Meter'), 1),
        buildOrderItem(productMap.get('Relay Control Board'), 2),
      ],
      couponCode: 'CAMPUS10',
      createdAt: date('2026-03-18T09:00:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-18T09:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-18T12:00:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-19T09:30:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-20T17:10:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[1]._id,
      items: [
        buildOrderItem(productMap.get('Soldering Iron Station'), 1),
        buildOrderItem(productMap.get('Three Phase Contactor'), 1),
      ],
      couponCode: '',
      createdAt: date('2026-03-20T10:15:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-20T10:15:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-20T13:30:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-21T11:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-22T16:25:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[2]._id,
      items: [buildOrderItem(productMap.get('Sensor Interface Shield'), 1)],
      couponCode: '',
      createdAt: date('2026-03-24T08:45:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-24T08:45:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-24T11:15:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-25T09:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-26T14:40:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[3]._id,
      items: [
        buildOrderItem(productMap.get('Gear Coupling Set'), 2),
        buildOrderItem(productMap.get('3D Printer Nozzle Pack'), 1),
      ],
      couponCode: 'LABSAVE250',
      createdAt: date('2026-03-27T14:00:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-27T14:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-27T16:00:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-28T10:30:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-29T15:05:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[0]._id,
      items: [buildOrderItem(productMap.get('DC Bench Power Lead Set'), 1)],
      couponCode: '',
      createdAt: date('2026-03-30T09:20:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-30T09:20:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-30T11:40:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-31T13:10:00.000Z' },
        { status: 'delivered', timestamp: '2026-04-01T17:50:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[1]._id,
      items: [buildOrderItem(productMap.get('Stepper Motor Driver Board'), 2)],
      couponCode: '',
      createdAt: date('2026-04-02T08:10:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-04-02T08:10:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-02T11:20:00.000Z' },
        { status: 'shipped', timestamp: '2026-04-03T09:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-04-04T12:35:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[2]._id,
      items: [
        buildOrderItem(productMap.get('ESP32 Development Module'), 1),
        buildOrderItem(productMap.get('CNC Tool Holder'), 1),
      ],
      couponCode: '',
      createdAt: date('2026-04-05T10:30:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-04-05T10:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-05T12:10:00.000Z' },
        { status: 'shipped', timestamp: '2026-04-06T11:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-04-07T16:10:00.000Z' },
      ]),
      orderStatus: 'delivered',
    },
    {
      buyerId: buyers[3]._id,
      items: [buildOrderItem(productMap.get('Breadboard Power Supply'), 1)],
      couponCode: '',
      createdAt: date('2026-04-08T09:15:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-04-08T09:15:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-08T11:15:00.000Z' },
        { status: 'shipped', timestamp: '2026-04-09T13:00:00.000Z' },
      ]),
      orderStatus: 'shipped',
    },
    {
      buyerId: buyers[0]._id,
      items: [buildOrderItem(productMap.get('Pneumatic Fitting Kit'), 3)],
      couponCode: '',
      createdAt: date('2026-04-09T16:45:00.000Z'),
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-04-09T16:45:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-10T09:20:00.000Z' },
        { status: 'shipped', timestamp: '2026-04-11T12:15:00.000Z' },
      ]),
      orderStatus: 'shipped',
    },
    {
      buyerId: buyers[1]._id,
      items: [buildOrderItem(productMap.get('Soldering Iron Station'), 1)],
      couponCode: '',
      createdAt: date('2026-04-12T12:20:00.000Z'),
      statusTimeline: timeline([{ status: 'placed', timestamp: '2026-04-12T12:20:00.000Z' }]),
      orderStatus: 'placed',
    },
  ];

  return Order.insertMany(
    orders.map((order, index) => {
      const subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const couponDiscount =
        order.couponCode === 'CAMPUS10'
          ? Number((subtotal * 0.1).toFixed(2))
          : order.couponCode === 'LABSAVE250'
            ? 250
            : 0;

      return {
        buyerId: order.buyerId,
        items: order.items,
        subtotal,
        couponCode: order.couponCode,
        couponDiscount,
        totalAmount: Number((subtotal - couponDiscount).toFixed(2)),
        paymentStatus: 'paid',
        paymentProvider: index % 2 === 0 ? 'razorpay' : 'manual',
        paymentMethod: index % 3 === 0 ? 'card' : 'upi',
        paymentReference: `PAY_2026_${String(index + 1).padStart(3, '0')}`,
        gatewayOrderId: index % 2 === 0 ? `order_demo_${index + 1}` : '',
        transactionId: `ORD_2026_${String(index + 1).padStart(3, '0')}`,
        orderStatus: order.orderStatus,
        statusTimeline: order.statusTimeline,
        deliveryAddress: `Campus Hostel Block ${String.fromCharCode(65 + (index % 4))}, Room ${100 + index}`,
        createdAt: order.createdAt,
        updatedAt: order.statusTimeline[order.statusTimeline.length - 1].timestamp,
      };
    }),
  );
}

async function syncOrderLedger(orders) {
  for (const order of orders) {
    const creditDocs = order.items
      .filter((item) => item.supplierId)
      .map((item) => ({
        supplierId: item.supplierId,
        orderId: order._id,
        orderItemId: item._id,
        productId: item.productId,
        type: 'credit',
        status: 'pending',
        amount: item.supplierPayable,
        description: `Order ${order.transactionId} - ${item.title}`,
        reference: order.transactionId,
        notes: 'Auto-created from seeded order.',
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
      }));

    const entries = creditDocs.length ? await SupplierLedger.insertMany(creditDocs) : [];
    const entryMap = new Map(entries.map((entry) => [entry.orderItemId.toString(), entry._id]));

    order.items.forEach((item) => {
      item.supplierLedgerEntryId = entryMap.get(item._id.toString()) || null;
    });

    await order.save();
  }
}

async function applySeededProductInventory(products, orders) {
  const orderedUnits = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'cancelled') {
      return;
    }

    order.items.forEach((item) => {
      const key = item.productId.toString();
      orderedUnits.set(key, (orderedUnits.get(key) || 0) + Number(item.quantity || 0));
    });
  });

  const baseStockMap = new Map(
    productSeed.map((product) => [product.title, Number(product.availableStock || 0)]),
  );

  for (const product of products) {
    const orderedQty = orderedUnits.get(product._id.toString()) || 0;
    const baseStock = baseStockMap.get(product.title) || 0;

    product.unitsSold = orderedQty;
    product.availableStock = Math.max(baseStock - orderedQty, 0);
    product.hasLowStockAlert = product.availableStock <= product.lowStockThreshold;
    product.lowStockAlertAt = product.hasLowStockAlert ? date('2026-04-10T09:00:00.000Z') : null;
    await product.save();
  }
}

async function createBookings(buyers, services) {
  return Booking.insertMany([
    {
      buyerId: buyers[0]._id,
      serviceId: services[0]._id,
      serviceTitle: services[0].title,
      scheduledDate: date('2026-03-25T15:00:00.000Z'),
      duration: services[0].duration,
      totalAmount: services[0].price,
      paymentStatus: 'paid',
      paymentProvider: 'razorpay',
      paymentMethod: 'card',
      paymentReference: 'BKG_PAY_001',
      transactionId: 'BKG_2026_001',
      bookingStatus: 'completed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-03-22T09:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-22T12:00:00.000Z' },
        { status: 'completed', timestamp: '2026-03-25T18:00:00.000Z' },
      ]),
      confirmedAt: date('2026-03-22T12:00:00.000Z'),
      completedAt: date('2026-03-25T18:00:00.000Z'),
      paidAt: date('2026-03-22T09:05:00.000Z'),
      createdAt: date('2026-03-22T09:00:00.000Z'),
      updatedAt: date('2026-03-25T18:00:00.000Z'),
    },
    {
      buyerId: buyers[1]._id,
      serviceId: services[1]._id,
      serviceTitle: services[1].title,
      scheduledDate: date('2026-03-28T11:00:00.000Z'),
      duration: services[1].duration,
      totalAmount: services[1].price,
      paymentStatus: 'paid',
      paymentProvider: 'manual',
      paymentMethod: 'upi',
      paymentReference: 'BKG_PAY_002',
      transactionId: 'BKG_2026_002',
      bookingStatus: 'completed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-03-24T10:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-24T13:00:00.000Z' },
        { status: 'completed', timestamp: '2026-03-28T13:30:00.000Z' },
      ]),
      confirmedAt: date('2026-03-24T13:00:00.000Z'),
      completedAt: date('2026-03-28T13:30:00.000Z'),
      paidAt: date('2026-03-24T10:05:00.000Z'),
      createdAt: date('2026-03-24T10:00:00.000Z'),
      updatedAt: date('2026-03-28T13:30:00.000Z'),
    },
    {
      buyerId: buyers[2]._id,
      serviceId: services[2]._id,
      serviceTitle: services[2].title,
      scheduledDate: date('2026-04-01T16:00:00.000Z'),
      duration: services[2].duration,
      totalAmount: services[2].price,
      paymentStatus: 'paid',
      paymentProvider: 'razorpay',
      paymentMethod: 'card',
      paymentReference: 'BKG_PAY_003',
      transactionId: 'BKG_2026_003',
      bookingStatus: 'completed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-03-29T11:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-29T15:00:00.000Z' },
        { status: 'completed', timestamp: '2026-04-01T18:15:00.000Z' },
      ]),
      confirmedAt: date('2026-03-29T15:00:00.000Z'),
      completedAt: date('2026-04-01T18:15:00.000Z'),
      paidAt: date('2026-03-29T11:05:00.000Z'),
      createdAt: date('2026-03-29T11:00:00.000Z'),
      updatedAt: date('2026-04-01T18:15:00.000Z'),
    },
    {
      buyerId: buyers[3]._id,
      serviceId: services[3]._id,
      serviceTitle: services[3].title,
      scheduledDate: date('2026-04-03T13:00:00.000Z'),
      duration: services[3].duration,
      totalAmount: services[3].price,
      paymentStatus: 'paid',
      paymentProvider: 'manual',
      paymentMethod: 'upi',
      paymentReference: 'BKG_PAY_004',
      transactionId: 'BKG_2026_004',
      bookingStatus: 'completed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-03-31T09:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-31T11:00:00.000Z' },
        { status: 'completed', timestamp: '2026-04-03T15:20:00.000Z' },
      ]),
      confirmedAt: date('2026-03-31T11:00:00.000Z'),
      completedAt: date('2026-04-03T15:20:00.000Z'),
      paidAt: date('2026-03-31T09:35:00.000Z'),
      createdAt: date('2026-03-31T09:30:00.000Z'),
      updatedAt: date('2026-04-03T15:20:00.000Z'),
    },
    {
      buyerId: buyers[0]._id,
      serviceId: services[4]._id,
      serviceTitle: services[4].title,
      scheduledDate: date('2026-04-16T15:00:00.000Z'),
      duration: services[4].duration,
      totalAmount: services[4].price,
      paymentStatus: 'paid',
      paymentProvider: 'razorpay',
      paymentMethod: 'card',
      paymentReference: 'BKG_PAY_005',
      transactionId: 'BKG_2026_005',
      bookingStatus: 'confirmed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-04-10T09:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-10T14:00:00.000Z' },
      ]),
      confirmedAt: date('2026-04-10T14:00:00.000Z'),
      paidAt: date('2026-04-10T09:05:00.000Z'),
      createdAt: date('2026-04-10T09:00:00.000Z'),
      updatedAt: date('2026-04-10T14:00:00.000Z'),
    },
    {
      buyerId: buyers[1]._id,
      serviceId: services[5]._id,
      serviceTitle: services[5].title,
      scheduledDate: date('2026-04-17T11:00:00.000Z'),
      duration: services[5].duration,
      totalAmount: services[5].price,
      paymentStatus: 'paid',
      paymentProvider: 'manual',
      paymentMethod: 'upi',
      paymentReference: 'BKG_PAY_006',
      transactionId: 'BKG_2026_006',
      bookingStatus: 'confirmed',
      statusTimeline: timeline([
        { status: 'pending', timestamp: '2026-04-11T10:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-04-11T13:15:00.000Z' },
      ]),
      confirmedAt: date('2026-04-11T13:15:00.000Z'),
      paidAt: date('2026-04-11T10:05:00.000Z'),
      createdAt: date('2026-04-11T10:00:00.000Z'),
      updatedAt: date('2026-04-11T13:15:00.000Z'),
    },
    {
      buyerId: buyers[2]._id,
      serviceId: services[0]._id,
      serviceTitle: services[0].title,
      scheduledDate: date('2026-04-20T15:30:00.000Z'),
      duration: services[0].duration,
      totalAmount: services[0].price,
      paymentStatus: 'paid',
      paymentProvider: 'razorpay',
      paymentMethod: 'card',
      paymentReference: 'BKG_PAY_007',
      transactionId: 'BKG_2026_007',
      bookingStatus: 'pending',
      statusTimeline: timeline([{ status: 'pending', timestamp: '2026-04-12T11:00:00.000Z' }]),
      paidAt: date('2026-04-12T11:05:00.000Z'),
      createdAt: date('2026-04-12T11:00:00.000Z'),
      updatedAt: date('2026-04-12T11:00:00.000Z'),
    },
    {
      buyerId: buyers[3]._id,
      serviceId: services[2]._id,
      serviceTitle: services[2].title,
      scheduledDate: date('2026-04-22T10:00:00.000Z'),
      duration: services[2].duration,
      totalAmount: services[2].price,
      paymentStatus: 'paid',
      paymentProvider: 'manual',
      paymentMethod: 'upi',
      paymentReference: 'BKG_PAY_008',
      transactionId: 'BKG_2026_008',
      bookingStatus: 'pending',
      statusTimeline: timeline([{ status: 'pending', timestamp: '2026-04-13T08:30:00.000Z' }]),
      paidAt: date('2026-04-13T08:35:00.000Z'),
      createdAt: date('2026-04-13T08:30:00.000Z'),
      updatedAt: date('2026-04-13T08:30:00.000Z'),
    },
  ]);
}

async function createBookingMessages(bookings, admin, buyers) {
  const bookingMap = new Map(bookings.map((booking) => [booking.transactionId, booking]));

  await BookingMessage.insertMany([
    {
      bookingId: bookingMap.get('BKG_2026_005')._id,
      senderId: buyers[0]._id,
      message: 'Can we keep the project help session focused on report structure?',
      createdAt: date('2026-04-10T15:00:00.000Z'),
      updatedAt: date('2026-04-10T15:00:00.000Z'),
    },
    {
      bookingId: bookingMap.get('BKG_2026_005')._id,
      senderId: admin._id,
      message: 'Yes, the session plan is updated and ready for that.',
      createdAt: date('2026-04-10T15:10:00.000Z'),
      updatedAt: date('2026-04-10T15:10:00.000Z'),
    },
    {
      bookingId: bookingMap.get('BKG_2026_006')._id,
      senderId: buyers[1]._id,
      message: 'Please share the GitHub repo checklist before the coding help call.',
      createdAt: date('2026-04-11T14:00:00.000Z'),
      updatedAt: date('2026-04-11T14:00:00.000Z'),
    },
    {
      bookingId: bookingMap.get('BKG_2026_006')._id,
      senderId: admin._id,
      message: 'Checklist shared. We will review setup, bugs, and deployment flow.',
      createdAt: date('2026-04-11T14:05:00.000Z'),
      updatedAt: date('2026-04-11T14:05:00.000Z'),
    },
  ]);
}

async function createReviews(buyers, products, services) {
  const productMap = new Map(products.map((product) => [product.title, product]));
  const serviceMap = new Map(services.map((service) => [service.title, service]));

  await Review.insertMany([
    {
      reviewerId: buyers[0]._id,
      targetId: productMap.get('Digital Clamp Meter')._id,
      targetType: 'product',
      rating: 5,
      comment: 'Accurate readings and clean packaging.',
    },
    {
      reviewerId: buyers[1]._id,
      targetId: productMap.get('Three Phase Contactor')._id,
      targetType: 'product',
      rating: 4,
      comment: 'Worked well in the lab setup and arrived quickly.',
    },
    {
      reviewerId: buyers[2]._id,
      targetId: productMap.get('Sensor Interface Shield')._id,
      targetType: 'product',
      rating: 5,
      comment: 'Perfect for interfacing modules without extra wiring hassle.',
    },
    {
      reviewerId: buyers[3]._id,
      targetId: productMap.get('Gear Coupling Set')._id,
      targetType: 'product',
      rating: 4,
      comment: 'Solid finish and fit for our mechanical demo.',
    },
    {
      reviewerId: buyers[0]._id,
      targetId: serviceMap.get('Project Help')._id,
      targetType: 'service',
      rating: 5,
      comment: 'The guidance made the project presentation much sharper.',
    },
    {
      reviewerId: buyers[1]._id,
      targetId: serviceMap.get('PCB Design')._id,
      targetType: 'service',
      rating: 5,
      comment: 'Great design walkthrough and production-ready outputs.',
    },
    {
      reviewerId: buyers[2]._id,
      targetId: serviceMap.get('3D Printing')._id,
      targetType: 'service',
      rating: 4,
      comment: 'Good print quality and clear material suggestions.',
    },
    {
      reviewerId: buyers[3]._id,
      targetId: serviceMap.get('Lab Assistance')._id,
      targetType: 'service',
      rating: 4,
      comment: 'Helpful session and better clarity before submission.',
    },
  ]);

  await Promise.all([
    refreshProductRating(productMap.get('Digital Clamp Meter')._id),
    refreshProductRating(productMap.get('Three Phase Contactor')._id),
    refreshProductRating(productMap.get('Sensor Interface Shield')._id),
    refreshProductRating(productMap.get('Gear Coupling Set')._id),
    refreshServiceRating(serviceMap.get('Project Help')._id),
    refreshServiceRating(serviceMap.get('PCB Design')._id),
    refreshServiceRating(serviceMap.get('3D Printing')._id),
    refreshServiceRating(serviceMap.get('Lab Assistance')._id),
  ]);
}

async function createSupportTickets(buyers, suppliers) {
  await SupportTicket.insertMany([
    {
      raisedBy: buyers[0]._id,
      subject: 'Need invoice for delivered order',
      description: 'Please share the invoice copy for order ORD_2026_001.',
      status: 'open',
      createdAt: date('2026-04-09T09:00:00.000Z'),
      updatedAt: date('2026-04-09T09:00:00.000Z'),
    },
    {
      raisedBy: buyers[2]._id,
      subject: 'Confirmed booking reschedule question',
      description: 'Can my confirmed service booking be moved to the next day?',
      status: 'in-progress',
      adminNote: 'Admin is coordinating a revised slot.',
      createdAt: date('2026-04-11T10:00:00.000Z'),
      updatedAt: date('2026-04-11T12:00:00.000Z'),
    },
    {
      raisedBy: suppliers[2]._id,
      subject: 'Pending payout follow-up',
      description: 'Please review the supplier payment request raised for April.',
      status: 'open',
      createdAt: date('2026-04-11T08:10:00.000Z'),
      updatedAt: date('2026-04-11T08:10:00.000Z'),
    },
  ]);
}

async function createSupplierPayments(suppliers) {
  const supplierOneCredits = await SupplierLedger.find({
    supplierId: suppliers[0]._id,
    type: 'credit',
    status: 'pending',
  }).sort({ createdAt: 1 });
  const supplierTwoCredits = await SupplierLedger.find({
    supplierId: suppliers[1]._id,
    type: 'credit',
    status: 'pending',
  }).sort({ createdAt: 1 });

  const supplierOneAmount = supplierOneCredits
    .slice(0, 2)
    .reduce((sum, credit) => sum + Number(credit.amount || 0), 0);
  const supplierTwoAmount = supplierTwoCredits
    .slice(0, 2)
    .reduce((sum, credit) => sum + Number(credit.amount || 0), 0);

  if (supplierOneAmount > 0) {
    await createSupplierPaymentEntry({
      supplierId: suppliers[0]._id,
      amount: supplierOneAmount,
      method: 'bank-transfer',
      reference: 'SUP-PAY-2026-001',
      notes: 'Seeded payout for supplier one.',
    });
  }

  if (supplierTwoAmount > 0) {
    await createSupplierPaymentEntry({
      supplierId: suppliers[1]._id,
      amount: supplierTwoAmount,
      method: 'upi',
      reference: 'SUP-PAY-2026-002',
      notes: 'Seeded payout for supplier two.',
    });
  }
}

async function seed() {
  await connectDatabase();
  await resetDatabase();

  const { admin, buyers, suppliers } = await createUsers();
  await createCarts([admin, ...buyers, ...suppliers]);
  await createSupplierProfiles(suppliers);
  await createCoupons(admin);
  const services = await createServices();
  const products = await createProducts(admin, suppliers);
  const orders = await createOrders(buyers, products);
  await syncOrderLedger(orders);
  await applySeededProductInventory(await Product.find({}), orders);
  const bookings = await createBookings(buyers, services);
  await createBookingMessages(bookings, admin, buyers);
  await createReviews(buyers, await Product.find({}), await Service.find({}));
  await createSupportTickets(buyers, suppliers);
  await createSupplierPayments(suppliers);

  if (env.enableBackendLogs) {
    console.log('CampusConnect supplier platform seed complete.');
    console.log('Admin login: admin@campusconnect.com / Admin@123');
    console.log('Buyer login: buyer1@campusconnect.com / Buyer@123');
    console.log('Supplier login: supplier1@campusconnect.com / Supplier@123');
  }
}

seed()
  .catch((error) => {
    if (env.enableBackendLogs) {
      console.error('Seed failed:', error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
