import mongoose from 'mongoose';
import { connectDatabase } from './src/config/db.js';
import { env } from './src/config/env.js';
import { Booking } from './src/models/Booking.js';
import { Cart } from './src/models/Cart.js';
import { Order } from './src/models/Order.js';
import { Product } from './src/models/Product.js';
import { Review } from './src/models/Review.js';
import { SellerProfile } from './src/models/SellerProfile.js';
import { Service } from './src/models/Service.js';
import { SupportTicket } from './src/models/SupportTicket.js';
import { User } from './src/models/User.js';
import { refreshProductRating, refreshServiceRating } from './src/services/ratingService.js';

const unsplashImages = {
  books:
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
  electronics:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
  accessories:
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  lab:
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80',
  tutoring:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  design:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
  coding:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  writing:
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
};

async function resetDatabase() {
  await Promise.all([
    User.deleteMany({}),
    SellerProfile.deleteMany({}),
    Product.deleteMany({}),
    Service.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
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
      name: 'Rahul Sharma',
      email: 'rahul@campusconnect.com',
      password: 'Buyer@123',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=1',
    },
    {
      name: 'Megha Patil',
      email: 'megha@campusconnect.com',
      password: 'Buyer@123',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=5',
    },
    {
      name: 'Pooja Nair',
      email: 'pooja@campusconnect.com',
      password: 'Buyer@123',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=10',
    },
    {
      name: 'Kabir Singh',
      email: 'kabir@campusconnect.com',
      password: 'Buyer@123',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=12',
    },
    {
      name: 'Anvi Desai',
      email: 'anvi@campusconnect.com',
      password: 'Buyer@123',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=20',
    },
  ]);

  const sellers = await User.create([
    {
      name: 'Priya Mehta',
      email: 'priya@campusconnect.com',
      password: 'Seller@123',
      role: 'seller',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=30',
    },
    {
      name: 'Dev Malhotra',
      email: 'dev@campusconnect.com',
      password: 'Seller@123',
      role: 'seller',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=33',
    },
    {
      name: 'Riya Singh',
      email: 'riya@campusconnect.com',
      password: 'Seller@123',
      role: 'seller',
      profilePictureUrl: 'https://i.pravatar.cc/300?img=45',
    },
  ]);

  return { admin, buyers, sellers };
}

async function createCarts(users) {
  const cartDocs = users.map((user) => ({
    userId: user._id,
    items: [],
  }));

  await Cart.insertMany(cartDocs);
}

async function createSellerProfiles(sellers) {
  return SellerProfile.insertMany([
    {
      userId: sellers[0]._id,
      fullName: 'Priya Mehta',
      studentId: 'SPIT2026001',
      collegeName: 'SPIT',
      department: 'Information Technology',
      contactNumber: '9876543210',
      upiOrBankDetails: 'priya@upi',
      govIdUrl: 'https://drive.google.com/file/d/priya-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/priya-student/view',
      status: 'approved',
      approvedAt: new Date('2026-01-10T10:00:00.000Z'),
    },
    {
      userId: sellers[1]._id,
      fullName: 'Dev Malhotra',
      studentId: 'DJ2026015',
      collegeName: 'DJ Sanghvi',
      department: 'Computer Engineering',
      contactNumber: '9123456780',
      upiOrBankDetails: 'dev@upi',
      govIdUrl: 'https://drive.google.com/file/d/dev-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/dev-student/view',
      status: 'approved',
      approvedAt: new Date('2026-01-15T10:00:00.000Z'),
    },
    {
      userId: sellers[2]._id,
      fullName: 'Riya Singh',
      studentId: 'VES2026022',
      collegeName: 'VESIT',
      department: 'Computer Science',
      contactNumber: '9988776655',
      upiOrBankDetails: 'riya@upi',
      govIdUrl: 'https://drive.google.com/file/d/riya-gov/view',
      studentIdUrl: 'https://drive.google.com/file/d/riya-student/view',
      status: 'approved',
      approvedAt: new Date('2026-01-20T10:00:00.000Z'),
    },
  ]);
}

