import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Linking } from 'react-native';

// Get platform for backend to determine redirect URL
const getPlatformName = () => {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web';
};
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { ENDPOINTS } from '@/constants';

const PLANS = [
    {
        id: 'starter',
        name: 'Capsule Collection',
        price: 4.99,
        generated: '+10 GENERATIONS',
        quota: 10,
        features: [],
        primary: true,
    },
    {
        id: 'pro',
        name: 'Studio Collection',
        price: 39.99,
        generated: '+60 GENERATIONS', // Bumped to 100 for better value proposition at $40
        quota: 60,
        features: [],
        primary: false,
    },
];

export default function PricingScreen() {
    const router = useRouter();
    const { user, updateQuota } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>('starter');

    const handlePurchase = async (plan: typeof PLANS[0]) => {

        setLoading(true);
        setSelectedPlan(plan.id);

        try {
            console.log(`[Pricing] Creating checkout session for plan: ${plan.id}`);
            console.log(`[Pricing] API URL: ${ENDPOINTS.CREATE_CHECKOUT_SESSION}`);
            
            // Create checkout session on backend
            const response = await fetch(ENDPOINTS.CREATE_CHECKOUT_SESSION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: plan.id,
                    price: plan.price,
                    quota: plan.quota,
                    userId: user?.uid,
                    platform: getPlatformName(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Pricing] Checkout session error:', errorData);
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const data = await response.json();
            const { url } = data;
            
            console.log(`[Pricing] Checkout URL received: ${url}`);

            if (!url) {
                throw new Error('No checkout URL received from server');
            }

            // Open Stripe Checkout in browser
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback: try opening anyway (works on some platforms)
                await Linking.openURL(url);
            }
        } catch (error: any) {
            console.error('[Pricing] Error:', error);
            Alert.alert(
                'Payment Error', 
                error.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={{
                    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                    fontSize: 20,
                    marginLeft: 16,
                    fontWeight: 'bold'
                }}>
                    Get More Generations
                    Secure Checkout
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                <Text style={{ fontSize: 16, color: '#666', marginBottom: 32, lineHeight: 24 }}>
                    Unlock more generations to expand your virtual portfolio. Choose a pass that suits your creative volume.
                </Text>

                <View style={{ gap: 24 }}>
                    {PLANS.map((plan) => (
                        <TouchableOpacity
                            key={plan.id}
                            activeOpacity={0.9}
                            onPress={() => setSelectedPlan(plan.id)}
                            disabled={loading}
                            style={{
                                backgroundColor: '#FAFAFA',
                                borderRadius: 16,
                                padding: 24,
                                borderWidth: selectedPlan === plan.id ? 2 : 1,
                                borderColor: selectedPlan === plan.id ? '#000' : '#E5E5E5',
                                opacity: loading && selectedPlan !== plan.id ? 0.5 : 1,
                                height: 160,
                                justifyContent: 'space-between'
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{
                                    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                                    fontSize: 24,
                                    color: '#000',
                                    fontWeight: '500'
                                }}>
                                    {plan.name}
                                </Text>
                                {selectedPlan === plan.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                                )}
                            </View>

                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
                                    <Text style={{
                                        fontSize: 32,
                                        fontWeight: 'bold',
                                        color: '#000',
                                    }}>
                                        ${plan.price}
                                    </Text>
                                    <Text style={{ color: '#666', fontSize: 14, marginLeft: 8 }}>/ one-time</Text>
                                </View>
                                <Text style={{
                                    color: '#666',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase'
                                }}>
                                    {plan.generated}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Pay Button */}
                <View style={{ marginTop: 40 }}>
                    <TouchableOpacity
                        onPress={() => {
                            const plan = PLANS.find(p => p.id === selectedPlan);
                            if (plan) handlePurchase(plan);
                        }}
                        disabled={loading || !selectedPlan}
                        style={{
                            backgroundColor: '#000',
                            paddingVertical: 18,
                            borderRadius: 8,
                            alignItems: 'center',
                            opacity: !selectedPlan || loading ? 0.5 : 1
                        }}
                    >
                        <Text style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 14,
                            letterSpacing: 2,
                            textTransform: 'uppercase'
                        }}>
                            {loading ? 'PROCESSING...' : selectedPlan ? `PAY $${PLANS.find(p => p.id === selectedPlan)?.price}` : 'SELECT A PLAN'}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 }}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#D1D5DB" />
                        <Text style={{ textAlign: 'center', color: '#D1D5DB', fontSize: 10 }}>
                            Encrypted by Stripe. Powered by Zyora.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
