# Coupon & Referral System Implementation

## Overview

Complete coupon management and referral reward system for CampusConnect e-commerce platform.

---

## PART A: Backend — Coupon Controller

**File:** `backend/src/controllers/marketingController.js`

### Coupon Functions

#### 1. `createCoupon(req, res)` — Admin Only

- Creates a new marketing coupon
- **Input:**
  - code (string) - Auto-uppercased
  - type ("flat" | "percent")
  - value (number)
  - minOrderAmount (number)
  - maxUses (number | null for unlimited)
  - maxUsesPerUser (number)
  - expiresAt (date | null for no expiry)
  - applicableTo ("products" | "services" | "both")
  - description (string)
- **Output:** Created coupon object with all fields
- **Status:** 201 Created

#### 2. `getAllCoupons(req, res)` — Admin Only

- Returns all coupons with usage statistics
- **Output:**
  ```json
  {
    "coupons": [
      {
        "code": "SUMMER20",
        "type": "percent",
        "value": 20,
        "usageStats": {
          "used": 15,
          "limit": 100,
          "remaining": 85
        }
      }
    ]
  }
  ```
- Sorted by createdAt descending

#### 3. `updateCoupon(req, res)` — Admin Only

- Updates coupon fields: value, minOrderAmount, maxUses, expiresAt, isActive, description
- **Note:** Code cannot be changed after creation (read-only)
- **Output:** Updated coupon object

#### 4. `deleteCoupon(req, res)` — Admin Only

- Hard deletes a coupon
- Returns success message

#### 5. `validateCoupon(req, res)` — Authenticated User

- **Purpose:** Validates coupon before applying to order
- **Input:**
  ```json
  {
    "code": "SUMMER20",
    "orderAmount": 1500,
    "applicationType": "products"
  }
  ```
- **Validation Checks:**
  1. Coupon exists
  2. isActive === true
  3. Not expired (expiresAt === null OR expiresAt > now)
  4. maxUses === null OR usedCount < maxUses
  5. orderAmount >= minOrderAmount
  6. User hasn't exceeded maxUsesPerUser
  7. applicableTo matches applicationType or is 'both'
- **Output (Valid):**
  ```json
  {
    "valid": true,
    "discount": 300,
    "coupon": {
      "code": "SUMMER20",
      "type": "percent",
      "value": 20,
      "discount": 300
    }
  }
  ```
- **Output (Invalid):**
  ```json
  {
    "valid": false,
    "reason": "Coupon code not found"
  }
  ```
- **Note:** Does NOT increment usedCount (only happens when order is placed)

#### 6. `applyCouponToOrder(couponCode, userId, orderAmount)` — Internal Helper

- Called internally when order is created
- **Same validation as validateCoupon**
- **Additional Actions:**
  - Increments usedCount
  - Pushes userId to usedBy array with timestamp
- **Output:**
  ```json
  {
    "discount": 300,
    "coupon": { ...coupon object }
  }
  ```
- **Used in:** orderController.js when creating orders

---

## PART B: Backend — Referral System

### Referral Functions

#### 1. `generateReferralCode(req, res)` — Authenticated User

- Generates or retrieves referral code for current user
- **Code Format:** `CC{last6charsOfUserId}`
- Example: User ID `507f1f77bcf86cd799439011` → Code `CC439011`
- **Logic:**
  - If user already has a ReferralCode → return existing
  - If not → create new record
- **Output:**
  ```json
  {
    "code": "CC439011",
    "totalRewards": 0,
    "usedCount": 0
  }
  ```

#### 2. `getReferralStats(req, res)` — Authenticated User

- Returns referral stats for current user
- **Output:**
  ```json
  {
    "code": "CC439011",
    "totalRewards": 250,
    "usedCount": 5,
    "referredUsers": [
      {
        "userId": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "usedAt": "2026-04-18T..."
      }
    ]
  }
  ```
- usedBy is populated with user details (name, email)

#### 3. `applyReferralCode(req, res)` — Authenticated User

- Applies referral code during registration or first order
- **Input:**
  ```json
  {
    "referralCode": "CC439011"
  }
  ```