async function createProducts(sellers) {
  return Product.insertMany([
    {
      sellerId: sellers[0]._id,
      title: 'Data Structures Handbook',
      description: 'Clean second-hand copy with highlighted placement-focused notes.',
      category: 'Books',
      price: 220,
      imageUrl: unsplashImages.books,
      condition: 'good',
      stock: 7,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[0]._id,
      title: 'Scientific Calculator FX-991',
      description: 'Reliable calculator ideal for engineering math and physics exams.',
      category: 'Electronics',
      price: 650,
      imageUrl: unsplashImages.electronics,
      condition: 'like-new',
      stock: 4,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[0]._id,
      title: 'Campus Club Hoodie',
      description: 'Official hoodie in excellent condition and perfect for hostel evenings.',
      category: 'Accessories',
      price: 900,
      imageUrl: unsplashImages.accessories,
      condition: 'good',
      stock: 3,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[1]._id,
      title: 'Breadboard + Sensor Kit',
      description: 'Starter electronics kit for mini projects and lab practice.',
      category: 'Lab Equipment',
      price: 1200,
      imageUrl: unsplashImages.lab,
      condition: 'new',
      stock: 5,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[1]._id,
      title: 'Bluetooth Earbuds',
      description: 'Compact earbuds with charging case and good classroom audio clarity.',
      category: 'Electronics',
      price: 1100,
      imageUrl: unsplashImages.electronics,
      condition: 'good',
      stock: 6,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[1]._id,
      title: 'Laptop Sleeve 14-inch',
      description: 'Water-resistant sleeve with padded interior and side pocket.',
      category: 'Accessories',
      price: 480,
      imageUrl: unsplashImages.accessories,
      condition: 'new',
      stock: 10,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[2]._id,
      title: 'Operating Systems Textbook',
      description: 'Semester-ready reference copy with chapter summaries and solved problems.',
      category: 'Books',
      price: 350,
      imageUrl: unsplashImages.books,
      condition: 'fair',
      stock: 8,
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[2]._id,
      title: 'Digital Multimeter',
      description: 'Accurate multimeter for lab sessions and electronics troubleshooting.',
      category: 'Lab Equipment',
      price: 980,
      imageUrl: unsplashImages.lab,
      condition: 'like-new',
      stock: 2,
      isActive: true,
      status: 'approved',
    },
  ]);
}

async function createServices(sellers) {
  return Service.insertMany([
    {
      sellerId: sellers[2]._id,
      title: 'First-Year Math Tutoring',
      description: 'Concept-first tutoring for calculus, algebra, and engineering math.',
      category: 'Tutoring',
      price: 500,
      imageUrl: unsplashImages.tutoring,
      availability: 'Weekdays after 5 PM',
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[1]._id,
      title: 'Poster and Resume Design',
      description: 'Fast-turnaround design support for resumes, posters, and event collateral.',
      category: 'Design',
      price: 800,
      imageUrl: unsplashImages.design,
      availability: 'Sat-Sun 10 AM to 6 PM',
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[1]._id,
      title: 'React Debugging Session',
      description: 'One-on-one help for React assignments, routing bugs, and UI cleanup.',
      category: 'Coding',
      price: 1000,
      imageUrl: unsplashImages.coding,
      availability: 'Mon, Wed, Fri evenings',
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[2]._id,
      title: 'SOP and LinkedIn Writing Help',
      description: 'Editing support for SOPs, internship mailers, and LinkedIn profiles.',
      category: 'Content Writing',
      price: 650,
      imageUrl: unsplashImages.writing,
      availability: 'Daily 2 PM to 8 PM',
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[0]._id,
      title: 'Engineering Drawing Crash Course',
      description: 'Practical help for drawings, projections, and lab record prep.',
      category: 'Tutoring',
      price: 700,
      imageUrl: unsplashImages.tutoring,
      availability: 'Tuesday and Thursday 6 PM',
      isActive: true,
      status: 'approved',
    },
    {
      sellerId: sellers[2]._id,
      title: 'Content Editing for Clubs',
      description: 'Polish event descriptions, proposal decks, and social copy for student clubs.',
      category: 'Content Writing',
      price: 550,
      imageUrl: unsplashImages.writing,
      availability: 'Flexible with prior notice',
      isActive: true,
      status: 'approved',
    },
  ]);
}

function timeline(statuses) {
  return statuses.map((entry) => ({
    status: entry.status,
    timestamp: new Date(entry.timestamp),
  }));
}

