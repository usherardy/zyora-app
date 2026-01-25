import { storage, app } from './firebase';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { doc, deleteDoc, collection, getDocs, getFirestore, writeBatch } from 'firebase/firestore';

const db = getFirestore(app);

/**
 * Delete a single generated look
 */
export async function deleteLook(userId: string, look: any): Promise<void> {
    console.log('Deleting look:', look.id);

    try {
        // 1. Delete from Firebase Storage
        if (look.storagePath) {
            const storageRef = ref(storage, look.storagePath);
            try {
                await deleteObject(storageRef);
                console.log('Deleted from storage:', look.storagePath);
            } catch (storageError: any) {
                // Ignore if object not found (already deleted)
                if (storageError.code !== 'storage/object-not-found') {
                    console.error('Error deleting from storage:', storageError);
                    // Continue to delete from Firestore even if storage fails
                }
            }
        }

        // 2. Delete from Firestore
        if (look.firestoreId) {
            await deleteDoc(doc(db, 'users', userId, 'looks', look.firestoreId));
            console.log('Deleted from Firestore:', look.firestoreId);
        }

    } catch (error) {
        console.error('Error deleting look:', error);
        throw error;
    }
}

/**
 * Delete ALL generated looks for a user
 */
export async function deleteAllUserLooks(userId: string): Promise<void> {
    console.log('Deleting ALL looks for user:', userId);

    try {
        // 1. Fetch all looks from Firestore
        const looksRef = collection(db, 'users', userId, 'looks');
        const snapshot = await getDocs(looksRef);

        if (snapshot.empty) {
            console.log('No looks found to delete');
            return;
        }

        console.log(`Found ${snapshot.size} looks to delete`);

        // 2. Delete all files from Storage
        // We can list all files in the folder or use the paths from Firestore
        // Using paths from Firestore is safer to avoid deleting wrong files
        const deleteStoragePromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            if (data.storagePath) {
                const storageRef = ref(storage, data.storagePath);
                try {
                    await deleteObject(storageRef);
                } catch (e: any) {
                    if (e.code !== 'storage/object-not-found') {
                        console.warn('Failed to delete storage file:', data.storagePath, e);
                    }
                }
            }
        });

        await Promise.all(deleteStoragePromises);
        console.log('All storage files deleted');

        // 3. Delete all documents from Firestore (using batch)
        // Firestore batch limit is 500 operations
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All Firestore documents deleted');

    } catch (error) {
        console.error('Error deleting all looks:', error);
        throw error;
    }
}
