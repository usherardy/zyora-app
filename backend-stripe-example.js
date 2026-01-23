// Backend example for Stripe integration with Zyora App
// This file shows how to implement the required endpoints
// Install: npm install stripe express cors dotenv

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();
app.use(cors());
app.use(express.json());

// Your existing endpoints...
// app.post('/generate-look', ...);
// app.get('/fetch-image', ...);
// app.get('/health', ...);

/**
 * Create a Stripe Checkout Session for one-time payment
 * This creates a credit pack purchase (not a subscription)
 */
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { planId, price, quota, userId } = req.body;

        // Create Stripe Checkout Session for one-time payment
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Zyora ${planId.toUpperCase()} Pack`,
                            description: `${quota} generations credit pack`,
                        },
                        unit_amount: Math.round(price * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // One-time payment, not subscription
            success_url: `${process.env.APP_URL || 'localhost:8081'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.APP_URL || 'localhost:8081'}?canceled=true`,
            client_reference_id: userId, // Store user ID for webhook
            metadata: {
                planId,
                quota: quota.toString(),
                userId,
            },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Alternative: Create Payment Intent (for one-time payments)
 * Use this if you want one-time purchases instead of subscriptions
 */
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in cents
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Stripe Webhook Handler
 * CRITICAL: This handles successful payments and updates user quota
 * Configure webhook in Stripe Dashboard to point to this endpoint
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;

            // Extract user info and plan details
            const userId = session.client_reference_id || session.metadata.userId;
            const quota = parseInt(session.metadata.quota);
            const planId = session.metadata.planId;

            console.log(`Payment successful for user ${userId}, plan: ${planId}, quota: ${quota}`);

            // TODO: Update user quota in your database
            // For one-time purchases, ADD to existing quota instead of replacing
            // Example with Firebase:
            // const userRef = admin.firestore().collection('users').doc(userId);
            // const userDoc = await userRef.get();
            // const currentQuota = userDoc.data()?.maxQuota || 5;
            // await userRef.update({
            //   maxQuota: currentQuota + quota,
            //   purchaseHistory: admin.firestore.FieldValue.arrayUnion({
            //     planId,
            //     quota,
            //     purchasedAt: new Date().toISOString(),
            //     sessionId: session.id,
            //   }),
            // });

            break;

        case 'customer.subscription.deleted':
            // Handle subscription cancellation (not needed for one-time payments)
            const subscription = event.data.object;
            console.log('Subscription canceled:', subscription.id);

            break;

        case 'invoice.payment_failed':
            // Handle failed payment
            const invoice = event.data.object;
            console.log('Payment failed:', invoice.id);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

/**
 * Check if user has quota available
 * Call this before generating a look
 */
app.post('/check-quota', async (req, res) => {
    try {
        const { userId } = req.body;

        // TODO: Get user from database
        // const user = await getUserFromDatabase(userId);

        // Mock response for now
        const user = {
            quota: 3,
            maxQuota: 5,
        };

        const hasQuota = user.quota < user.maxQuota;

        res.json({
            hasQuota,
            remaining: user.maxQuota - user.quota,
            quota: user.quota,
            maxQuota: user.maxQuota,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Environment Variables needed:
 * 
 * STRIPE_SECRET_KEY=sk_test_...
 * STRIPE_WEBHOOK_SECRET=whsec_...
 * APP_URL=zyora:// (or your custom URL scheme)
 */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Stripe endpoints ready:');
    console.log('- POST /create-checkout-session');
    console.log('- POST /create-payment-intent');
    console.log('- POST /webhook (configure in Stripe Dashboard)');
    console.log('- POST /check-quota');
});

module.exports = app;
