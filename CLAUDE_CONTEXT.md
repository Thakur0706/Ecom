# CampusConnect - Quick Reference for Claude

**Use this as context when asking Claude for fixes/improvements**

---

## 🎯 KEY FACTS

- **Project:** Multi-role e-commerce platform for college students
- **Status:** 85% complete, core features working
- **Architecture:** Node.js/Express/MongoDB backend + React/Vite frontend
- **Database:** 15 models with full relationships and indexes
- **API:** 70+ REST endpoints with JWT authentication
- **User Roles:** Buyer, Supplier (vendor), Admin

---

## 💰 REVENUE MODEL (CRITICAL)

**Platform Commission System:**

```
When Order/Booking Completes:
  1. Create Sales record (tracks transaction)
  2. Calculate platformFee (% of total amount)
  3. Calculate supplierEarns = totalAmount - platformFee
  4. Create SupplierCommission (tracks platform fee)
  5. Add to SupplierPayment queue (reimbursements)

Flow:
  Order: ₹1000
     ↓
  Platform Fee (10%): ₹100
     ↓
  Supplier Gets: ₹900
     ↓
  Status: pending → paid (when admin marks)
```

**Key Models:**

- `Sales` - All completed transactions
- `SupplierCommission` - Platform fees (pending/paid)
- `SupplierPayment` - Actual reimbursements to suppliers
- `Order` & `Booking` - Transaction sources

**Admin Controls:**

- View commissions by supplier/date/status
- Mark commission as paid
- Create manual payments
- Generate reports

---

## ✅ WHAT'S WORKING (15 Features)

| #   | Feature            | Status      | Key File             |
| --- | ------------------ | ----------- | -------------------- |
| 1   | Auth & JWT         | ✅ Complete | authController.js    |
| 2   | Products           | ✅ Complete | productController.js |
| 3   | Services           | ✅ Complete | serviceController.js |
| 4   | Shopping Cart      | ✅ Complete | cartController.js    |
| 5   | Orders             | ✅ Complete | orderController.js   |
| 6   | Service Bookings   | ✅ Complete | bookingController.js |
| 7   | Razorpay Payments  | ✅ Complete | razorpayService.js   |
| 8   | Coupons            | ✅ Complete | couponHelpers.js     |
| 9   | Booking Chat       | ✅ Complete | BookingMessage model |
| 10  | Reviews/Ratings    | ✅ Complete | Review model         |
| 11  | Admin Panel        | ✅ Complete | AdminPanel.jsx       |
| 12  | Supplier Dashboard | ✅ Complete | Dashboard.jsx        |
| 13  | CRM Dashboard      | ✅ Complete | ERPCRMContext.jsx    |
| 14  | Support Tickets    | ✅ Complete | SupportTicket model  |
| 15  | Admin Analytics    | ✅ Complete | adminController.js   |

---

## ⚠️ TOP 5 ISSUES TO FIX

### 1. 🔴 Frontend Role Selection Missing

**Impact:** High | **Time:** 2-3 hours

**Problem:**

- Registration only creates buyers
- Suppliers must register then manually apply
- Backend accepts `desiredRole` but frontend doesn't send it

**Fix Location:** `frontend/src/pages/Register.jsx`

- Add role selection radio buttons
- Show supplier application fields if "supplier" selected
- Collect supplier documents (as URLs)
- Send `desiredRole` and `supplierApplication` to backend

---

### 2. 🟡 Razorpay Integration Edge Cases

**Impact:** Medium | **Time:** 3-4 hours

**Problem:**

- Payment signature verification might fail
- Order reconciliation between Razorpay and DB not complete
- Error handling for payment failures

**Fix Location:** `backend/src/services/razorpayService.js` + `frontend/src/pages/Cart.jsx`

- Add comprehensive error handling
- Verify all Razorpay webhook scenarios
- Test failed payment recovery
- Add payment status callbacks

---

### 3. 🟡 Email Notifications Limited

**Impact:** Medium | **Time:** 2-3 hours

**Missing:**

- Payment confirmations
- Booking confirmations
- Seller approvals
- Support ticket updates
- Admin notifications

**Fix Location:** `backend/src/services/emailService.js`

- Add 5+ new email templates
- Integration points in controllers
- HTML email formatting

---

### 4. 🟡 Seller Revenue Calculation

**Impact:** Medium | **Time:** 2 hours

**Problem:**

- Doesn't include service booking revenue
- Commission not deducted from displayed revenue
- Might double-count in analytics

**Fix Location:** `backend/src/controllers/sellerController.js` line 118

- Update `getSellerDashboardOverview()`
- Include service bookings
- Calculate commission properly
- Separate pending vs confirmed revenue

---

### 5. 🟡 Coupon System Limitations

**Impact:** Medium | **Time:** 3 hours

**Missing:**

- Expiration dates
- Usage limits
- One-time per customer enforcement
- Admin coupon management UI

**Fix Location:**

- Backend: `backend/src/utils/couponHelpers.js`
- Frontend: Add coupon management in AdminPanel

