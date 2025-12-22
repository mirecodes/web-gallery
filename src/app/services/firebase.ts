import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
