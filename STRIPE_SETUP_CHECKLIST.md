# Stripe Payment Setup - Completion Checklist

This document outlines what needs to be finished to complete the Stripe payment integration for Nagi's Ceylon Catering.

## ✅ What's Already Implemented

1. **Frontend Integration**
   - ✅ Stripe Elements integrated in CheckoutPage
   - ✅ Payment form with CardElement
   - ✅ Payment method selector (currently only card)
   - ✅ Payment intent creation flow
   - ✅ Payment confirmation flow
   - ✅ Order creation after successful payment

2. **Backend (Firebase Functions)**
   - ✅ `createPaymentIntent` function - Creates payment intents with split payments
   - ✅ `confirmPayment` function - Confirms payment and creates orders
   - ✅ `stripeWebhook` function - Handles Stripe webhook events
   - ✅ Direct charge implementation with application fees
   - ✅ Connected account ID configured (hardcoded: `acct_1S50DoJyBQ7hZ0qi`)

3. **Stripe Connect**
   - ✅ Onboarding function (`createStripeOnboardingLink`)
   - ✅ Account status checking (`getStripeAccountStatus`)
   - ✅ Connected account creation flow

## ❌ What Needs to Be Completed

### 1. Environment Variables Configuration

#### Frontend (.env file in root)
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
```

**Status:** ⚠️ **MISSING** - The frontend needs this to initialize Stripe.js

**Action Required:**
- Create `.env` file in project root
- Add your Stripe publishable key
- Restart the development server after adding

#### Firebase Functions Environment Variables

**Status:** ⚠️ **PARTIALLY CONFIGURED** - Secret key is hardcoded in code

**Current Issue:**
- Stripe secret key is hardcoded in `firebase/functions/index.js` (line 24)
- Should be stored as environment variable for security

**Action Required:**
1. Set environment variable in Firebase Functions:
   ```bash
   firebase functions:config:set stripe.secret_key="sk_test_..."
   ```
2. Or use Firebase Functions v2 secrets:
   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY
   ```
3. Remove hardcoded key from `index.js`
4. Update `getStripe()` function to read from environment

**Also Needed:**
- `STRIPE_WEBHOOK_SECRET` - For webhook signature verification

### 2. Webhook Endpoint Configuration

**Status:** ❌ **NOT CONFIGURED**

**Current Situation:**
- Webhook handler exists in Firebase Functions (`stripeWebhook`)
- But webhook endpoint is not registered in Stripe Dashboard

**Action Required:**

1. **Deploy Firebase Functions:**
   ```bash
   cd firebase
   firebase deploy --only functions
   ```

2. **Get Webhook URL:**
   - After deployment, your webhook URL will be:
   - `https://[region]-[project-id].cloudfunctions.net/stripeWebhook`
   - Or check Firebase Console → Functions → stripeWebhook → URL

3. **Configure in Stripe Dashboard:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated` (optional, for Connect account updates)
   - Copy the webhook signing secret (starts with `whsec_`)

4. **Set Webhook Secret:**
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   # Paste the webhook secret when prompted
   ```

5. **Update Code:**
   - Ensure `index.js` reads `STRIPE_WEBHOOK_SECRET` from environment

### 3. Connected Account Verification

**Status:** ⚠️ **NEEDS VERIFICATION**

**Current Situation:**
- Connected account ID is hardcoded: `acct_1S50DoJyBQ7hZ0qi`
- Need to verify account is fully onboarded and active

**Action Required:**

1. **Check Account Status:**
   - Use Admin Panel → Stripe Connect tab
   - Click "Refresh Status"
   - Verify:
     - Status is "active" (not "pending" or "restricted")
     - `chargesEnabled` is `true`
     - `payoutsEnabled` is `true`

2. **If Account Not Active:**
   - Complete Stripe onboarding process
   - Provide all required business information
   - Verify bank account details
   - Complete identity verification

3. **Store Account ID Dynamically:**
   - Consider reading from Firebase Database instead of hardcoding
   - Update `createPaymentIntent` to fetch from `/stripe/connectedAccount`

### 4. Payment Method Support

**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Current Situation:**
- Only credit/debit card payment is visible in UI
- Code supports Apple Pay, Google Pay, AfterPay but UI doesn't show them

**Action Required:**

1. **Enable Additional Payment Methods in UI:**
   - Update `PaymentMethodSelector` in `CheckoutPage.js`
   - Add Apple Pay, Google Pay, AfterPay options
   - Implement detection logic for digital wallets

2. **Stripe Dashboard Configuration:**
   - Enable Apple Pay in Stripe Dashboard
   - Enable Google Pay in Stripe Dashboard
   - Enable AfterPay/Clearpay in Stripe Dashboard
   - For Apple Pay: Add and verify your domain

