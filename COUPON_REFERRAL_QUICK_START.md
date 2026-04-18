# Quick Start Guide — Coupon & Referral System

## Backend Setup

### 1. Verify Models Exist

Ensure these models exist in `backend/src/models/`:

- `MarketingCoupon.js` ✅
- `ReferralCode.js` ✅

### 2. Start Backend

```bash
cd backend
npm run dev
```

Expected output:

```
Server running on port 5000
Database connected
```

---

## Frontend Setup

### 1. Start Frontend

```bash
cd frontend
npm run dev
```

---

## Testing Workflow

### Test 1: Create & Manage Coupons

1. **Login as Admin**
   - Go to `http://localhost:5173/admin/login`
   - Use admin credentials

2. **Navigate to Marketing Dashboard**
   - Click "Marketing" in navbar
   - Should see 2 tabs: "Coupons" and "Referrals"

3. **Create a Test Coupon**
   - Click "+ Create Coupon"
   - Fill form:
     - Code: `TEST20`
     - Type: `Percent`
     - Value: `20`
     - Min Order: `500`
     - Max Uses: `100`
     - Max Uses Per User: `1`
     - Applicable To: `Both`
     - Description: `Test coupon for summer sale`
   - Click "Create Coupon"
   - Should see success and coupon appears in table

4. **Validate Coupon**
   - Use API client (Postman/Thunder Client):

   ```
   POST /api/marketing/coupons/validate
   Body: {
     "code": "TEST20",
     "orderAmount": 1000,
     "applicationType": "products"
   }
   ```

   - Expected response:

   ```json
   {
     "valid": true,
     "discount": 200,
     "coupon": {
       "code": "TEST20",
       "type": "percent",
       "value": 20,
       "discount": 200
     }
   }
   ```

5. **Edit Coupon**
   - Click "Edit" on TEST20 coupon
   - Change Max Uses to 50
   - Click "Update Coupon"
   - Verify in table

6. **Delete Coupon**
   - Click "Delete" on any test coupon
   - Confirm deletion
   - Coupon disappears

---

### Test 2: Referral System

1. **Generate Referral Code (as User)**

   ```
   POST /api/marketing/referral/generate
   Auth: User token
   ```

   - Response:

   ```json
   {
     "code": "CC[lastSixChars]",
     "totalRewards": 0,
     "usedCount": 0
   }
   ```

   - Save the code

2. **Get Referral Stats (as User)**

   ```
   GET /api/marketing/referral
   Auth: User token
   ```

   - Response shows code, rewards, referred users

3. **Apply Referral Code (as Different User)**

   ```
   POST /api/marketing/referral/apply
   Auth: Different user token
   Body: {
     "referralCode": "CC[code]"
   }
   ```

   - Response: Success message
   - First user's totalRewards should +50

4. **View Admin Stats**
   - Go to Marketing Dashboard
   - Click "Referrals" tab
   - Should see table with referrers
   - Click user name to verify stats

---

### Test 3: Coupon Validation Rules

Test each validation rule:

1. **Invalid Code**

   ```json
   {
     "code": "INVALID",
     "orderAmount": 1000,
     "applicationType": "products"
   }
   ```

   - Response: `{ "valid": false, "reason": "Coupon code not found" }`

2. **Expired Coupon**
   - Create coupon with past expiry date
   - Validate it
   - Response: `{ "valid": false, "reason": "Coupon has expired" }`

3. **Insufficient Order Amount**
   - Create coupon with minOrderAmount: 1000
   - Validate with orderAmount: 500
   - Response: `{ "valid": false, "reason": "Minimum order amount is ₹1000" }`

4. **Max Uses Exceeded**
   - Create coupon with maxUses: 1
   - Use it once (manually in DB)
   - Validate again
   - Response: `{ "valid": false, "reason": "Coupon usage limit reached" }`

5. **Per-User Limit Exceeded**
   - Create coupon with maxUsesPerUser: 1
   - Apply it once as user A
   - Try to apply again as user A
   - Response: `{ "valid": false, "reason": "You can use this coupon maximum 1 time(s)" }`

6. **Wrong Applicability Type**
   - Create coupon with applicableTo: "products"
   - Validate with applicationType: "services"
   - Response: `{ "valid": false, "reason": "Coupon is applicable only to products" }`

---

## API Reference (Quick)

### Coupons

```bash
# Create
curl -X POST http://localhost:5000/api/marketing/coupons \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","type":"flat","value":100,"applicableTo":"both"}'

# List all
curl http://localhost:5000/api/marketing/coupons \
  -H "Authorization: Bearer [token]"

# Validate
curl -X POST http://localhost:5000/api/marketing/coupons/validate \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","orderAmount":1000,"applicationType":"products"}'

# Update
curl -X PATCH http://localhost:5000/api/marketing/coupons/[id] \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"value":150,"isActive":false}'

# Delete
curl -X DELETE http://localhost:5000/api/marketing/coupons/[id] \
  -H "Authorization: Bearer [token]"
```

### Referrals

```bash
# Generate code
curl -X POST http://localhost:5000/api/marketing/referral/generate \
  -H "Authorization: Bearer [token]"

# Get stats
curl http://localhost:5000/api/marketing/referral \
  -H "Authorization: Bearer [token]"

# Apply code
curl -X POST http://localhost:5000/api/marketing/referral/apply \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"referralCode":"CC439011"}'

# Admin stats (admin token required)
curl http://localhost:5000/api/marketing/referral/admin/stats \
  -H "Authorization: Bearer [admin-token]"
```

---

## Troubleshooting

### 404 on Marketing routes

- Verify `marketingRoutes` imported in `app.js` ✅
- Verify `app.use('/api/marketing', marketingRoutes)` added ✅
- Restart backend server

### Models not found

- Check `backend/src/models/MarketingCoupon.js` exists
- Check `backend/src/models/ReferralCode.js` exists
- Verify imports in controller

### 403 Forbidden on admin endpoints

- Ensure user token has `role: "admin"`
- Check middleware `ensureAdmin` in routes

### Dashboard not showing data

- Clear browser cache / local storage
- Check browser console for API errors
- Verify token is valid and not expired
- Check API response in Network tab

---

## Next Steps

1. **Integrate with Order Creation**
   - Call `applyCouponToOrder()` when order is placed
   - Deduct discount from order total

2. **Integrate with Registration**
   - Add optional referralCode field to registration form
   - Call `applyReferralCode()` on successful registration

3. **Add Coupon Email Campaign**
   - Create batch coupon codes
   - Email monthly newsletters with exclusive codes
   - Track usage per campaign

4. **Reward Redemption**
   - Add page for users to see referral rewards
   - Create "redeem rewards" feature (discount on next order)

5. **Analytics**
   - Add dashboard showing coupon ROI
   - Track most-used coupons
   - Show referral effectiveness
