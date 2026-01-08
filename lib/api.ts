import { ENDPOINTS } from '@/constants';
import { GenerationResult } from '@/types';
import * as FileSystem from 'expo-file-system';

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

    // For React Native, we need to create temporary files and send them
    // Or we can send base64 directly if backend supports it
    // Let's try sending as FormData with proper file objects
    
    const formData = new FormData();
    
    // Convert base64 to blob-like object for React Native FormData
    // React Native FormData accepts objects with uri, type, name
    // But we need actual files, so let's create temp files first
    
    const userFileUri = `${FileSystem.cacheDirectory}user_${Date.now()}.jpg`;
    const fitFileUri = `${FileSystem.cacheDirectory}fit_${Date.now()}.jpg`;
    
    // Write base64 to files
    await FileSystem.writeAsStringAsync(userFileUri, cleanUserBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    await FileSystem.writeAsStringAsync(fitFileUri, cleanFitBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create FormData with file objects
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

    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(ENDPOINTS.GENERATE_LOOK, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Clean up temp files
    try {
      await FileSystem.deleteAsync(userFileUri, { idempotent: true });
      await FileSystem.deleteAsync(fitFileUri, { idempotent: true });
    } catch (e) {
      // Ignore cleanup errors
    }

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
 * Convert image URI to base64
 */
export async function uriToBase64(uri: string): Promise<string> {
  // If already base64, return as is
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }

  // For local file URIs, use FileSystem
  if (uri.startsWith('file://') || uri.startsWith('ph://') || uri.startsWith('assets-library://')) {
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

  // For remote URLs, fetch and convert
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
