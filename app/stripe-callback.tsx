import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { ENDPOINTS } from '@/constants';

export default function StripeCallback() {
    const { session_id, success } = useLocalSearchParams();
    const router = useRouter();
    const { user, refreshCredits } = useAuthStore();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your purchase...');

    useEffect(() => {
        if (success === 'true' && session_id) {
            verifyPayment(session_id as string);
        } else {
            setStatus('error');
            setMessage('Payment was cancelled or failed.');
        }
    }, [session_id, success]);

    const verifyPayment = async (id: string) => {
        try {
            const response = await fetch(`${ENDPOINTS.VERIFY_CHECKOUT_SESSION}?session_id=${id}`);

            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }

            const data = await response.json();

            if (data.status === 'paid') {
                setStatus('success');
                setMessage('Thank you! Your generation credits have been added.');

                // Refresh credits from backend to get updated quota
                await refreshCredits();

                // Wait a moment before redirecting
                setTimeout(() => {
                    router.replace('/(tabs)/studio');
                }, 2500);
            } else {
                setStatus('error');
                setMessage(`Payment status: ${data.status}`);
            }
        } catch (error) {
            console.error('Verify error:', error);
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
