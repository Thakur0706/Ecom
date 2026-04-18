# CampusConnect - Technical Architecture & API Reference

---

## 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Pages:                                                         │
│  ├── Auth: Login, Register, AdminLogin                         │
│  ├── Buyer: Home, Products, Cart, Checkout, Orders, Reviews    │
│  ├── Supplier: Dashboard, ListProduct, ListService, Sales        │
│  ├── Booking: Services, Bookings, BookingChat                  │
│  ├── Admin: AdminPanel, ERP, CRM, Reports, Analytics           │
│                                                                 │
│  State: React Context (AppContext, ERPCRMContext, OrderContext)│
│  Data Fetching: TanStack React Query (Caching, Refetch)        │
│  Payments: Razorpay Integration (Frontend Checkout)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                      Axios HTTP Client
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express + Node.js)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Authentication Middleware:                                    │
│  ├── JWT Verification (24-hour tokens)                        │
│  ├── Role-based Access (admin, supplier, buyer)                 │
│  └── Error & 404 Handlers                                     │
│                                                                 │
│  API Routes (70+ endpoints):                                   │
│  ├── /api/auth/* (4)       - User authentication              │
│  ├── /api/products/* (10+) - Product CRUD & search            │
│  ├── /api/services/* (8+)  - Service CRUD & booking           │
│  ├── /api/cart/* (5)       - Shopping cart management         │
│  ├── /api/orders/* (6)     - Order lifecycle                  │
│  ├── /api/bookings/* (6+)  - Service booking management       │
│  ├── /api/reviews/* (3+)   - Reviews & ratings                │
│  ├── /api/admin/* (15+)    - Admin operations                 │
│  ├── /api/supplier/* (10+)   - Supplier dashboard & analytics     │
│  ├── /api/coupons/* (3)    - Coupon validation                │
│  └── /api/support/* (4+)   - Support tickets                  │
│                                                                 │
│  Controllers (Layer):                                           │
│  ├── authController -> User registration, login                │
│  ├── orderController -> Order creation, status update          │
│  ├── bookingController -> Service booking lifecycle            │
│  ├── productController -> Product management                   │
│  ├── adminController -> Admin operations & analytics           │
│  ├── supplierController -> Supplier dashboard & reports            │
│  └── [more...]                                                 │
│                                                                 │
│  Services (Business Logic):                                     │
│  ├── razorpayService -> Payment processing & verification      │
│  ├── emailService -> Email notifications                       │
│  ├── ratingService -> Average rating calculations              │
│  └── utilities (pagination, coupon, csv, ledger, analytics)    │
│                                                                 │
│  Middleware:                                                    │
│  ├── auth.js -> JWT verification                              │
│  ├── validate.js -> Zod schema validation                      │
│  └── error.js -> Global error handling                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                      Mongoose (ODM)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Collections:                                                   │
│  ├── users (buyers, suppliers, admins)                          │
│  ├── products (with stock tracking)                            │
│  ├── services (service listings)                               │
│  ├── carts (shopping carts)                                    │
│  ├── orders (product transactions)                             │
│  ├── bookings (service transactions)                           │
│  ├── reviews (product/service reviews)                         │
│  ├── sales (analytics records)                                 │
│  ├── suppliercommissions (platform fees)                         │
│  ├── supplierpayments (supplier reimbursements)                    │
│  ├── supplierprofiles (supplier applications)                      │
│  ├── bookingmessages (booking chat)                            │
│  ├── supporttickets (support requests)                         │
│  ├── paymentsessions (payment tracking)                        │
│  └── [more...]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA RELATIONSHIPS

```
USER
├── role: 'buyer' | 'supplier' | 'admin'
├── supplierProfile: (if supplier)
│   ├── status: 'pending' | 'approved' | 'rejected'
│   └── documents: gov_id, student_id
├── products: (many)
│   ├── price, stock, description
│   └── reviews: (many)
├── services: (many)
│   └── bookings: (many)
├── orders: (as buyer/supplier)
│   └── items: (many OrderItems)
├── bookings: (as buyer/supplier)
│   └── messages: (many BookingMessages)
├── cart: (one only)
│   └── items: (many CartItems)
├── commissions: (as supplier)
└── payments: (reimbursements)
```

### Key Relationships:

```
Product → Reviews (many)
Product → Orders (via OrderItems, many)
Service → Bookings (many)
Order → Sales (one, for analytics)
Order → SupplierCommission (one, for platform fee)
Booking → Sales (one, for analytics)
Booking → SupplierCommission (one, for platform fee)
Booking → BookingMessages (many)
```

---

## 🔑 API ENDPOINT REFERENCE

### Authentication (4 endpoints)

```
POST   /api/auth/register         - New user registration
POST   /api/auth/login            - User login (returns JWT)
GET    /api/auth/me               - Get current user info
POST   /api/auth/logout           - Logout (client-side)
```

### Products (10+ endpoints)

```
GET    /api/products/             - List products (paginated)
GET    /api/products/search       - Search products
GET    /api/products/:id          - Get product details
POST   /api/products/             - Create product (supplier)
PATCH  /api/products/:id          - Update product (supplier)
DELETE /api/products/:id          - Delete product (supplier)
GET    /api/products/category/:name - Filter by category
GET    /api/products/price-range  - Filter by price
GET    /api/products/condition/:type - Filter by condition
```

### Shopping Cart (5 endpoints)

```
GET    /api/cart/                 - Get user's cart
POST   /api/cart/                 - Add item to cart
PATCH  /api/cart/:itemId          - Update item quantity
DELETE /api/cart/:itemId          - Remove item
DELETE /api/cart/                 - Clear cart
```

### Orders (6 endpoints)

```
POST   /api/orders/               - Create order (checkout)
GET    /api/orders/my-purchases   - Buyer's orders (paginated)
GET    /api/orders/my-sales     - Supplier's sales (paginated)
GET    /api/orders/:id            - Order details
PATCH  /api/orders/:id/status   - Update status (supplier)
PATCH  /api/orders/:id/cancel     - Cancel order
```

### Service Bookings (6+ endpoints)

```
POST   /api/bookings/             - Create booking
GET    /api/bookings/             - Get user's bookings
GET    /api/bookings/:id          - Booking details
PATCH  /api/bookings/:id/status - Update status (supplier confirms)
POST   /api/bookings/:id/payment  - Make payment (after confirmation)
GET    /api/bookings/:id/messages - Get chat messages
POST   /api/bookings/:id/messages - Send message
```

### Reviews (3+ endpoints)

```
POST   /api/reviews/              - Leave review (after delivery)
GET    /api/reviews/:productId    - Get product reviews
DELETE /api/reviews/:id           - Delete own review
```

### Coupons (3 endpoints)

```
POST   /api/coupons/validate      - Validate coupon code
GET    /api/coupons/              - List available coupons
POST   /api/coupons/              - Create coupon (supplier/admin)
```

### Admin Operations (15+ endpoints)

```
GET    /api/admin/overview        - Dashboard overview
GET    /api/admin/suppliers       - Get pending suppliers
POST   /api/admin/suppliers/:id/approve - Approve supplier
POST   /api/admin/suppliers/:id/reject  - Reject supplier
GET    /api/admin/products        - Moderation queue
POST   /api/admin/products/:id/approve - Approve product
POST   /api/admin/products/:id/remove  - Remove product
GET    /api/admin/services        - Service moderation
POST   /api/admin/services/:id/approve
POST   /api/admin/services/:id/remove
GET    /api/admin/orders          - View all orders
GET    /api/admin/commissions     - Commission tracking
POST   /api/admin/commissions/:id/pay - Mark commission paid
GET    /api/admin/analytics       - Sales analytics
GET    /api/admin/payments        - Payment history
POST   /api/admin/payments            - Create supplier payment
```

### Supplier Operations (10+ endpoints)

```
GET    /api/supplier/overview       - Dashboard data
GET    /api/supplier/inventory      - Products & services
GET    /api/supplier/revenue-chart  - Revenue trends
GET    /api/supplier/orders         - Order metrics
GET    /api/supplier/customers      - Customer list
GET    /api/supplier/reports        - Generate CSV reports
POST   /api/supplier/apply          - Apply for supplier
GET    /api/supplier/status         - Check supplier status
```

---

## 💳 PAYMENT FLOW (Razorpay)

### Frontend (Cart.jsx)

```javascript
1. User fills delivery address
2. User selects payment method
3. If Razorpay:
   - Initialize Razorpay with amount, currency
   - Razorpay modal opens
   - User enters card/UPI details
   - On success: Get paymentId, orderId, signature
   - Send to backend for verification
4. If COD:
   - Create order with status 'pending'
   - Order created successfully
```

### Backend (orderController.js)

```javascript
1. Receive payment details (paymentId, signature, orderId)
2. Call razorpayService.verifyRazorpaySignature()
3. If invalid signature: Return 400 error
4. Fetch payment from Razorpay API
5. Verify amount matches order total
6. Update Order.paymentStatus = 'paid'
7. Create Sales record
8. Create SellerCommission record
9. Return success response
```

### Razorpay Service

```javascript
createRazorpayOrder({amount, currency, receipt, notes})
  └─> Calls Razorpay API
  └─> Returns orderId

fetchRazorpayPayment(paymentId)
  └─> Calls Razorpay API
  └─> Returns payment details

verifyRazorpaySignature({orderId, paymentId, signature})
  └─> HMAC-SHA256 verification
  └─> Returns true/false
```

### Configuration

```
RAZORPAY_KEY_ID = rzp_test_Sa965bQRqHqwub
RAZORPAY_KEY_SECRET = fBjVaWys8Cb0jKwZs8k4mvAO
```

---

## 💰 COMMISSION & REVENUE CALCULATION

### Order Commission Creation

```
Event: Order status changes to 'delivered'

Calculation:
├── orderAmount = order.totalAmount
├── platformFeePercentage = 10% (configurable)
├── platformFee = orderAmount × platformFeePercentage
├── supplierPayableAmount = orderAmount - platformFee
│
└─> Create SupplierCommission:
    {
      supplierId: order.supplierId,
      orderId: order._id,
      type: 'order',
      orderAmount: orderAmount,
      platformFee: platformFee,
      supplierPayableAmount: supplierPayableAmount,
      paymentStatus: 'pending',
      createdAt: now
    }

└─> Create Sales record:
    {
      supplierId: order.supplierId,
      orderId: order._id,
      type: 'product',
      amount: orderAmount,
      platformFee: platformFee,
      supplierEarns: supplierPayableAmount,
      completedAt: now
    }
```

### Admin Payment Workflow

```
Pending Commission
    ↓
Admin views commission in dashboard
    ↓
Admin clicks "Mark as Paid"
    ↓
Update SupplierCommission:
  ├── paymentStatus = 'paid'
  ├── paidAt = now
  └── paymentReference = generated ID
    ↓
Create SupplierPayment record:
  ├── supplierId: commission.supplierId
  ├── amount: commission.supplierPayableAmount
  ├── status: 'completed'
  ├── paymentReference: derived from commission
  └── paidAt: now
    ↓
Supplier sees payment in their records
```

### Supplier Revenue Dashboard

```
GET /api/supplier/overview returns:
├── totalRevenue = SUM(order.totalAmount) where orderStatus='delivered'
├── totalOrdersReceived = COUNT(orders) where supplierId=user._id
├── activeListings = COUNT(products with isActive=true)
├── averageRating = AVG(all reviews for supplier)
└── recentOrders = last 5 orders
```

---

## 🔐 AUTHENTICATION FLOW

### Registration

```
POST /api/auth/register
{
  name: string,
  email: string,
  password: string,        // bcryptjs hashed
  phone: string,
  desiredRole: 'buyer' | 'supplier',
  supplierApplication?: {    // if desiredRole = 'supplier'
    studentId: string,
    collegeName: string,
    department: string,
    contactNumber: string,
    govIdUrl: string,
    studentIdUrl: string,
    upiId: string
  }
}

Response:
{
  message: "Registration successful",
  user: {_id, name, email, role, createdAt}
}
```

### Login

```
POST /api/auth/login
{
  email: string,
  password: string
}

Response:
{
  message: "Login successful",
  token: "jwt_token",     // 24-hour expiry
  user: {_id, name, email, role}
}

Frontend stores token in localStorage
```

### Verification

```
All protected endpoints require:
Headers: Authorization: Bearer {token}

Middleware (auth.js):
1. Extract token from header
2. Verify JWT signature
3. Decode to get user._id, role
4. Attach user to req.user
5. If invalid/expired: return 401
```

---

## 📈 ANALYTICS DATA STRUCTURE

### Sales Model (for analytics)

```javascript
{
  sellerId: ObjectId,
  orderId/bookingId: ObjectId,
  type: 'product' | 'service',     // differentiates source
  productId/serviceId: ObjectId,
  title: String,
  amount: Number,                   // total transaction amount
  platformFee: Number,              // platform's cut
  sellerEarns: Number,              // seller's earnings
  completedAt: Date,                // when transaction completed

  Indexed by:
    - sellerId (for seller analytics)
    - completedAt (for time-series)
    - type (for product vs service breakdown)
}
```

### Admin Analytics Queries

```
GET /api/admin/analytics returns:
{
  salesByType: [
    {type: 'product', totalSales: 50000, totalFees: 5000, count: 25},
    {type: 'service', totalSales: 30000, totalFees: 3000, count: 15}
  ],

  commission: {
    total: 8000,     // total platform fees
    paid: 5000,      // already reimbursed
    pending: 3000    // still pending payout
  },

  topSellers: [
    {sellerId, sellerName, sellerEmail, totalEarnings, totalSales},
    ...
  ],

  sellerPayments: {
    total: 5000,
    count: 10
  }
}
```

---

## ✅ VALIDATION SCHEMAS (Zod)

### Product Creation Schema

```javascript
{
  title: string (required, min 3 chars),
  description: string (required),
  category: string (required),
  price: number (min 0),
  stock: number (min 0),
  condition: enum(['new', 'like-new', 'good', 'fair']),
  imageUrl: string (optional, URL format)
}
```

### Coupon Application Schema

```javascript
{
  code: string (optional),
  type: enum(['flat', 'percent']),
  value: number (min 0),
  minOrderAmount: number (min 0),
  description: string (optional)
}
```

### Order Creation Schema

```javascript
{
  deliveryAddress: string (required),
  paymentMethod: 'razorpay' | 'cod' | 'card',
  paymentProvider: 'razorpay' | 'manual' | 'cod',
  paymentStatus: 'pending' | 'paid' | 'failed',
  couponCode: string (optional)
}
```

---

## 🚨 ERROR HANDLING

### Global Error Handler (middleware/error.js)

```javascript
Catches all errors and returns:
{
  success: false,
  message: "Error message",
  statusCode: 400|404|500|etc
}
```

### Custom Error Class (AppError)

```javascript
throw new AppError("Message", statusCode)

Examples:
- 400: Validation errors
- 401: Unauthorized (invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 409: Conflict (duplicate email, etc)
- 500: Server error
```

---

## 📝 RESPONSE FORMAT (Standard)

### Success Response

```javascript
{
  success: true,
  message: "Operation successful",
  data: { /* actual data */ }
}
```

### Error Response

```javascript
{
  success: false,
  message: "Error description",
  statusCode: 400
}
```

---

## 🎯 KEY BUSINESS LOGIC

### Multi-Seller Order Grouping

```javascript
When user with items from seller A & B creates order:
1. Group items by sellerId
2. Create Order #1 for Seller A items
3. Create Order #2 for Seller B items
4. Each gets unique transactionId: TXN_timestamp_1, TXN_timestamp_2
5. Buyer sees both orders in dashboard
6. Each seller sees only their order in sales
```

### Booking Confirmation Requirement

```javascript
User wants to book & pay:
1. Create Booking with status='pending'
2. Seller sees in dashboard
3. Seller must click "Confirm"
4. Booking status changes to 'confirmed'
5. Only NOW can buyer make payment
6. Payment handler checks: if bookingStatus !== 'confirmed': reject
7. After payment: chat becomes available
```

### Stock Management

```javascript
Add to Cart: Check stock available
Create Order: Decrement stock
Cancel Order: Increment stock (restock)
Update Product: Current stock visible to all buyers
Out of stock: Product not purchasable
```

---

**End of Technical Reference**
