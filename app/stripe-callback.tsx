import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { ENDPOINTS } from '@/constants';
import { addUserCredits, recordPayment, saveUserCredits } from '@/lib/firebase';

export default function StripeCallback() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user, updateQuota } = useAuthStore();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your purchase...');

    // Extract params - handle both direct and nested formats
    const session_id = params.session_id as string | undefined;
    const success = params.success as string | undefined;

    console.log('[StripeCallback] Mounted with params:', JSON.stringify(params));
    console.log('[StripeCallback] session_id:', session_id, 'success:', success);

    useEffect(() => {
        console.log('[StripeCallback] useEffect triggered');
        console.log('[StripeCallback] success:', success, 'session_id:', session_id);
        
        if (success === 'true' && session_id) {
            console.log('[StripeCallback] Verifying payment...');
            verifyPayment(session_id);
        } else if (session_id) {
            // Sometimes success param might be missing, try to verify anyway
            console.log('[StripeCallback] session_id present, verifying without success param...');
            verifyPayment(session_id);
        } else {
            console.log('[StripeCallback] No valid params, showing error');
            setStatus('error');
            setMessage('Payment was cancelled or failed.');
        }
    }, [session_id, success]);

    const verifyPayment = async (id: string) => {
        try {
            console.log('[StripeCallback] Fetching:', `${ENDPOINTS.VERIFY_CHECKOUT_SESSION}?session_id=${id}`);
            const response = await fetch(`${ENDPOINTS.VERIFY_CHECKOUT_SESSION}?session_id=${id}`);

            if (!response.ok) {
                console.error('[StripeCallback] Response not OK:', response.status);
                throw new Error('Failed to verify payment');
            }

            const data = await response.json();
            console.log('[StripeCallback] Verification response:', JSON.stringify(data));

            if (data.status === 'paid') {
                console.log('[StripeCallback] Payment verified! Quota to add:', data.quota);
                setStatus('success');
                setMessage('Thank you! Your generation credits have been added.');

                // Update local quota immediately for instant feedback
                const currentMaxQuota = user?.maxQuota || 5;
                const creditsToAdd = data.quota || 0;
                const newQuota = currentMaxQuota + creditsToAdd;
                console.log('[StripeCallback] Updating quota:', currentMaxQuota, '->', newQuota);
                updateQuota(newQuota);

                // Save to Firestore database for persistence
                if (user?.uid) {
                    try {
                        console.log('[StripeCallback] Saving to Firestore for user:', user.uid);
                        
                        // Record the payment
                        const paymentId = await recordPayment({
                            uid: user.uid,
                            sessionId: id,
                            planId: data.planId || 'unknown',
                            amount: 0,
                            quota: creditsToAdd,
                            status: 'paid',
                        });
                        console.log('[StripeCallback] Payment recorded with ID:', paymentId);

                        // Update user credits in Firestore (pass email for new user creation)
                        const creditsAdded = await addUserCredits(user.uid, creditsToAdd, user.email);
                        console.log('[StripeCallback] Credits added to Firestore:', creditsAdded);
                    } catch (dbError) {
                        console.error('[StripeCallback] Firestore save error:', dbError);
                        // Continue anyway - local storage has the update
                    }
                } else {
                    console.warn('[StripeCallback] No user UID available for Firestore save');
                }

                // Wait a moment before redirecting
                setTimeout(() => {
                    console.log('[StripeCallback] Redirecting to studio...');
                    router.replace('/(tabs)/studio');
                }, 2500);
            } else {
                console.log('[StripeCallback] Payment not paid, status:', data.status);
                setStatus('error');
                setMessage(`Payment status: ${data.status}`);
            }
        } catch (error) {
            console.error('[StripeCallback] Verify error:', error);
            setStatus('error');
            setMessage('Could not verify payment. Please contact support if you were charged.');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ padding: 24, alignItems: 'center', maxWidth: 320 }}>
                {status === 'verifying' && (
                    <>
                        <ActivityIndicator size="large" color="#000" style={{ marginBottom: 24 }} />
                        <Text style={{ fontSize: 18, fontWeight: '500', textAlign: 'center' }}>{message}</Text>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40, backgroundColor: '#DEF7EC',
                            justifyContent: 'center', alignItems: 'center', marginBottom: 24
                        }}>
                            <Ionicons name="checkmark" size={48} color="#03543F" />
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Success!</Text>
                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>{message}</Text>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40, backgroundColor: '#FDE8E8',
                            justifyContent: 'center', alignItems: 'center', marginBottom: 24
                        }}>
                            <Ionicons name="alert" size={48} color="#9B1C1C" />
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Something went wrong</Text>
                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>{message}</Text>

                        <TouchableOpacity
                            onPress={() => router.replace('/pricing')}
                            style={{
                                backgroundColor: '#000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8
                            }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.replace('/(tabs)/studio')}
                            style={{ marginTop: 16 }}
                        >
                            <Text style={{ color: '#666' }}>Return to Home</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}