async function createOrders(buyers, sellers, products) {
  const [rahul, megha, pooja, kabir, anvi] = buyers;

  return Order.insertMany([
    {
      buyerId: rahul._id,
      sellerId: sellers[0]._id,
      items: [
        {
          productId: products[0]._id,
          title: products[0].title,
          category: products[0].category,
          imageUrl: products[0].imageUrl,
          quantity: 1,
          price: products[0].price,
        },
      ],
      totalAmount: 220,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210001',
      orderStatus: 'placed',
      statusTimeline: timeline([{ status: 'placed', timestamp: '2026-03-28T09:00:00.000Z' }]),
      deliveryAddress: 'Hostel A, Room 204',
      createdAt: new Date('2026-03-28T09:00:00.000Z'),
      updatedAt: new Date('2026-03-28T09:00:00.000Z'),
    },
    {
      buyerId: megha._id,
      sellerId: sellers[0]._id,
      items: [
        {
          productId: products[1]._id,
          title: products[1].title,
          category: products[1].category,
          imageUrl: products[1].imageUrl,
          quantity: 1,
          price: products[1].price,
        },
      ],
      totalAmount: 650,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210002',
      orderStatus: 'confirmed',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-20T10:00:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-20T12:00:00.000Z' },
      ]),
      deliveryAddress: 'Girls Hostel, Room 118',
      createdAt: new Date('2026-03-20T10:00:00.000Z'),
      updatedAt: new Date('2026-03-20T12:00:00.000Z'),
    },
    {
      buyerId: pooja._id,
      sellerId: sellers[1]._id,
      items: [
        {
          productId: products[4]._id,
          title: products[4].title,
          category: products[4].category,
          imageUrl: products[4].imageUrl,
          quantity: 1,
          price: products[4].price,
        },
      ],
      totalAmount: 1100,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210003',
      orderStatus: 'shipped',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-15T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-15T11:30:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-16T14:00:00.000Z' },
      ]),
      deliveryAddress: 'Block C, Room 16',
      createdAt: new Date('2026-03-15T08:30:00.000Z'),
      updatedAt: new Date('2026-03-16T14:00:00.000Z'),
    },
    {
      buyerId: kabir._id,
      sellerId: sellers[2]._id,
      items: [
        {
          productId: products[6]._id,
          title: products[6].title,
          category: products[6].category,
          imageUrl: products[6].imageUrl,
          quantity: 2,
          price: products[6].price,
        },
      ],
      totalAmount: 700,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210004',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-10T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-10T11:30:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-11T14:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-12T16:45:00.000Z' },
      ]),
      deliveryAddress: 'Hostel D, Room 44',
      createdAt: new Date('2026-03-10T08:30:00.000Z'),
      updatedAt: new Date('2026-03-12T16:45:00.000Z'),
    },
    {
      buyerId: anvi._id,
      sellerId: sellers[2]._id,
      items: [
        {
          productId: products[7]._id,
          title: products[7].title,
          category: products[7].category,
          imageUrl: products[7].imageUrl,
          quantity: 1,
          price: products[7].price,
        },
      ],
      totalAmount: 980,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210005',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-05T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-05T10:00:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-06T09:45:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-07T13:30:00.000Z' },
      ]),
      deliveryAddress: 'Girls Hostel, Room 31',
      createdAt: new Date('2026-03-05T08:30:00.000Z'),
      updatedAt: new Date('2026-03-07T13:30:00.000Z'),
    },
    {
      buyerId: rahul._id,
      sellerId: sellers[1]._id,
      items: [
        {
          productId: products[5]._id,
          title: products[5].title,
          category: products[5].category,
          imageUrl: products[5].imageUrl,
          quantity: 2,
          price: products[5].price,
        },
      ],
      totalAmount: 960,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210006',
      orderStatus: 'cancelled',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-21T08:30:00.000Z' },
        { status: 'cancelled', timestamp: '2026-03-21T09:30:00.000Z' },
      ]),
      deliveryAddress: 'Hostel A, Room 204',
      createdAt: new Date('2026-03-21T08:30:00.000Z'),
      updatedAt: new Date('2026-03-21T09:30:00.000Z'),
    },
    {
      buyerId: pooja._id,
      sellerId: sellers[0]._id,
      items: [
        {
          productId: products[2]._id,
          title: products[2].title,
          category: products[2].category,
          imageUrl: products[2].imageUrl,
          quantity: 1,
          price: products[2].price,
        },
      ],
      totalAmount: 900,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210007',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-02-25T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-02-25T11:30:00.000Z' },
        { status: 'shipped', timestamp: '2026-02-26T09:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-02-27T13:15:00.000Z' },
      ]),
      deliveryAddress: 'Block C, Room 16',
      createdAt: new Date('2026-02-25T08:30:00.000Z'),
      updatedAt: new Date('2026-02-27T13:15:00.000Z'),
    },
    {
      buyerId: kabir._id,
      sellerId: sellers[1]._id,
      items: [
        {
          productId: products[3]._id,
          title: products[3].title,
          category: products[3].category,
          imageUrl: products[3].imageUrl,
          quantity: 1,
          price: products[3].price,
        },
      ],
      totalAmount: 1200,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210008',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-02-18T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-02-18T10:15:00.000Z' },
        { status: 'shipped', timestamp: '2026-02-19T11:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-02-20T15:00:00.000Z' },
      ]),
      deliveryAddress: 'Hostel D, Room 44',
      createdAt: new Date('2026-02-18T08:30:00.000Z'),
      updatedAt: new Date('2026-02-20T15:00:00.000Z'),
    },
    {
      buyerId: anvi._id,
      sellerId: sellers[0]._id,
      items: [
        {
          productId: products[0]._id,
          title: products[0].title,
          category: products[0].category,
          imageUrl: products[0].imageUrl,
          quantity: 1,
          price: products[0].price,
        },
      ],
      totalAmount: 220,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210009',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-01-22T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-01-22T09:30:00.000Z' },
        { status: 'shipped', timestamp: '2026-01-23T10:00:00.000Z' },
        { status: 'delivered', timestamp: '2026-01-24T14:00:00.000Z' },
      ]),
      deliveryAddress: 'Girls Hostel, Room 31',
      createdAt: new Date('2026-01-22T08:30:00.000Z'),
      updatedAt: new Date('2026-01-24T14:00:00.000Z'),
    },
    {
      buyerId: megha._id,
      sellerId: sellers[2]._id,
      items: [
        {
          productId: products[6]._id,
          title: products[6].title,
          category: products[6].category,
          imageUrl: products[6].imageUrl,
          quantity: 1,
          price: products[6].price,
        },
      ],
      totalAmount: 350,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712210010',
      orderStatus: 'delivered',
      statusTimeline: timeline([
        { status: 'placed', timestamp: '2026-03-01T08:30:00.000Z' },
        { status: 'confirmed', timestamp: '2026-03-01T10:00:00.000Z' },
        { status: 'shipped', timestamp: '2026-03-02T09:45:00.000Z' },
        { status: 'delivered', timestamp: '2026-03-03T13:30:00.000Z' },
      ]),
      deliveryAddress: 'Girls Hostel, Room 118',
      createdAt: new Date('2026-03-01T08:30:00.000Z'),
      updatedAt: new Date('2026-03-03T13:30:00.000Z'),
    },
  ]);
}

