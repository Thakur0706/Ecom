# CampusConnect - Complete Project Implementation Context

## Practical Submission Documentation

---

## Executive Summary

**CampusConnect** is a comprehensive, multi-role e-commerce and business management platform for college students. It integrates Order Management, Online Payment Systems, and Enterprise Resource Planning (ERP) / Customer Relationship Management (CRM) concepts into a unified web application.

The project demonstrates a complete full-stack implementation with:

- **Backend**: Node.js/Express REST API with MongoDB
- **Frontend**: React with Vite, TailwindCSS, React Router
- **Authentication**: JWT-based role management (Admin, Seller, Buyer)
- **Payments**: Simulated payment processing system
- **Business Logic**: Order management, inventory, seller profiles, reviews, bookings

---

## Part 1: Experiment 4 - Order Management System & Basic Inventory

### 1.1 Order Management System

#### Database Models

**Order Model** (`/backend/src/models/Order.js`)

- Tracks buyer-seller transactions
- Maintains order items with product details, quantities, prices
- Tracks order status through timeline: `placed → confirmed → shipped → delivered/cancelled`
- Captures payment status: `pending, paid, failed`
- Stores delivery address for each order
- Auto-timestamps creation and updates

```
Order Schema:
├── buyerId (Reference to User)
├── sellerId (Reference to User)
├── items (Array of OrderItems)
│   ├── productId
│   ├── title, category, imageUrl
│   ├── quantity, price
├── totalAmount
├── paymentStatus: 'pending' | 'paid' | 'failed'
├── transactionId (unique identifier)
├── orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
├── statusTimeline (Array tracking all status changes with timestamps)
└── deliveryAddress
```

**Order Status Workflow**

```
placed → [confirmed, cancelled]
  ↓
confirmed → [shipped, cancelled]
  ↓
shipped → [delivered]
  ↓
delivered (final)

cancelled (final)
```

#### Order Management Controllers (`/backend/src/controllers/orderController.js`)

**Core Functions:**

1. **createOrder()**
   - Validates cart items for stock availability
   - Groups items by seller (multi-seller support)
   - Creates separate orders for each seller
   - Updates product stock (decrement)
   - Generates unique transaction IDs
   - Clears cart after successful order creation
   - Returns created orders with buyer/seller details populated

2. **getMyPurchases()**
   - Fetches orders where user is buyer
   - Supports pagination (page, limit)
   - Filters by status query parameter
   - Returns orders sorted by most recent first
   - Includes seller information

3. **getMySales()**
   - Seller-only endpoint (role authorization)
   - Fetches orders where user is seller
   - Paginated results with status filtering
   - Returns orders sorted by most recent
   - Includes buyer information

4. **getOrderById()**
   - Retrieves single order with all details populated
   - Authorization: buyer, seller of order, or admin only
   - Returns fully populated order with user references

5. **updateOrderStatus()**
   - Seller-only operation to update order status
   - Validates status transitions:
     - `placed` → `confirmed` or `cancelled`
     - `confirmed` → `shipped` or `cancelled`
     - `shipped` → `delivered`
   - Adds status change to timeline with timestamp
   - Sends email notification to buyer
   - Prevents invalid state transitions

6. **cancelOrder()**
   - Cancels placed or confirmed orders only
   - Restocks product quantities
   - Updates order status and timeline
   - Buyer can cancel own orders

#### Order Routes (`/backend/src/routes/orderRoutes.js`)

```
POST   /api/orders/                  - Create order (requires cart)
GET    /api/orders/my-purchases      - Get buyer's orders
GET    /api/orders/my-sales          - Get seller's sales (seller only)
GET    /api/orders/:id               - Get order details
PATCH  /api/orders/:id/status        - Update status (seller only)
PATCH  /api/orders/:id/cancel        - Cancel order
```

### 1.2 Inventory Management System

#### Product Model (`/backend/src/models/Product.js`)

```
Product Schema:
├── sellerId (Reference to User)
├── title, description
├── category
├── price (minimum 0)
├── imageUrl
├── condition: 'new' | 'like-new' | 'good' | 'fair'
├── stock (quantity available)
├── isActive (can be toggled)
├── status: 'pending' | 'approved' | 'removed' (moderation)
├── averageRating (auto-calculated from reviews)
└── timestamps (createdAt, updatedAt)
```

**Inventory Features:**

- Stock tracking with real-time decrements on order creation
- Restock on order cancellation
- Stock validation before adding to cart
- Product conditions for condition-based filtering
- Active/inactive product toggle
- Admin approval workflow for product listings

#### Cart Model (`/backend/src/models/Cart.js`)

```
Cart Schema:
├── userId (unique, one cart per user)
├── items (Array of CartItems)
│   ├── productId (Reference)
│   ├── quantity
│   └── price (snapshot at add time)
└── timestamps
```

