const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

/* ===========================
   Firebase Admin Initialization
   =========================== */
let db = null;
try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
        db = admin.firestore();
        console.log('✅ Firebase Admin initialized');
    } else {
        console.warn('⚠️ Firebase service account not found - database features disabled');
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
}

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
 * Update User Profile (including quota)
 */
app.post("/update-profile", async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
    }

    try {
        const { userId, quota, displayName, photoURL } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const updateData = {};
        if (quota !== undefined) updateData.quota = quota;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (photoURL !== undefined) updateData.photoURL = photoURL;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('users').doc(userId).set(updateData, { merge: true });

        console.log(`[Profile] Updated user ${userId}:`, updateData);
        res.json({ success: true, userId, ...updateData });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Get User Credits
 */
app.get("/get-user-credits", async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            // Return default values for new users
            return res.json({
                quota: 0,
                maxQuota: 5,
                currentPlan: 'free',
            });
        }

        const userData = userDoc.data();
        res.json({
            quota: userData.quota || 0,
            maxQuota: userData.maxQuota || 5,
            currentPlan: userData.currentPlan || 'free',
            displayName: userData.displayName || null,
            photoURL: userData.photoURL || null,
            email: userData.email || null,
        });
    } catch (err) {
        console.error("Get user credits error:", err);
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
