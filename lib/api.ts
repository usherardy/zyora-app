import { ENDPOINTS } from '@/constants';
import { GenerationResult } from '@/types';
import { Platform } from 'react-native';

// Conditionally import FileSystem only for native platforms
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system/legacy');
}

/**
 * Convert base64 to Blob (for web)
 */
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Generate a virtual try-on look using the backend Vertex AI service
 */
export async function generateLook(
  userImageBase64: string,
  fitImageBase64: string,
  authToken?: string
): Promise<GenerationResult> {
  try {
    // Remove data URL prefix if present
    const cleanUserBase64 = userImageBase64.includes(',') ? userImageBase64.split(',')[1] : userImageBase64;
    const cleanFitBase64 = fitImageBase64.includes(',') ? fitImageBase64.split(',')[1] : fitImageBase64;

    const formData = new FormData();
    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (Platform.OS === 'web') {
      // Web: Convert base64 to Blob and append to FormData
      const userBlob = base64ToBlob(cleanUserBase64);
      const fitBlob = base64ToBlob(cleanFitBase64);
      
      formData.append('userImgs', userBlob, 'user.jpg');
      formData.append('fitImg', fitBlob, 'fit.jpg');
    } else {
      // Native: Create temp files and send as file URIs
      const userFileUri = `${FileSystem.cacheDirectory}user_${Date.now()}.jpg`;
      const fitFileUri = `${FileSystem.cacheDirectory}fit_${Date.now()}.jpg`;

      await FileSystem.writeAsStringAsync(userFileUri, cleanUserBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(fitFileUri, cleanFitBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      formData.append('userImgs', {
        uri: userFileUri,
        type: 'image/jpeg',
        name: 'user.jpg',
      } as any);

      formData.append('fitImg', {
        uri: fitFileUri,
        type: 'image/jpeg',
        name: 'fit.jpg',
      } as any);

      // Clean up temp files after request
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(userFileUri, { idempotent: true });
          await FileSystem.deleteAsync(fitFileUri, { idempotent: true });
        } catch (e) {
          // Ignore cleanup errors
        }
      }, 5000);
    }

    const response = await fetch(ENDPOINTS.GENERATE_LOOK, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to generate look' };
      }
      throw new Error(errorData.error || 'Failed to generate look');
    }

    const data = await response.json();

    if (!data.image) {
      throw new Error('No image returned from server');
    }

    return {
      success: true,
      image: `data:image/png;base64,${data.image}`,
    };
  } catch (error: any) {
    console.error('Generate look error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate look',
    };
  }
}

/**
 * Fetch an image from URL through the backend proxy (to avoid CORS)
 */
export async function fetchImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${ENDPOINTS.FETCH_IMAGE}?url=${encodeURIComponent(imageUrl)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Fetch image error:', error);
    return null;
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(ENDPOINTS.HEALTH);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Create a Stripe Payment Intent
 */
export async function createPaymentIntent(amount: number, currency: string = 'usd'): Promise<{ clientSecret: string } | null> {
  try {
    // In a real app, you would pass auth token here
    // For now, we'll mock the response if the backend isn't ready, OR try to hit the endpoint
    // Assuming backend endpoint exists: POST /create-payment-intent { amount, currency }

    // MOCK RESPONSE FOR DEVELOPMENT (remove when backend is ready)
    // return { clientSecret: 'pi_mock_secret_123' };

    const response = await fetch(ENDPOINTS.CREATE_PAYMENT_INTENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create payment intent error:', error);
    return null;
  }
}

/**
 * Convert image URI to base64
 */
export async function uriToBase64(uri: string): Promise<string> {
  // If already base64, return as is
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }

  // For local file URIs on native, use FileSystem
  if (Platform.OS !== 'web' && (uri.startsWith('file://') || uri.startsWith('ph://') || uri.startsWith('assets-library://'))) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error('Failed to read image file');
    }
  }

  // For web blob URLs or remote URLs, fetch and convert
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching remote image:', error);
    throw new Error('Failed to fetch image from URL');
  }
}