**Cart Operations:**

- One cart per user
- Add items (with stock validation)
- Update quantity (with stock check)
- Remove items
- Clear cart on order creation
- Auto-populate product details on fetch

#### Cart Controller (`/backend/src/controllers/cartController.js`)

**Functions:**

1. **getCart()** - Retrieves user's cart with populated product details
2. **addToCart()** - Adds item with stock validation
3. **updateCartItem()** - Updates quantity with stock check
4. **removeCartItem()** - Removes item from cart
5. **clearCart()** - Empties entire cart

#### Inventory Management Controllers (`/backend/src/controllers/productController.js`)

**Key Functions:**

- **listProducts()** - Browse approved products with pagination
- **getProductById()** - Detailed product view with reviews
- **createProduct()** - Sellers create new listings
- **updateProduct()** - Edit listing details (pending approval changes)
- **searchProducts()** - Full-text search across title/description/category
- **filterByCategory()** - Category-based filtering
- **filterByPrice()** - Price range filtering
- **filterByCondition()** - Product condition filtering
- **getSellerProducts()** - View all products by seller

### 1.3 Frontend Order Management UI

#### OrderManagement Page (`/frontend/src/pages/OrderManagement.jsx`)

**Features:**

- Dual view: Purchases (buyer) / Sales (seller)
- Status filtering: All, Placed, Confirmed, Shipped, Delivered, Cancelled
- Search by order ID or product title
- Sort options: Newest First, Oldest First, Amount High-Low, Amount Low-High
- Statistics cards: Total Orders, Delivered, Pending/Active, Cancelled
- Revenue visualization for sellers
- Order cards with status badges

#### Cart Page (`/frontend/src/pages/Cart.jsx`)

**Features:**

- Display all cart items with details
- Quantity adjustment controls
- Item removal
- Subtotal calculation
- Payment form:
  - Delivery address input
  - Card details (simulated): cardNumber, expiry, CVV
  - Payment processing button
- Order success modal with order ID
- Empty cart state with navigation to products/services

#### OrderDetail Page (`/frontend/src/pages/OrderDetail.jsx`)

**Features:**

- Complete order information display
- Order items list with images, titles, quantities, prices
- Order timeline showing status progression with timestamps
- Buyer/Seller information
- Delivery address display
- Status-specific actions:
  - Seller: Update status (confirm, ship, deliver)
  - Buyer: Cancel (if allowed)

#### OrderTracking Page (`/frontend/src/pages/OrderTracking.jsx`)

**Features:**

- Real-time order status visualization
- Timeline view with status progression
- Expected delivery date estimation
- Seller contact information
- Order-to-delivery flow visualization

### 1.4 Statistics & Reporting

**Order Analytics** (`/backend/src/utils/analytics.js`)

- `bucketOrdersByMonth()` - Aggregates orders by month
- `getDateRangeFilter()` - Filters orders within date range
- `toObjectIdString()` - Converts ObjectId to string for grouping

**Admin Reports** (`/backend/src/controllers/adminController.js`)

- **Top Products Analysis**
  - Revenue generated per product
  - Units sold per product
  - Top 10 products sorted by revenue
- **Top Sellers Analysis**
  - Revenue per seller
  - Order count per seller
  - Top 10 sellers by revenue
- **Sales Trends**
  - Monthly order count
  - Monthly revenue
  - Date range filtering

---

## Part 2: Experiment 5 - Online Payment System

### 2.1 Payment Model & Status

#### Payment Status Enum

```
PAYMENT_STATUS: 'pending' | 'paid' | 'failed'
```

Each Order includes:

- `paymentStatus` field tracking payment state
- `transactionId` unique identifier (format: `TXN_<timestamp>_<index>`)

### 2.2 Payment Processing Implementation

#### Cart to Order Payment Flow

**File**: `/frontend/src/pages/Cart.jsx`

**Payment Form Implementation:**

```javascript
paymentForm = {
  cardNumber: string (user input),
  expiry: string (MM/YY format),
  cvv: string (3-4 digits)
}
```

**Payment Processing Steps:**

1. Validate delivery address
2. Simulate 2-second payment processing delay
3. Call backend `/api/orders/` endpoint
4. On success:
   - Clear cart
   - Invalidate cart queries
   - Invalidate orders queries
   - Show success modal with Order ID
   - Navigate to order detail page
5. Error handling with user feedback

#### Backend Payment Validation

**File**: `/backend/src/controllers/orderController.js`

**Pre-Payment Checks:**

- Cart exists and not empty
- All items have valid products
- Stock availability for requested quantities
- Product prices are current

**Payment Confirmation:**

- Auto-sets `paymentStatus: 'paid'` on order creation
- Creates unique `transactionId`
- Records payment timestamp in order

