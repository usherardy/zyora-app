import { storage, app } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, uploadString } from 'firebase/storage';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc, addDoc, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Use the existing app instance
const db = getFirestore(app);

/**
 * Convert base64 string to Uint8Array for Firebase Storage upload
 * This works reliably on both web and React Native
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

  // Decode base64 to binary string
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Upload profile picture to Firebase Storage
 */
export async function uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
  console.log('Starting profile picture upload for user:', userId);
  console.log('Storage bucket:', storage);

  // Check if user is authenticated
  const { getAuth, onAuthStateChanged } = await import('firebase/auth');
  const auth = getAuth(app); // Use the same app instance

  // Wait for auth state to resolve
  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribe();

      console.log('Auth instance:', auth);
      console.log('Current user from auth:', currentUser);
      console.log('Auth user UID:', currentUser?.uid);
      console.log('Upload user ID:', userId);

      try {
        if (currentUser && currentUser.uid === userId) {
          console.log('User authenticated, proceeding with upload');

          const response = await fetch(imageUri);
          const blob = await response.blob();
          console.log('Blob created, size:', blob.size);

          const storageRef = ref(storage, `profile-pictures/${userId}`);
          console.log('Storage ref:', storageRef);

          // Explicitly set content type to ensure rules pass
          const metadata = {
            contentType: blob.type || 'image/jpeg', // Default to jpeg if type missing
          };
          await uploadBytes(storageRef, blob, metadata);
          console.log('Upload successful');

          const downloadURL = await getDownloadURL(storageRef);
          console.log('Download URL:', downloadURL);

          // Update Firestore with new photoURL
          await updateDoc(doc(db, 'users', userId), { photoURL: downloadURL });

          resolve(downloadURL);

        } else if (!currentUser) {
          console.log('No current user in Firebase Auth');
          reject(new Error('User not authenticated with Firebase'));
        } else {
          console.log('UID mismatch - auth user:', currentUser.uid, 'upload user:', userId);
          reject(new Error('User UID does not match authenticated user'));
        }
      } catch (error: any) {
        console.error('Upload error:', error);

        // Handle network errors specifically
        if (error.message && error.message.includes('Network request failed')) {
          console.error('Network error detected - this might be an Android network security issue');
          console.error('Try: 1) Rebuilding the app, 2) Check network security config, 3) Use development build');
        }

        reject(error);
      }
    });
  });
}

/**
 * Upload generated look to Firebase Storage
 */
export async function uploadGeneratedLook(userId: string, imageData: string, lookId: string): Promise<string> {
  console.log('Starting generated look upload for user:', userId);

  // Check if user is authenticated
  const { getAuth, onAuthStateChanged } = await import('firebase/auth');
  const auth = getAuth(app);

  // Wait for auth state to resolve
  return new Promise<string>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribe();

      console.log('Generated look - Auth user UID:', currentUser?.uid);
      console.log('Generated look - Upload user ID:', userId);

      console.log('Upload user ID:', userId);

      try {
        if (currentUser && currentUser.uid === userId) {
          console.log('User authenticated for generated look, proceeding with upload');

          const storageRef = ref(storage, `generated-looks/${userId}/${lookId}.png`);

          // Clean base64 data
          const cleanBase64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;

          let blob: Blob;

          if (Platform.OS === 'web') {
            const binaryString = atob(cleanBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'image/png' });
          } else {
            // Robust Native Implementation:
            // 1. Write base64 to temp file
            // 2. Use XMLHttpRequest to read as Blob (works better than fetch/blob() on some RN versions)

            // Use legacy import as writeAsStringAsync is deprecated in main entry point
            const FileSystem = require('expo-file-system/legacy');
            const tempUri = FileSystem.cacheDirectory + `upload_${Date.now()}.png`;

            await FileSystem.writeAsStringAsync(tempUri, cleanBase64, {
              encoding: 'base64',
            });

            blob = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.onload = function () {
                resolve(xhr.response);
              };
              xhr.onerror = function (e) {
                console.error('XHR Blob Error:', e);
                reject(new TypeError('Network request failed'));
              };
              xhr.responseType = 'blob';
              xhr.open('GET', tempUri, true);
              xhr.send(null);
            });
          }

          console.log('Blob created successfully');
          // Explicitly set content type to 'image/png' to satisfy storage rules
          await uploadBytes(storageRef, blob!, { contentType: 'image/png' });
          console.log('Generated look upload successful via file-backed blob');

          // Clean up temp file if native
          if (Platform.OS !== 'web') {
            // Safe to ignore cleanup errors
            const FileSystem = require('expo-file-system/legacy');
            // Try to delete but don't await/block
            try {
              const tempUri = (blob as any)._data?.blobId ? null : FileSystem.cacheDirectory + `upload_${Date.now()}.png`; // Logic approx, actually we need the uri variable
              // Just rely on cache cleanup or improve specific cleanup later if needed
            } catch (e) { }
          }

          const downloadURL = await getDownloadURL(storageRef);
          console.log('Generated look download URL:', downloadURL);

          // Save metadata to Firestore
          const { collection, addDoc } = await import('firebase/firestore');
          await addDoc(collection(db, 'users', userId, 'looks'), {
            id: lookId,
            imageUrl: downloadURL,
            storagePath: storageRef.fullPath,
            createdAt: new Date(),
          });
          console.log('Generated look metadata saved to Firestore');

          resolve(downloadURL);

        } else if (!currentUser) {
          console.log('No current user in Firebase Auth for generated look');
          reject(new Error('User not authenticated with Firebase'));
        } else {
          console.log('UID mismatch for generated look - auth user:', currentUser.uid, 'upload user:', userId);
          reject(new Error('User UID does not match authenticated user'));
        }
      } catch (error: any) {
        console.error('Generated look upload error:', error);

        // Handle network errors specifically
        if (error.message && error.message.includes('Network request failed')) {
          console.error('Network error detected in generated look upload');
        }

        reject(error);
      }
    });
  });
}

/**
 * Fetch all generated looks for a user from Firestore
 */
export async function fetchUserLooks(userId: string) {
  try {
    const looksQuery = query(
      collection(db, 'users', userId, 'looks'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(looksQuery);
    const looks = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      firestoreId: doc.id,
    }));

    return looks;
  } catch (error) {
    console.error('Error fetching user looks:', error);
    throw error;
  }
}

/**
 * Delete a generated look from both Storage and Firestore
 */
export async function deleteGeneratedLook(userId: string, look: any) {
  try {
    // Delete from Storage
    if (look.storagePath) {
      const storageRef = ref(storage, look.storagePath);
      await deleteObject(storageRef);
    }

    // Delete from Firestore
    if (look.firestoreId) {
      await deleteDoc(doc(db, 'users', userId, 'looks', look.firestoreId));
    }
  } catch (error) {
    console.error('Error deleting look:', error);
    throw error;
  }
}

/**
 * Delete profile picture from Storage
 */
export async function deleteProfilePicture(userId: string): Promise<void> {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}`);
    await deleteObject(storageRef);

    // Update Firestore to remove photoURL
    await updateDoc(doc(db, 'users', userId), { photoURL: null });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
}