- **Validation:**
  1. Referral code exists
  2. User is not the referrer (can't use own code)
  3. User hasn't already used this code
- **Actions:**
  - Adds userId to usedBy array
  - Adds 50 points to referrer's totalRewards
- **Output:**
  ```json
  {
    "message": "Referral applied. The referrer has earned 50 reward points.",
    "referralReward": 50
  }
  ```

#### 4. `getAllReferralStats(req, res)` — Admin Only

- Returns all referral statistics for admin overview
- **Output:**
  ```json
  {
    "referrers": [
      {
        "id": "...",
        "userId": "...",
        "userName": "Alice Smith",
        "userEmail": "alice@example.com",
        "code": "CC439012",
        "usedCount": 8,
        "totalRewards": 400
      }
    ],
    "totalGenerated": 42
  }
  ```
- Sorted by totalRewards descending

---

## PART C: Backend — Routes

**File:** `backend/src/routes/marketingRoutes.js`

### Coupon Endpoints

| Method | Path                              | Auth | Role  |
| ------ | --------------------------------- | ---- | ----- |
| POST   | `/api/marketing/coupons`          | ✅   | admin |
| GET    | `/api/marketing/coupons`          | ✅   | admin |
| PATCH  | `/api/marketing/coupons/:id`      | ✅   | admin |
| DELETE | `/api/marketing/coupons/:id`      | ✅   | admin |
| POST   | `/api/marketing/coupons/validate` | ✅   | any   |

### Referral Endpoints

| Method | Path                                  | Auth | Role  |
| ------ | ------------------------------------- | ---- | ----- |
| POST   | `/api/marketing/referral/generate`    | ✅   | any   |
| GET    | `/api/marketing/referral`             | ✅   | any   |
| POST   | `/api/marketing/referral/apply`       | ✅   | any   |
| GET    | `/api/marketing/referral/admin/stats` | ✅   | admin |

### Registration in app.js

```javascript
import marketingRoutes from "./routes/marketingRoutes.js";
app.use("/api/marketing", marketingRoutes);
```

---

## PART D: Frontend — Marketing Dashboard

**File:** `frontend/src/pages/MarketingDashboard.jsx`

### Features

#### Dashboard Stats (4 Cards)

- **Total Coupons** - Count of all coupons
- **Active Coupons** - Count of isActive=true coupons
- **Total Referrers** - Count of users with referral codes
- **Referral Rewards** - Sum of all totalRewards across referrers

#### COUPONS Tab

- **Table Columns:**
  - Code
  - Type (% Off / ₹ Flat)
  - Value
  - Min Order
  - Used/Max
  - Applicable To
  - Expires
  - Active (badge)
  - Actions (Edit / Delete)

- **Create Coupon Modal:**
  - code (text, uppercase auto-convert, disabled for edit)
  - type (select: flat/percent)
  - value (number)
  - minOrderAmount (number)
  - maxUses (number, blank = unlimited)
  - maxUsesPerUser (number)
  - expiresAt (date picker)
  - applicableTo (select: products/services/both)
  - description (textarea)

- **Features:**
  - Create new coupon button
  - Edit existing coupon (pre-fills modal)
  - Delete with confirmation
  - Loading/error states

#### REFERRALS Tab

- **Summary Stats:**
  - Total referral codes generated
  - Total referral rewards distributed

- **Top Referrers Table:**
  - User Name
  - Email
  - Referral Code (code badge display)
  - Times Used
  - Total Rewards (points)

- Sorted by Total Rewards descending

### Styling

- TailwindCSS utility classes
- Professional rounded corners and spacing
- Hover effects and transitions
- Badge-based status indicators
- Modal overlay design

### Route

```
/admin/marketing -> MarketingDashboard (admin-only)
```

### Navigation Integration

- Added "Marketing" link in admin navbar (between Suppliers and Analytics)
- Positioned in Navbar.jsx adminLinks array

---

## Integration Points

### Order Creation Flow

When an order is created in `orderController.js`:

1. Admin can optionally provide a coupon code
2. Call `applyCouponToOrder(couponCode, userId, orderAmount)`
3. Validates and applies coupon
4. Increments coupon usedCount
5. Adds userId to usedBy array
6. Returns discount amount for order total calculation

### First Order / Registration Flow

When a new buyer completes first order or during registration:

1. Frontend can optionally send referral code from query param or form
2. Call `applyReferralCode` endpoint with referralCode in body
3. Validates and adds user to referrer's usedBy array
4. Adds 50 points to referrer's totalRewards

---

## Database Models

### MarketingCoupon

```javascript
{
  code: String (uppercase),
  type: 'flat' | 'percent',
  value: Number,
  minOrderAmount: Number,
  maxUses: Number | null,
  maxUsesPerUser: Number,
  usedCount: Number,
  usedBy: [{
    userId: ObjectId,
    usedAt: Date
  }],
  expiresAt: Date | null,
  isActive: Boolean,
  applicableTo: 'products' | 'services' | 'both',
  description: String,
  createdBy: ObjectId (admin),
  createdAt: Date,
  updatedAt: Date
}
```

### ReferralCode

```javascript
{
  userId: ObjectId,
  code: String (unique),
  usedBy: [{
    userId: ObjectId,
    usedAt: Date
  }],
  totalRewards: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Checklist

### Coupon Management

- [ ] Admin can create coupon with all fields
- [ ] Code auto-uppercases and prevents duplicates
- [ ] Admin can view all coupons with usage stats
- [ ] Admin can update coupon (but not code)
- [ ] Admin can delete coupon
- [ ] validateCoupon rejects invalid coupons with correct reason

### Coupon Validation

- [ ] Validates expiration correctly
- [ ] Validates maxUses limit
- [ ] Validates maxUsesPerUser limit
- [ ] Validates minOrderAmount
- [ ] Validates applicableTo matches applicationType
- [ ] Calculates discount correctly for flat and percent types

### Referral System

- [ ] Users can generate referral code (or get existing)
- [ ] Code format is correct: CC{lastSixChars}
- [ ] Users can view referral stats
- [ ] Users can apply referral code (adds to usedBy)
- [ ] Referrer earns 50 points per referral
- [ ] Admin can view all referrers and rewards

### Frontend Dashboard

- [ ] Dashboard displays correct stats
- [ ] Coupons tab shows all coupons in table
- [ ] Create modal works and submits to API
- [ ] Edit modal pre-fills and updates correctly
- [ ] Delete removes coupon after confirmation
- [ ] Referrals tab shows top referrers
- [ ] All API calls succeed and display data
- [ ] Error states display helpful messages
- [ ] Loading states show while fetching

---

## Notes

- All coupon and referral operations are async and error-handled
- Admin-only endpoints require `role === 'admin'` (middleware enforced)
- Coupon codes are case-insensitive (stored uppercase)
- Referral rewards are immutable points (not redeemable, just tracking)
- Timestamps are stored for audit trails on coupon usage and referral applications