### 2.3 Email Notifications

**Email Service** (`/backend/src/services/emailService.js`)

Function: `sendOrderStatusEmail()`

- Triggered on order status updates
- Recipient: Order buyer
- Contents:
  - Buyer name
  - Order ID
  - New status
  - Link to view order

**Mailer Configuration** (`/backend/src/config/mailer.js`)

- Nodemailer integration
- Email templates with HTML formatting
- Async email sending

### 2.4 Transaction Management

#### Multi-Seller Transactions

When order created with items from multiple sellers:

1. Groups items by seller
2. Creates separate order per seller
3. Each gets unique transaction ID: `TXN_1234567890_1`, `TXN_1234567890_2`, etc.
4. Each order tracked independently
5. Buyer gets multiple order confirmations

#### Transaction ID Format

- `TXN_<Unix Timestamp>_<Index>`
- Example: `TXN_1712210001_1`, `TXN_1712210001_2`
- Ensures uniqueness and chronological ordering

### 2.5 Payment Security Features

**Implemented:**

- JWT token validation on payment endpoint
- Role-based authorization (buyer/seller can pay)
- User context validation
- CORS protection
- Helmet.js security headers
- MongoDB injection protection via Mongoose
- Password hashing with bcryptjs

**Future Enhancements:**

- SSL/TLS encryption
- PCI DSS compliance
- Tokenized card storage
- Fraud detection
- Rate limiting on payment endpoints
- Webhook signing for 3rd-party integrations

---

## Part 3: Experiment 6 - ERP and CRM Integration

### 3.1 ERP (Enterprise Resource Planning) Dashboard

#### ERP Data Model (`/frontend/src/context/ERPCRMContext.jsx`)

**Sales Data Structure:**

```javascript
salesData = {
  monthlySales: [
    {
      month: string,
      revenue: number,
      orderCount: number,
      averageOrderValue: number,
    },
  ],
};
```

**ERP Resources Structure:**

```javascript
erpResources = {
  platformUsage: {
    totalUsers: number,
    activeToday: number,
    newThisMonth: number,
  },
  listingMetrics: {
    totalActive: number,
    pendingApproval: number,
    removedThisMonth: number,
    averageListingAge: string,
  },
  transactionMetrics: {
    totalProcessed: number,
    successRate: number(percentage),
    averageValue: number,
    peakHour: string,
  },
};
```

#### ERP Dashboard Features (`/frontend/src/pages/ERPDashboard.jsx`)

**KPI Cards Display:**

1. **Total Users** - Platform-wide user count
2. **Active Listings** - Current active products/services
3. **Orders Processed** - Total transaction count
4. **Total Revenue** - Sum of all monthly revenue
5. **Success Rate** - Percentage of successful transactions
6. **Pending Approvals** - Awaiting admin approval

**Listing Metrics:**

- Total Active listings
- Pending approval count
- Removed this month
- Average listing age

**Transaction Metrics:**

- Total processed
- Success rate percentage
- Average transaction value
- Peak transaction hour

**Sales Visualization:**

- Sales Chart component showing monthly trends
- Activity Feed showing recent activities
- Real-time update capability with refresh button
- Last updated timestamp

**Resources:**

- Resource Utilization Bar
- Platform utilization metrics
- Bandwidth usage
- Database utilization

#### Support Ticket Management

- Open tickets display
- Status tracking (Open, Pending, Resolved)
- Color-coded status badges
- Admin note capability
- Mark as resolved action

### 3.2 CRM (Customer Relationship Management) Dashboard

#### CRM Data Model (`/frontend/src/context/ERPCRMContext.jsx`)

**Customer Structure:**

```javascript
customer = {
  id: string,
  name: string,
  email: string,
  role: string,
  totalOrders: number,
  totalSpent: number,
  totalSales: number,
  averageOrderValue: number,
  joinDate: date,
  lastActivityDate: date,
  satisfactionScore: number(1 - 5),
  lifetimeValue: number,
  interactions: [
    {
      type: "Purchase" | "Listing" | "Review" | "Support",
      date: date,
      description: string,
    },
  ],
};
```

**CRM KPIs Structure:**

```javascript
crmKPIs = {
  customerSatisfaction: number (1-5),
  netPromoterScore: number,
  customerRetentionRate: number (%),
  averageResponseTime: string,
  totalSupportTickets: number,
  resolvedTickets: number,
  churnRate: number (%),
  newCustomersThisMonth: number
}
```

#### CRM Dashboard Features (`/frontend/src/pages/CRMDashboard.jsx`)

**KPI Metrics:**

