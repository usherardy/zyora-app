const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();

/* ===========================
   Environment Configuration
   =========================== */
const isDev = process.env.NODE_ENV !== 'production';

// API URL for Stripe redirects (must be http/https, not custom scheme)
// Stripe will redirect to our backend, which then redirects to the app via deep link
const getApiBaseUrl = (platform) => {
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
    }
    // For mobile in dev, use the machine's IP address so the device can reach it
    if (isDev && (platform === 'ios' || platform === 'android')) {
        return 'http://172.20.10.5:3000/';
    }
    return isDev ? 'http://localhost:3000/' : 'https://zyora-app1.vercel.app/';
};

// App URL for direct navigation (web only)
const getAppUrl = (platform) => {
    // For mobile apps, redirect through our API server which handles deep linking
    if (platform === 'ios' || platform === 'android') {
        return getApiBaseUrl(platform);
    }
    
    // For web, use APP_URL or default
    if (process.env.APP_URL) {
        return process.env.APP_URL;
    }
    
    // Default based on environment
    return isDev ? 'http://localhost:8081/' : 'https://zyora-app1.vercel.app/';
};

console.log(`[Config] Environment: ${isDev ? 'development' : 'production'}`);
console.log(`[Config] App URL: ${getAppUrl()}`);

/* ===========================
   Vertex AI Configuration
   =========================== */
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI = null;
let generativeModel = null;

// Initialize Vertex AI if credentials are available
if (GOOGLE_CLOUD_PROJECT) {
    try {
        vertexAI = new VertexAI({
            project: GOOGLE_CLOUD_PROJECT,
            location: GOOGLE_CLOUD_LOCATION,
        });
        
        // Use Gemini model for image understanding and generation
        generativeModel = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
        });
        
        console.log(`✅ Vertex AI initialized (Project: ${GOOGLE_CLOUD_PROJECT}, Location: ${GOOGLE_CLOUD_LOCATION})`);
    } catch (error) {
        console.error('⚠️ Failed to initialize Vertex AI:', error.message);
    }
} else {
    console.warn('⚠️ GOOGLE_CLOUD_PROJECT not set - Vertex AI disabled, using mock responses');
}

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
        const { planId, price, quota, userId, platform } = req.body;

        const appUrl = getAppUrl(platform);
        console.log(`[Stripe] Platform: ${platform || 'web'}, App URL: ${appUrl}`);
        
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
 * Verify Checkout (API endpoint for app to verify payment)
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
 * Stripe Callback Redirect Page
 * This page receives the Stripe redirect and opens the app via deep link
 */
app.get("/stripe-callback", (req, res) => {
    const { session_id, success, canceled } = req.query;
    
    console.log(`[Stripe Callback] Received: session_id=${session_id}, success=${success}, canceled=${canceled}`);
    
    // Build the deep link URLs
    const params = `session_id=${session_id || ''}&success=${success || 'true'}`;
    const deepLinkUrl = `zyora://stripe-callback?${params}`;
    // Android Intent URL for better Chrome support
    const intentUrl = `intent://stripe-callback?${params}#Intent;scheme=zyora;package=com.zyora.app;end`;
    
    // Send an HTML page that redirects to the app
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Zyora - Payment Complete</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #fff;
                    text-align: center;
                    padding: 20px;
                }
                .checkmark {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #DEF7EC;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                .checkmark svg {
                    width: 48px;
                    height: 48px;
                    color: #03543F;
                }
                h1 { font-size: 24px; margin: 0 0 8px; }
                p { color: #666; margin: 0 0 24px; }
                .btn {
                    background: #000;
                    color: #fff;
                    padding: 16px 32px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    margin: 8px;
                }
                .btn:hover { background: #333; }
                .auto-redirect { color: #999; font-size: 14px; margin-top: 16px; }
            </style>
        </head>
        <body>
            <div class="checkmark">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1>Payment Successful!</h1>
            <p>Your generation credits have been added.</p>
            <a href="${deepLinkUrl}" class="btn" id="openAppBtn">Open Zyora App</a>
            <p class="auto-redirect" id="status">Opening app...</p>
            
            <script>
                var isAndroid = /Android/i.test(navigator.userAgent);
                var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                var deepLink = "${deepLinkUrl}";
                var intentLink = "${intentUrl}";
                
                function openApp() {
                    if (isAndroid) {
                        // Try intent URL first for Android (works better with Chrome)
                        window.location.href = intentLink;
                    } else {
                        // Use regular deep link for iOS
                        window.location.href = deepLink;
                    }
                }
                
                // Update button href based on platform
                if (isAndroid) {
                    document.getElementById('openAppBtn').href = intentLink;
                }
                
                // Try to open app after a short delay
                setTimeout(openApp, 1000);
                
                // Update status after 3 seconds if still on page
                setTimeout(function() {
                    document.getElementById('status').textContent = 'Tap the button above to open the app';
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

/**
 * Generate Look - Virtual Try-On Endpoint
 * Accepts user image and clothing image, returns generated result using Vertex AI
 */
app.post("/generate-look", upload.fields([
    { name: 'userImgs', maxCount: 1 },
    { name: 'fitImg', maxCount: 1 }
]), async (req, res) => {
    console.log('[Generate Look] Request received');
    
    try {
        // Check if files were uploaded
        const userImg = req.files?.['userImgs']?.[0];
        const fitImg = req.files?.['fitImg']?.[0];
        
        if (!userImg || !fitImg) {
            console.log('[Generate Look] Missing images:', { userImg: !!userImg, fitImg: !!fitImg });
            return res.status(400).json({ 
                error: 'Both user image and fit image are required' 
            });
        }
        
        console.log('[Generate Look] Images received:', {
            userImg: { size: userImg.size, mimetype: userImg.mimetype },
            fitImg: { size: fitImg.size, mimetype: fitImg.mimetype }
        });
        
        // Convert images to base64
        const userImageBase64 = userImg.buffer.toString('base64');
        const fitImageBase64 = fitImg.buffer.toString('base64');
        
        let resultBase64;
        
        // Require Vertex AI for generation
        if (!generativeModel) {
            console.error('[Generate Look] Vertex AI not initialized');
            return res.status(503).json({ 
                error: 'AI service not available. Please check Vertex AI configuration.' 
            });
        }
        
        console.log('[Generate Look] Using Vertex AI for generation...');
        
        // Create the prompt for virtual try-on
        const prompt = `You are a virtual fashion try-on assistant. 

I am providing two images:
1. A photo of a person (user image)
2. A photo of a clothing item (garment image)

Please analyze both images and describe how the clothing would look on this person. 
Provide a detailed description of:
- How the garment would fit
- The overall style and look
- Any styling suggestions`;

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: userImg.mimetype || 'image/jpeg',
                                data: userImageBase64
                            }
                        },
                        {
                            inlineData: {
                                mimeType: fitImg.mimetype || 'image/jpeg',
                                data: fitImageBase64
                            }
                        }
                    ]
                }
            ]
        };

        const response = await generativeModel.generateContent(request);
        const textResponse = response.response.candidates[0].content.parts[0].text;
        
        console.log('[Generate Look] Vertex AI response received');
        console.log('[Generate Look] Analysis:', textResponse.substring(0, 200) + '...');
        
        // Return the user image with the AI analysis
        // TODO: Integrate with Imagen for actual image generation
        resultBase64 = userImageBase64;
        
        res.json({
            success: true,
            image: resultBase64,
            analysis: textResponse,
            message: 'Look analyzed successfully'
        });
        
    } catch (error) {
        console.error('[Generate Look] Error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate look' 
        });
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
