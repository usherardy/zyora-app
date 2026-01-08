import { View, Text, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does virtual try-on work?',
    answer: 'ZYORA uses advanced AI (Google Vertex AI) to seamlessly blend your photo with the garment image, creating a realistic visualization of how the outfit would look on you.',
  },
  {
    question: 'What type of photos work best?',
    answer: 'For best results, use a full-body photo with good lighting and a plain background. The subject should be clearly visible and facing forward.',
  },
  {
    question: 'Why is my generation taking long?',
    answer: 'Generation time depends on server load and image complexity. Typically, it takes 15-30 seconds. If it takes longer, try again with a smaller image.',
  },
  {
    question: 'How do I get more generations?',
    answer: 'Free users get 10 generations per month. Upgrade to Premium for unlimited generations and additional features.',
  },
  {
    question: 'Can I use product images from websites?',
    answer: 'Yes! You can paste a direct image URL from any online store. Make sure the URL ends with an image extension or is a direct link to the image.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@zyora.app?subject=Help%20Request');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://zyora.app');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.05)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 24, color: '#000' }}>
            Help & Support
          </Text>
          <Text style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 }}>
            FAQs and Contact
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={{ padding: 24, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={handleContactSupport}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: '#000',
              padding: 20,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="mail-outline" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Email Us
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleOpenWebsite}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: '#F9FAFB',
              padding: 20,
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Ionicons name="globe-outline" size={24} color="#000" />
            <Text style={{ color: '#000', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Website
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
            Frequently Asked Questions
          </Text>

          {faqs.map((faq, index) => (
            <View
              key={index}
              style={{
                backgroundColor: '#F9FAFB',
                padding: 20,
                marginBottom: 12,
                borderLeftWidth: 2,
                borderLeftColor: '#000',
              }}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                {faq.question}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 20 }}>
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        {/* Legal Links */}
        <View style={{ padding: 24, paddingTop: 32 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
            Legal
          </Text>

          <View style={{ backgroundColor: '#F9FAFB' }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}
            >
              <Text style={{ color: '#000', fontSize: 14 }}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}
            >
              <Text style={{ color: '#000', fontSize: 14 }}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 16,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ color: '#000', fontSize: 14 }}>Open Source Licenses</Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ color: '#D1D5DB', fontSize: 10, letterSpacing: 2 }}>
            ZYORA INC. © 2024
          </Text>
          <Text style={{ color: '#D1D5DB', fontSize: 9, marginTop: 4 }}>
            Made with ♥ for fashion
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