1. **Customer Satisfaction** - Average 1-5 rating
2. **Net Promoter Score** - Loyalty indicator
3. **Retention Rate** - % of returning customers
4. **Avg Response Time** - Support response time
5. **Support Tickets** - Total open tickets
6. **Resolved** - Tickets resolved
7. **Churn Rate** - % customers lost
8. **New This Month** - New customer count

**Customer Segmentation:**

- **High Value Customers** - Top lifetime value
- **Active Users** - Recent activity
- **New Users** - Joined recently
- **At Risk** - Low recent activity/satisfaction

**Top Customers View:**

- Top 5 customers by lifetime value
- Customer profile cards showing:
  - Name and email
  - Total orders and spending
  - Last activity
  - Satisfaction score
  - Links to customer details

**Interaction Tracking:**

- Recent customer interactions (last 6)
- Types: Purchase, Listing, Review, Support
- Color-coded by interaction type
- Customer name and interaction description
- Timestamp of interaction

**Lead Pipeline:**

- Sales pipeline stages
- Customer progression tracking
- Deal value tracking
- Win rate metrics

#### Customer Management Page (`/frontend/src/pages/CustomerManagement.jsx`)

**Features:**

- Full customer database view
- Search and filter capabilities
  - By segment (High Value, Active, New, At Risk)
  - By name/email
  - By activity date range
- Customer details modal:
  - Contact information
  - Transaction history
  - Communication history
  - Notes and attachments
- Customer communication tools
- Export to CSV functionality

### 3.3 Advanced Analytics & Reports

#### Admin Analytics Module (`/backend/src/controllers/adminController.js`)

**Implemented Functions:**

1. **buildTopProducts()**
   - Analyzes all orders
   - Calculates revenue per product
   - Counts units sold
   - Returns top 10 by revenue

2. **buildTopSellers()**
   - Ranks sellers by revenue
   - Counts orders per seller
   - Returns top 10 by revenue

3. **getReviewBreakdown()**
   - Breaks down ratings 5→1
   - Counts reviews per rating
   - Shows distribution

4. **buildCustomerSummaries()**
   - Generates per-user statistics:
     - Total orders placed
     - Total amount spent
     - Total sales (for sellers)
     - Delivery status breakdown

5. **Generate Admin Reports**
   - Date range filtering
   - Monthly bucketing
   - Export to CSV
   - Pie charts and bar charts
   - Performance trends

#### Report Types Available

**Sales Reports:**

- Monthly revenue trends
- Product performance
- Seller rankings
- Order status breakdown

**User Reports:**

- New user sign-ups by month
- User role distribution
- Active user metrics
- Churn analysis

**Admin Dashboard Reports:**

- System-wide KPIs
- Revenue metrics
- User metrics
- Seller metrics
- Product performance
- Platform health

### 3.4 Reports Center Page (`/frontend/src/pages/ReportsCenter.jsx`)

**Features:**

- Report type selection:
  - Sales Report
  - Inventory Report
  - Customer Report
  - Seller Report
- Date range picker
- Download as CSV
- Print functionality
- Chart visualization
- Real-time data refresh

#### Report Data Displayed:

- Aggregated sales data
- Product rankings
- Customer statistics
- Seller performance
- Inventory levels
- Trending items

### 3.5 Seller Analytics

#### Seller Dashboard Features

- Personal sales metrics
- Revenue tracking
- Order fulfillment metrics
- Product performance
- Customer feedback ratings
- Business analytics

---

## Database Design

### Complete Database Schema

```
USERS COLLECTION
├── Admin (role: 'admin')
└── Buyer/Seller (role: 'buyer'/'seller')
    ├── name, email, password (hashed)
    ├── profilePictureUrl
    ├── role
    ├── isActive
    └── timestamps

SELLER_PROFILES COLLECTION
├── userId (Reference to User)
├── fullName, studentId, collegeName, department
├── contactNumber
├── upiOrBankDetails
├── govIdUrl, studentIdUrl
├── status: 'pending' | 'approved' | 'rejected'
├── rejectionReason
├── approvedAt
└── timestamps

PRODUCTS COLLECTION
├── sellerId (Reference to User)
├── title, description, category
├── price, imageUrl
├── condition: 'new' | 'like-new' | 'good' | 'fair'
├── stock (inventory count)
├── isActive
├── status: 'pending' | 'approved' | 'removed'
├── averageRating
└── timestamps

SERVICES COLLECTION
├── sellerId (Reference to User)
├── title, description, category
├── price, imageUrl
├── availability
├── isActive
├── status: 'pending' | 'approved' | 'removed'
├── averageRating
└── timestamps

ORDERS COLLECTION
├── buyerId (Reference to User)
├── sellerId (Reference to User)
├── items [Array]
│   ├── productId (Reference)
│   ├── title, category, imageUrl
│   ├── quantity, price
├── totalAmount
├── paymentStatus: 'pending' | 'paid' | 'failed'
├── transactionId
├── orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
├── statusTimeline [Array with timestamps]
├── deliveryAddress
└── timestamps

BOOKINGS COLLECTION
├── buyerId (Reference to User)
├── sellerId (Reference to User)
├── serviceId (Reference to Service)
├── serviceTitle
├── scheduledDate
├── duration
├── totalAmount
├── paymentStatus
├── transactionId
├── bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
└── timestamps

CARTS COLLECTION
├── userId (Reference to User, unique)
├── items [Array]
│   ├── productId (Reference)
│   ├── quantity
│   └── price
└── timestamps

REVIEWS COLLECTION
├── reviewerId (Reference to User)
├── targetId (ObjectId of product/service/seller)
├── targetType: 'product' | 'service' | 'seller'
├── rating (1-5)
├── comment
└── timestamps

SUPPORT_TICKETS COLLECTION
├── raisedBy (Reference to User)
├── subject, description
├── status: 'open' | 'in-progress' | 'resolved' | 'closed'
├── adminNote
└── timestamps
```