async function createBookings(buyers, sellers, services) {
  return Booking.insertMany([
    {
      buyerId: buyers[0]._id,
      sellerId: sellers[2]._id,
      serviceId: services[0]._id,
      serviceTitle: services[0].title,
      scheduledDate: new Date('2026-04-08T12:00:00.000Z'),
      duration: '2 hours',
      totalAmount: services[0].price,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712211001',
      bookingStatus: 'pending',
    },
    {
      buyerId: buyers[1]._id,
      sellerId: sellers[1]._id,
      serviceId: services[2]._id,
      serviceTitle: services[2].title,
      scheduledDate: new Date('2026-04-06T15:00:00.000Z'),
      duration: '90 minutes',
      totalAmount: services[2].price,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712211002',
      bookingStatus: 'confirmed',
    },
    {
      buyerId: buyers[2]._id,
      sellerId: sellers[1]._id,
      serviceId: services[1]._id,
      serviceTitle: services[1].title,
      scheduledDate: new Date('2026-03-25T11:00:00.000Z'),
      duration: '3 hours',
      totalAmount: services[1].price,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712211003',
      bookingStatus: 'completed',
    },
    {
      buyerId: buyers[3]._id,
      sellerId: sellers[2]._id,
      serviceId: services[3]._id,
      serviceTitle: services[3].title,
      scheduledDate: new Date('2026-03-20T11:00:00.000Z'),
      duration: '1 hour',
      totalAmount: services[3].price,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712211004',
      bookingStatus: 'completed',
    },
    {
      buyerId: buyers[4]._id,
      sellerId: sellers[0]._id,
      serviceId: services[4]._id,
      serviceTitle: services[4].title,
      scheduledDate: new Date('2026-03-29T17:00:00.000Z'),
      duration: '2 hours',
      totalAmount: services[4].price,
      paymentStatus: 'paid',
      transactionId: 'TXN_1712211005',
      bookingStatus: 'cancelled',
    },
  ]);
}