---

## 🔑 CRITICAL FILES

### Backend Controllers

```
authController.js        - Authentication (working)
productController.js     - Products (working)
serviceController.js     - Services (working)
cartController.js        - Cart (working)
orderController.js       - Orders (working)
bookingController.js     - Bookings (working)
adminController.js       - Admin features (working)
sellerController.js      - Seller data (needs revenue fix)
```

### Backend Services

```
razorpayService.js       - Payment gateway (mostly done)
emailService.js          - Emails (incomplete)
ratingService.js         - Rating calculations
```

### Backend Models

```
Order.js                 - Product orders
Booking.js               - Service bookings
SellerCommission.js      - Platform fees
SellerPayment.js         - Seller reimbursements
Sales.js                 - Analytics records
```

### Frontend Components

```
Register.jsx             - Missing role selection ⚠️
Cart.jsx                 - Payment processing
AdminPanel.jsx           - Admin dashboard
Dashboard.jsx            - Seller dashboard
OrderManagement.jsx      - Order tracking
Bookings.jsx             - Service bookings
```

---

## 🧪 TEST DATA

**Credentials Available:**

```
Admin: admin@campusconnect.com / Admin@123
Seller: priya@campusconnect.com / Seller@123
Buyer: buyer@campusconnect.com / Buyer@123
```

**Seeded Data:**

- 5+ users with different roles
- 20+ products across categories
- 5+ services
- Sample orders and bookings
- Sample transactions and commissions

**Seed Command:**

```bash
cd backend
npm run seed
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### Data Flow - Product Order:

```
1. User adds product to cart
2. Checkout → Select delivery address
3. Choose payment method (Razorpay/COD)
4. If Razorpay: Create order at Razorpay, verify signature
5. If COD: Create order with status 'pending'
6. Create Order record (groups by seller if multi-seller)
7. Decrement product stock
8. Clear cart
9. Create Sales record (for analytics)
10. Create SellerCommission record (platform fee)
11. Send email to buyer
12. Seller sees order in dashboard
```

### Data Flow - Service Booking:

```
1. User books service
2. Booking created with status 'pending' (not confirmed)
3. Seller sees in dashboard
4. Seller confirms booking
5. Booking status → 'confirmed'
6. Now buyer can pay (payment only after confirmation)
7. Payment processed (creates Sales record)
8. Creates SellerCommission
9. Chat becomes available
10. Service completed
11. Buyer can leave review
```

### Payment Verification:

```
Frontend:
  1. Init Razorpay modal
  2. User pays
  3. Get paymentId, orderId, signature

Backend:
  1. Verify signature with HMAC-SHA256
  2. Fetch payment from Razorpay API
  3. Verify amount matches
  4. Update Order payment status
  5. Create transaction records
```

---

## 📋 QUICK FIXES CHECKLIST

When asking Claude, reference these:

```
[ ] Add role selection to Registration page
[ ] Fix Razorpay error handling
[ ] Add email templates (5+ types)
[ ] Fix seller revenue calculation
[ ] Add coupon expiration dates
[ ] Add coupon usage limits
[ ] Implement document upload for sellers
[ ] Add real-time notifications (via WebSockets)
[ ] Improve mobile responsiveness
[ ] Add rate limiting to API
[ ] Add payment timeout handling
[ ] Validate delivery address format
[ ] Add inventory alerts when stock low
[ ] Add seller rating display
[ ] Add product search highlighting
```

---

## 🔍 KEY VALIDATION RULES

### Cart → Order Creation:

```javascript
✓ Cart must exist and not be empty
✓ All items must have valid products
✓ Stock must be available for each item
✓ Product prices must be current
✓ Delivery address required
✓ Payment method must be valid
```

### Booking → Payment:

```javascript
✓ Booking must be confirmed first (seller)
✓ Booking not already paid
✓ Service must be active
✓ Seller must be approved
✓ Coupon (if provided) must be valid
```

### Commission Creation:

```javascript
✓ Order/Booking must be completed
✓ Payment status must be paid/pending
✓ Platform fee % configured
✓ Seller must exist and be approved
```

---

## 🎬 RUNNING THE PROJECT

```bash
# Backend Setup
cd backend
npm install
npm run seed        # First time only
npm run dev         # Starts on port 5000

# Frontend Setup
cd frontend
npm install
npm run dev         # Starts on port 5173

# Access
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
```

---

## 💡 DEBUGGING TIPS

1. **Check JWT Token:** Decode at jwt.io
2. **DB Connection:** Check MongoDB connection string in `.env`
3. **CORS Issues:** Check frontend URL in `backend/src/config/env.js`
4. **Payment Debugging:** Enable Razorpay test mode in `.env`
5. **Email Testing:** Check nodemailer config in `backend/src/config/mailer.js`
6. **React Query Debugging:** Look at React Query DevTools
7. **API Responses:** Check network tab in browser DevTools

---

**Use this document to brief Claude on what needs to be fixed and how the system works!**