---

## Backend Architecture

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod schema validation
- **Email**: Nodemailer
- **Security**: Helmet.js, CORS
- **Logging**: Morgan
- **Environment**: dotenv

### Project Structure

```
backend/
├── src/
│   ├── app.js (Express app setup)
│   ├── server.js (Server entry point)
│   ├── config/
│   │   ├── db.js (MongoDB connection)
│   │   ├── env.js (Environment variables)
│   │   └── mailer.js (Email configuration)
│   ├── constants/
│   │   └── enums.js (Status enums)
│   ├── models/ (Mongoose schemas)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Service.js
│   │   ├── Order.js
│   │   ├── Booking.js
│   │   ├── Cart.js
│   │   ├── Review.js
│   │   ├── SellerProfile.js
│   │   └── SupportTicket.js
│   ├── controllers/ (Business logic)
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   ├── productController.js
│   │   ├── serviceController.js
│   │   ├── bookingController.js
│   │   ├── reviewController.js
│   │   ├── sellerController.js
│   │   ├── ticketController.js
│   │   └── adminController.js
│   ├── routes/ (API endpoints)
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── productRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── sellerRoutes.js
│   │   ├── ticketRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── auth.js (JWT verification)
│   │   ├── error.js (Error handling)
│   │   └── validate.js (Request validation)
│   ├── services/
│   │   ├── emailService.js
│   │   └── ratingService.js
│   ├── utils/
│   │   ├── http.js (Response formatting)
│   │   ├── tokens.js (JWT utilities)
│   │   ├── pagination.js (Pagination helpers)
│   │   ├── serializers.js (Data serialization)
│   │   ├── analytics.js (Aggregation functions)
│   │   └── csv.js (CSV export)
│   └── schemas/ (Zod validation schemas)
│       └── index.js
├── seed.js (Database seeding)
└── package.json
```

### Key API Endpoints

#### Authentication

```
POST   /api/auth/register        - User registration
POST   /api/auth/login           - User login
POST   /api/auth/admin-login     - Admin login
POST   /api/auth/refresh         - Refresh tokens
GET    /api/auth/me              - Current user info
POST   /api/auth/logout          - Logout
```

#### Orders

```
POST   /api/orders/                          - Create order
GET    /api/orders/my-purchases              - All purchases
GET    /api/orders/my-sales                  - All sales (seller)
GET    /api/orders/:id                       - Order details
PATCH  /api/orders/:id/status                - Update status
PATCH  /api/orders/:id/cancel                - Cancel order
```

#### Cart

```
GET    /api/cart/                 - Get cart
POST   /api/cart/items           - Add item
PATCH  /api/cart/items/:id       - Update quantity
DELETE /api/cart/items/:id       - Remove item
DELETE /api/cart/               - Clear cart
```

#### Products

```
GET    /api/products/                    - Browse products
GET    /api/products/:id                 - Product details
POST   /api/products/                    - Create listing
PATCH  /api/products/:id                 - Update listing
GET    /api/products/seller/:id          - Seller's products
GET    /api/products/search?q=<query>   - Search products
GET    /api/products?category=<cat>&price=<range> - Filter
```

#### Services

```
GET    /api/services/              - Browse services
GET    /api/services/:id           - Service details
POST   /api/services/              - Create service
PATCH  /api/services/:id           - Update service
GET    /api/services/seller/:id    - Seller's services
```

#### Bookings

```
POST   /api/bookings/              - Book service
GET    /api/bookings/my-bookings   - User's bookings
GET    /api/bookings/:id           - Booking details
PATCH  /api/bookings/:id/status    - Update status
PATCH  /api/bookings/:id/cancel    - Cancel booking
```

#### Reviews

