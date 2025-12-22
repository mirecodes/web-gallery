import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from 'firebase/firestore';
import { Photo, Album, GalleryDocument } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GALLERY_COLLECTION = 'gallery';
const ALL_PHOTOS_DOC = 'all_photos';
const DELETED_PHOTOS_COLLECTION = 'deleted_photos';

export const getGalleryData = async (): Promise<GalleryDocument> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as Partial<GalleryDocument>;
    return {
      list: data.list || [],
      albums: data.albums || []
    };
  } else {
    return { list: [], albums: [] };
  }
};

export const addPhoto = async (photo: Photo): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  await updateDoc(docRef, {
    list: arrayUnion(photo)
  });
};

export const addAlbum = async (album: Album): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  await updateDoc(docRef, {
    albums: arrayUnion(album)
  });
};

export const updatePhoto = async (photoId: string, details: Partial<Photo>): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const galleryData = docSnap.data() as GalleryDocument;
    const photoIndex = galleryData.list.findIndex(p => p.id === photoId);

    if (photoIndex > -1) {
      const updatedList = [...galleryData.list];
      updatedList[photoIndex] = { ...updatedList[photoIndex], ...details };
      
      await updateDoc(docRef, {
        list: updatedList
      });
    } else {
      throw new Error(`Photo with id ${photoId} not found.`);
    }
  }
};

export const deletePhoto = async (photoId: string): Promise<{ deletedAlbumId?: string }> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Gallery data not found");
  }

  const galleryData = docSnap.data() as GalleryDocument;
  const photoToDelete = galleryData.list.find(p => p.id === photoId);

  if (!photoToDelete) {
    throw new Error("Photo not found");
  }

  // 1. Remove photo from list
  const updatedList = galleryData.list.filter(p => p.id !== photoId);
  
  // 2. Check if album needs to be deleted
  let updatedAlbums = galleryData.albums;
  let deletedAlbumId: string | undefined;

  if (photoToDelete.albumId) {
    const remainingPhotosInAlbum = updatedList.filter(p => p.albumId === photoToDelete.albumId);
    if (remainingPhotosInAlbum.length === 0) {
      updatedAlbums = galleryData.albums.filter(a => a.id !== photoToDelete.albumId);
      deletedAlbumId = photoToDelete.albumId;
    }
  }

  // 3. Update Firestore
  await updateDoc(docRef, {
    list: updatedList,
    albums: updatedAlbums
  });

  // 4. Log deletion for Cloudinary cleanup
  try {
    await addDoc(collection(db, DELETED_PHOTOS_COLLECTION), {
      photoId: photoToDelete.id,
      url: photoToDelete.url,
      deletedAt: new Date().toISOString(),
      albumId: photoToDelete.albumId
    });
  } catch (e) {
    console.error("Failed to log deleted photo:", e);
    // Don't throw here, as the main deletion was successful
  }

  return { deletedAlbumId };
};
