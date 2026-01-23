const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

/* ===========================
   Environment Configuration
   =========================== */
const isDev = process.env.NODE_ENV !== 'production';

// App URL for Stripe redirects
// Development: Use localhost for web testing
// Production: Use app deep link scheme
const getAppUrl = () => {
    if (process.env.APP_URL) {
        return process.env.APP_URL;
    }
    // Default based on environment
    return isDev ? 'http://localhost:8000/' : 'zyora://';
};

console.log(`[Config] Environment: ${isDev ? 'development' : 'production'}`);
console.log(`[Config] App URL: ${getAppUrl()}`);

/* ===========================
   CORS Preflight Handler
   =========================== */
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

/* ===========================
   Normal CORS middleware
   =========================== */
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/* ===========================
   Stripe Initialization
   =========================== */
let stripe;
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("⚠️  CRITICAL: STRIPE_SECRET_KEY is missing from environment variables");
    console.error("   Please add STRIPE_SECRET_KEY to your .env file");
    console.error("   Get your key from: https://dashboard.stripe.com/apikeys");
} else {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    console.log(`✅ Stripe initialized (${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode)`);
}

/**
 * Health Check
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        stripeInitialized: !!stripe,
        stripeMode: stripe ? (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test') : null,
        env: process.env.NODE_ENV || 'development',
        appUrl: getAppUrl(),
    });
});

/**
 * Create Checkout Session
 */
app.post("/create-checkout-session", async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ error: "Stripe not initialized" });
    }

    try {
        const { planId, price, quota, userId } = req.body;

        const appUrl = getAppUrl();
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Zyora ${planId.toUpperCase()} Pack`,
                        description: `${quota} generations credit pack`,
                    },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: `${appUrl}stripe-callback?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${appUrl}pricing?canceled=true`,
            client_reference_id: userId,
            metadata: {
                planId,
                quota: quota.toString(),
                userId,
            },
        });
        
        console.log(`[Stripe] Checkout session created: ${session.id}`);
        console.log(`[Stripe] Success URL: ${appUrl}stripe-callback?session_id=...`);

        res.json({ url: session.url });
    } catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Verify Checkout
 */
app.get("/verify-checkout-session", async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ error: "Stripe not initialized" });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

        if (session.payment_status === "paid") {
            res.json({
                status: "paid",
                planId: session.metadata.planId,
                quota: parseInt(session.metadata.quota),
                userId: session.metadata.userId
            });
        } else {
            res.json({ status: session.payment_status });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Export for Vercel
 */
module.exports = app;

// Only listen if running locally
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Local server running on port ${PORT}`);
    });
}