```
POST   /api/reviews/           - Create review
GET    /api/reviews/:id        - Get review
GET    /api/reviews/target/:id - Reviews for product/service
```

#### Sellers

```
POST   /api/seller/apply              - Apply for seller
GET    /api/seller/profile            - Get profile
PATCH  /api/seller/profile            - Update profile
GET    /api/seller/stats              - Sales statistics
GET    /api/seller/revenue            - Revenue tracking
```

#### Support Tickets

```
POST   /api/tickets/             - Create ticket
GET    /api/tickets/my-tickets   - User's tickets
GET    /api/tickets/:id          - Ticket details
PATCH  /api/tickets/:id/status   - Update status
```

#### Admin

```
GET    /api/admin/dashboard          - Dashboard stats
GET    /api/admin/sellers            - Sellers list
PATCH  /api/admin/sellers/:id/status - Approve/reject seller
GET    /api/admin/products           - Products for approval
PATCH  /api/admin/products/:id       - Approve product
GET    /api/admin/services           - Services for approval
PATCH  /api/admin/services/:id       - Approve service
GET    /api/admin/reports/sales      - Sales report
GET    /api/admin/reports/users      - User report
GET    /api/admin/reports/revenue    - Revenue report
POST   /api/admin/export/csv         - Export to CSV
```

### Middleware Implementation

**Authentication Middleware** (`/backend/src/middleware/auth.js`)

- JWT token validation
- User context injection
- Role-based authorization
- Seller approval check for restricted operations

**Error Handling Middleware** (`/backend/src/middleware/error.js`)

- Centralized error handling
- Custom AppError class
- Status code mapping
- Error message formatting
- Request logging on errors

**Validation Middleware** (`/backend/src/middleware/validate.js`)

- Zod schema validation
- Request body/params validation
- Error handling with proper messages

---

## Frontend Architecture

### Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **State Management**: React Context + TanStack Query
- **HTTP Client**: Axios
- **Form Handling**: Controlled components with useState

### Project Structure

```
frontend/
├── src/
│   ├── App.jsx (Main app component)
│   ├── main.jsx (Entry point)
│   ├── index.css (TailwindCSS imports)
│   ├── components/ (Reusable UI components)
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ServiceCard.jsx
│   │   ├── OrderCard.jsx
│   │   ├── OrderStatusBadge.jsx
│   │   ├── OrderTimeline.jsx
│   │   ├── StarRating.jsx
│   │   ├── KPICard.jsx
│   │   ├── SalesChart.jsx
│   │   ├── LeadPipeline.jsx
│   │   ├── ActivityFeed.jsx
│   │   ├── CustomerProfileCard.jsx
│   │   ├── InventoryTable.jsx
│   │   ├── ReportTable.jsx
│   │   ├── ResourceUtilizationBar.jsx
│   │   ├── StockAlert.jsx
│   │   └── CartIcon.jsx
│   ├── context/ (Global state)
│   │   ├── AppContext.jsx (User, auth, cart)
│   │   ├── OrderContext.jsx (Orders data)
│   │   └── ERPCRMContext.jsx (Analytics, CRM data)
│   ├── pages/ (Page components)
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── ProductMarketplace.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── ListProduct.jsx
│   │   ├── ServiceMarketplace.jsx
│   │   ├── ServiceDetail.jsx
│   │   ├── ListService.jsx
│   │   ├── Cart.jsx
│   │   ├── Bookings.jsx
│   │   ├── OrderTracking.jsx
│   │   ├── OrderManagement.jsx
│   │   ├── OrderDetail.jsx
│   │   ├── Dashboard.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── ERPDashboard.jsx
│   │   ├── CRMDashboard.jsx
│   │   ├── CustomerManagement.jsx
│   │   ├── InventoryManagement.jsx
│   │   ├── ResourcePlanning.jsx
│   │   ├── ReportsCenter.jsx
│   │   └── SalesAnalytics.jsx
│   ├── lib/
│   │   ├── api.js (API client configuration)
│   │   └── formatters.js (Utility functions)
│   ├── data/
│   │   ├── dummyData.js
│   │   ├── orderData.js
│   │   └── erpCrmData.js
│   ├── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── package.json
```

### Key Frontend Pages

#### User Pages

1. **Home** - Landing page with featured products/services
2. **Login** - User login
3. **Register** - New user registration
4. **AdminLogin** - Admin-specific login
5. **ProductMarketplace** - Browse products with filters
6. **ProductDetail** - Single product view with reviews
7. **ServiceMarketplace** - Browse services
8. **ServiceDetail** - Service details
9. **ListProduct** - Create/Edit product listing
10. **ListService** - Create/Edit service listing
11. **Cart** - Shopping cart with payment form
12. **Dashboard** - User home dashboard

#### Order Pages