3. **Test Each Payment Method:**
   - Test card payments (already working)
   - Test Apple Pay on iOS device
   - Test Google Pay on Android device
   - Test AfterPay flow

### 5. Error Handling & User Feedback

**Status:** ⚠️ **NEEDS IMPROVEMENT**

**Current Issues:**
- Basic error handling exists but could be more user-friendly
- No retry mechanism for failed payments
- Limited error messages for users

**Action Required:**

1. **Improve Error Messages:**
   - Add specific error messages for different failure types
   - Show user-friendly messages instead of technical errors
   - Add helpful guidance (e.g., "Check card details", "Try another card")

2. **Add Payment Retry:**
   - Allow users to retry failed payments
   - Don't lose cart contents on payment failure

3. **Add Loading States:**
   - Better visual feedback during payment processing
   - Show progress indicators

### 6. Testing & Validation

**Status:** ❌ **NOT COMPLETE**

**Action Required:**

1. **Test Payment Flow:**
   - [ ] Test successful payment with test card: `4242 4242 4242 4242`
   - [ ] Test declined card: `4000 0000 0000 0002`
   - [ ] Test 3D Secure: `4000 0025 0000 3155`
   - [ ] Verify order creation in Firebase
   - [ ] Verify payment split (restaurant vs platform fee)

2. **Test Webhook Events:**
   - [ ] Trigger test webhook from Stripe Dashboard
   - [ ] Verify webhook signature validation works
   - [ ] Check that webhook events are logged correctly

3. **Test Edge Cases:**
   - [ ] Payment succeeds but order creation fails
   - [ ] Network timeout during payment
   - [ ] User closes browser during payment
   - [ ] Duplicate payment attempts

### 7. Production Readiness

**Status:** ❌ **NOT READY**

**Action Required:**

1. **Switch to Live Keys:**
   - Replace test keys with live keys
   - Update `REACT_APP_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
   - Update `STRIPE_SECRET_KEY` to `sk_live_...`

2. **Verify Connected Account:**
   - Ensure connected account is in live mode
   - Complete all onboarding requirements
   - Verify bank account is connected

3. **Security Review:**
   - Remove all hardcoded keys
   - Ensure all secrets are in environment variables
   - Review Firebase security rules
   - Enable HTTPS only

4. **Monitoring Setup:**
   - Set up error tracking (e.g., Sentry)
   - Monitor webhook delivery
   - Set up alerts for failed payments
   - Monitor payment success rates

### 8. Documentation

**Status:** ⚠️ **PARTIALLY COMPLETE**

**Action Required:**

1. **Update README:**
   - Add Stripe setup instructions
   - Document environment variables needed
   - Add troubleshooting section

2. **Create Deployment Guide:**
   - Step-by-step deployment instructions
   - Environment variable setup
   - Webhook configuration steps

## Priority Order

### High Priority (Must Complete)
1. ✅ Set `REACT_APP_STRIPE_PUBLISHABLE_KEY` in frontend `.env`
2. ✅ Configure webhook endpoint in Stripe Dashboard
3. ✅ Set `STRIPE_WEBHOOK_SECRET` in Firebase Functions
4. ✅ Verify connected account is active and can accept payments
5. ✅ Test complete payment flow end-to-end

### Medium Priority (Should Complete)
6. ✅ Remove hardcoded Stripe secret key
7. ✅ Improve error handling and user feedback
8. ✅ Add additional payment methods (Apple Pay, Google Pay, AfterPay)
9. ✅ Test webhook events

### Low Priority (Nice to Have)
10. ✅ Enhanced monitoring and logging
11. ✅ Payment retry mechanism
12. ✅ Better documentation

## Quick Start Checklist

To get payments working immediately:

- [ ] **Step 1:** Create `.env` file in project root with `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- [ ] **Step 2:** Deploy Firebase Functions: `cd firebase && firebase deploy --only functions`
- [ ] **Step 3:** Configure webhook in Stripe Dashboard with the deployed function URL
- [ ] **Step 4:** Set webhook secret: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
- [ ] **Step 5:** Verify connected account status in Admin Panel
- [ ] **Step 6:** Test payment with test card `4242 4242 4242 4242`

## Testing Checklist

Before going live:

- [ ] All environment variables are set correctly
- [ ] Webhook endpoint is configured and receiving events
- [ ] Connected account is active and verified
- [ ] Test payments are working
- [ ] Orders are being created in Firebase
- [ ] Payment splits are working correctly
- [ ] Error handling is user-friendly
- [ ] No hardcoded secrets in code
- [ ] HTTPS is enabled
- [ ] Security rules are properly configured

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs
- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Firebase Functions Docs:** https://firebase.google.com/docs/functions
- **Test Cards:** https://stripe.com/docs/testing

---

**Last Updated:** Based on current codebase review
**Status:** Ready for completion - most infrastructure is in place



