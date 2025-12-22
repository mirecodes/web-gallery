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
      
      await updateDoc(docRef, { list: updatedList });
    } else {
      throw new Error(`Photo with id ${photoId} not found.`);
    }
  }
};

export const deletePhoto = async (photoId: string): Promise<{ deletedAlbumId?: string }> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error("Gallery data not found");
  
  const galleryData = docSnap.data() as GalleryDocument;
  const photoToDelete = galleryData.list.find(p => p.id === photoId);

  if (!photoToDelete) throw new Error("Photo not found");

  const updatedList = galleryData.list.filter(p => p.id !== photoId);
  
  let updatedAlbums = galleryData.albums;
  let deletedAlbumId: string | undefined;

  if (photoToDelete.albumId) {
    const remainingPhotosInAlbum = updatedList.filter(p => p.albumId === photoToDelete.albumId);
    if (remainingPhotosInAlbum.length === 0) {
      updatedAlbums = galleryData.albums.filter(a => a.id !== photoToDelete.albumId);
      deletedAlbumId = photoToDelete.albumId;
    }
  }

  await updateDoc(docRef, { list: updatedList, albums: updatedAlbums });

  try {
    await addDoc(collection(db, DELETED_PHOTOS_COLLECTION), {
      photoId: photoToDelete.id,
      url: photoToDelete.url,
      deletedAt: new Date().toISOString(),
      albumId: photoToDelete.albumId
    });
  } catch (e) {
    console.error("Failed to log deleted photo:", e);
  }

  return { deletedAlbumId };
};

export const updateAlbum = async (albumId: string, details: Partial<Album>): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const galleryData = docSnap.data() as GalleryDocument;
    const albumIndex = galleryData.albums.findIndex(a => a.id === albumId);

    if (albumIndex > -1) {
      const updatedAlbums = [...galleryData.albums];
      updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], ...details };
      await updateDoc(docRef, { albums: updatedAlbums });
    } else {
      throw new Error(`Album with id ${albumId} not found.`);
    }
  }
};

export const updateThemeName = async (oldTheme: string, newTheme: string): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const galleryData = docSnap.data() as GalleryDocument;
    const updatedAlbums = galleryData.albums.map(album => {
      if (album.theme === oldTheme) {
        return { ...album, theme: newTheme };
      }
      return album;
    });
    await updateDoc(docRef, { albums: updatedAlbums });
  }
};

export const deleteAlbum = async (albumId: string): Promise<void> => {
  const docRef = doc(db, GALLERY_COLLECTION, ALL_PHOTOS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const galleryData = docSnap.data() as GalleryDocument;
    
    // 1. Remove the album
    const updatedAlbums = galleryData.albums.filter(a => a.id !== albumId);
    
    // 2. Remove albumId from photos that belonged to this album
    const updatedList = galleryData.list.map(photo => {
      if (photo.albumId === albumId) {
        return { ...photo, albumId: '' };
      }
      return photo;
    });

    await updateDoc(docRef, { 
      albums: updatedAlbums,
      list: updatedList
    });
  }
};