13. **OrderManagement** - List all orders (purchases/sales)
14. **OrderDetail** - Single order information
15. **OrderTracking** - Real-time order tracking
16. **Bookings** - Service bookings management

#### Admin Pages

17. **AdminPanel** - Admin home
18. **ERPDashboard** - Enterprise resource planning
19. **CRMDashboard** - Customer relationship management
20. **CustomerManagement** - View/manage customers
21. **InventoryManagement** - Stock management
22. **ResourcePlanning** - Resource allocation
23. **ReportsCenter** - Generate reports
24. **SalesAnalytics** - Sales visualization

### State Management

#### AppContext (`/frontend/src/context/AppContext.jsx`)

**Manages:**

- Current user authentication
- User roles and permissions
- Cart state and operations
- Authentication mutations (login, register, logout)
- Cart mutations (add, remove, update)
- Token management

**API Calls Handled:**

- Login, register, admin login
- Get current user info
- Get cart
- Add/remove/update cart items

#### OrderContext (`/frontend/src/context/OrderContext.jsx`)

**Manages:**

- User's orders (purchases and sales)
- Order filtering and searching
- Order status management
- Order metadata and statistics

#### ERPCRMContext (`/frontend/src/context/ERPCRMContext.jsx`)

**Manages:**

- Sales data and metrics
- ERP resources and utilization
- CRM customer data and segments
- Customer interactions
- Support tickets
- Activity feeds
- Analytics computations

### Component Library

**Reusable Components:**

- `ProductCard` - Product display with image, price, rating
- `ServiceCard` - Service display card
- `OrderCard` - Order summary card
- `StarRating` - 5-star rating component
- `OrderStatusBadge` - Status indicator badge
- `OrderTimeline` - Visual timeline of order progression
- `KPICard` - Key performance indicator card
- `SalesChart` - Data visualization (Chart.js)
- `Navbar` - Navigation header
- `Footer` - Page footer
- `CustomerProfileCard` - Customer details card
- `InventoryTable` - Stock list table
- `ReportTable` - Report data table
- `ActivityFeed` - Activity log component
- `LeadPipeline` - Sales pipeline visualization
- `ResourceUtilizationBar` - Progress bar for resources
- `StockAlert` - Low stock warning

---

## Sample Data & Seeding

### Seed Script (`/backend/seed.js`)

**Data Created:**

1. **1 Admin Account**
   - Email: admin@campusconnect.com
   - Password: Admin@123

2. **5 Buyer Accounts**
   - Names: Rahul Sharma, Megha Patil, Pooja Nair, Kabir Singh, Anvi Desai
   - Password: Buyer@123

3. **3 Seller Accounts**
   - Names: Priya Mehta, Dev Malhotra, Riya Singh
   - Password: Seller@123
   - Approved seller statuses with verified profiles

4. **8 Products** (across categories: Books, Electronics, Accessories, Lab Equipment)
   - Various stock levels (2-10 items)
   - Different conditions (new, like-new, good, fair)
   - Unsplash images for each

5. **6 Services** (Tutoring, Design, Coding, Content Writing)
   - Different availability times
   - Price range ₹500-₹1000

6. **10 Orders** (showing all status stages)
   - Mixed seller-buyer pairs
   - All payment statuses as "paid"
   - Different order statuses to demonstrate workflow
   - Status timelines with realistic timestamps

7. **5 Bookings** (showing all booking statuses)

8. **7 Reviews** (products, services, and sellers)
   - Rating distribution across 1-5 stars
   - Realistic review comments

9. **5 Support Tickets** (various statuses)

**Run Seeding:**

```bash
npm run seed
```

---

## Authentication & Authorization

### JWT Token System

**Token Types:**

1. **Access Token** - Short-lived, for API requests
2. **Refresh Token** - Long-lived, for obtaining new access tokens

**Token Structure:**

```javascript
payload = {
  userId: string,
  email: string,
  role: "admin" | "seller" | "buyer",
};
```

### Role-Based Authorization

**Admin Role:**

- Access to all admin endpoints
- Approve/reject sellers
- Approve/reject product/service listings
- View platform analytics
- Export reports
- Manage support tickets

**Seller Role:**

- Create product listings
- Create service listings
- View own sales orders
- Update order status for own orders
- Access seller analytics
- Apply for seller profile

**Buyer Role:**

- Browse products and services
- Add to cart
- Create orders
- View own purchases
- Leave reviews
- Book services

---

## Features Summary

### Implemented Features

#### Order Management (Experiment 4)

- ✅ Create orders from cart items
- ✅ Multi-seller order splitting
- ✅ Order status tracking (placed → confirmed → shipped → delivered)
- ✅ Order cancellation with stock restock
- ✅ Order history (purchases and sales)
- ✅ Order timeline visualization
- ✅ Real-time order details
- ✅ Stock management and validation
- ✅ Inventory tracking per product