async function createReviews(buyers, sellers, products, services) {
  const reviews = await Review.insertMany([
    {
      reviewerId: buyers[3]._id,
      targetId: products[6]._id,
      targetType: 'product',
      rating: 5,
      comment: 'Very useful for semester prep and exactly as described.',
    },
    {
      reviewerId: buyers[4]._id,
      targetId: products[7]._id,
      targetType: 'product',
      rating: 4,
      comment: 'Worked well in lab and condition was almost new.',
    },
    {
      reviewerId: buyers[2]._id,
      targetId: products[2]._id,
      targetType: 'product',
      rating: 5,
      comment: 'Hoodie quality was amazing and delivery was quick.',
    },
    {
      reviewerId: buyers[2]._id,
      targetId: services[1]._id,
      targetType: 'service',
      rating: 5,
      comment: 'Resume and poster designs were polished and delivered on time.',
    },
    {
      reviewerId: buyers[3]._id,
      targetId: services[3]._id,
      targetType: 'service',
      rating: 4,
      comment: 'Helpful edits with clear feedback on how to improve the draft.',
    },
    {
      reviewerId: buyers[3]._id,
      targetId: sellers[2]._id,
      targetType: 'seller',
      rating: 5,
      comment: 'Riya was responsive and easy to coordinate with.',
    },
    {
      reviewerId: buyers[2]._id,
      targetId: sellers[1]._id,
      targetType: 'seller',
      rating: 4,
      comment: 'Good communication and quick turnaround overall.',
    },
  ]);

  await Promise.all([
    refreshProductRating(products[2]._id),
    refreshProductRating(products[6]._id),
    refreshProductRating(products[7]._id),
    refreshServiceRating(services[1]._id),
    refreshServiceRating(services[3]._id),
  ]);

  return reviews;
}

async function createSupportTickets(buyers, sellers) {
  return SupportTicket.insertMany([
    {
      raisedBy: buyers[0]._id,
      subject: 'Order delivery timing',
      description: 'Need clarification on when order TXN_1712210001 will be confirmed.',
      status: 'open',
    },
    {
      raisedBy: buyers[1]._id,
      subject: 'Cancelled booking refund',
      description: 'Wanted to confirm if the cancelled tutoring booking will reflect in history.',
      status: 'in-progress',
    },
    {
      raisedBy: sellers[0]._id,
      subject: 'Seller payout visibility',
      description: 'Need a clearer revenue breakdown for this month.',
      status: 'resolved',
      adminNote: 'Revenue chart and order detail links were shared with seller.',
    },
    {
      raisedBy: sellers[1]._id,
      subject: 'Listing approval time',
      description: 'How long does service moderation usually take after edits?',
      status: 'open',
    },
    {
      raisedBy: buyers[3]._id,
      subject: 'Review visibility',
      description: 'My recent review is not visible yet on the seller page.',
      status: 'closed',
      adminNote: 'Issue resolved after cache refresh.',
    },
  ]);
}

async function seed() {
  await connectDatabase();
  await resetDatabase();

  const { admin, buyers, sellers } = await createUsers();
  await createCarts([admin, ...buyers, ...sellers]);
  await createSellerProfiles(sellers);
  const products = await createProducts(sellers);
  const services = await createServices(sellers);
  await createOrders(buyers, sellers, products);
  await createBookings(buyers, sellers, services);
  await createReviews(buyers, sellers, products, services);
  await createSupportTickets(buyers, sellers);

  if (env.enableBackendLogs) {
    console.log('CampusConnect seed complete.');
    console.log('Admin login: admin@campusconnect.com / Admin@123');
    console.log('Buyer login: rahul@campusconnect.com / Buyer@123');
    console.log('Seller login: priya@campusconnect.com / Seller@123');
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