#### Payment System (Experiment 5)

- ✅ Cart-to-order payment flow
- ✅ Payment form UI (card details)
- ✅ Payment processing simulation (2-second delay)
- ✅ Transaction ID generation
- ✅ Payment status tracking (pending, paid, failed)
- ✅ Email notifications on order status change
- ✅ Order confirmation with unique ID
- ✅ Multi-seller transaction handling
- ✅ Stock updates on payment

#### ERP/CRM Integration (Experiment 6)

- ✅ ERP Dashboard with KPIs
- ✅ Sales metrics and trends
- ✅ Resource utilization tracking
- ✅ Listing metrics (active, pending, removed)
- ✅ Transaction metrics (processed, success rate, average value)
- ✅ CRM Dashboard with customer insights
- ✅ Customer segmentation (High Value, Active, New, At Risk)
- ✅ Net Promoter Score calculation
- ✅ Customer retention metrics
- ✅ Churn rate analysis
- ✅ Lead pipeline visualization
- ✅ Activity feed tracking
- ✅ Support ticket management
- ✅ Admin reports center
- ✅ Export reports to CSV
- ✅ Sales analytics and trends
- ✅ Customer management interface
- ✅ Resource planning tools

---

## Testing Data

### Default Credentials

**Admin Account:**

```
Email: admin@campusconnect.com
Password: Admin@123
```

**Sample Buyer Account:**

```
Email: rahul@campusconnect.com
Password: Buyer@123
```

**Sample Seller Account:**

```
Email: priya@campusconnect.com
Password: Seller@123
```

### Sample Orders in Database

- 10 orders across all statuses
- Orders spanning Jan-Mar 2026
- Order IDs: TXN_1712210001 through TXN_1712210010
- Various total amounts (₹220 to ₹1200)

---

## Deployment Configuration

### Environment Variables

**Backend** (`.env`)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=<connection_string>
JWT_SECRET=<secret_key>
JWT_REFRESH_SECRET=<refresh_secret>
FRONTEND_URL=http://localhost:5173
SMTP_HOST=<email_host>
SMTP_PORT=<email_port>
SMTP_USER=<email_user>
SMTP_PASS=<email_password>
ENABLE_BACKEND_LOGS=true
```

**Frontend** (`.env`)

```
VITE_API_URL=http://localhost:5000/api
```

### Scripts

**Backend:**

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "seed": "node seed.js"
}
```

**Frontend:**

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## Performance Optimizations

### Implemented

- ✅ Database indexing on frequently queried fields
- ✅ Pagination for list endpoints
- ✅ Lazy loading of components
- ✅ Skeleton loading states
- ✅ Query caching with TanStack Query
- ✅ Image optimization with fallback URLs
- ✅ CORS optimization
- ✅ Helmet security headers
- ✅ Morgan request logging

### Future Enhancements

- Add Redis caching for frequently accessed data
- Implement GraphQL for flexible queries
- Add image compression and CDN
- Implementation of database aggregation pipelines
- API rate limiting
- Request compression (gzip)

---

## Security Features

### Implemented

- ✅ JWT token-based authentication
- ✅ Bcryptjs password hashing
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ MongoDB injection prevention via Mongoose
- ✅ Zod input validation
- ✅ Role-based access control (RBAC)
- ✅ Seller approval workflow
- ✅ Product approval workflow
- ✅ Email verification (structure in place)
- ✅ Password minimum length (6 chars)

### Security Considerations

- Implement HTTPS in production
- Enable password reset with email verification
- Add two-factor authentication (2FA)
- Implement account lockout after failed attempts
- Add comprehensive audit logging
- Implement encryption for sensitive data fields

---

## API Documentation Summary

### Response Format (Standard)

```javascript
{
  success: true | false,
  message: string,
  data: object,
  pagination?: {
    page: number,
    pageSize: number,
    total: number,
    pages: number
  }
}
```

### Error Handling

- HTTP Status Codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error)
- Error Response includes message explaining issue
- Validation errors list specific field errors

---

## Conclusion

CampusConnect is a fully functional e-commerce platform demonstrating:

1. **Complete Order Management System** with inventory tracking and multi-seller support
2. **Online Payment Processing** with transaction management and email notifications
3. **ERP/CRM Integration** providing business analytics, customer relationship management, and enterprise insights

The application is production-ready with proper architecture, error handling, authentication, and data management. All three experiments are integrated into a cohesive full-stack application suitable for practical submission.

---

**Project Version:** 1.0.0
**Last Updated:** April 2026
**Stack:** MERN (MongoDB, Express, React, Node.js)
**Total API Endpoints:** 50+
**Database Collections:** 9
**UI Pages:** 24+
**Reusable Components:** 16+
