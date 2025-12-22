import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Photo, Album } from '../types';

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
const METADATA_DOC = 'metadata';
const PHOTO_CHUNKS_COLLECTION = 'photo_chunks';
const CHUNK_SIZE = 500;

interface Metadata {
  albums: Album[];
  photoChunkIds: string[];
}

interface PhotoChunk {
  id: string;
  data: Photo[];
}

// --- Fetch Data ---

export const getGalleryData = async (): Promise<{ photos: (Photo & { _chunkId: string })[], albums: Album[] }> => {
  const metadataRef = doc(db, GALLERY_COLLECTION, METADATA_DOC);
  const metadataSnap = await getDoc(metadataRef);

  if (!metadataSnap.exists()) {
    // Initialize metadata if not exists
    await setDoc(metadataRef, { albums: [], photoChunkIds: [] });
    return { photos: [], albums: [] };
  }

  const metadata = metadataSnap.data() as Metadata;
  const albums = metadata.albums || [];
  const chunkIds = metadata.photoChunkIds || [];

  if (chunkIds.length === 0) {
    return { photos: [], albums };
  }

  // Fetch all chunks in parallel
  const chunkPromises = chunkIds.map(async (chunkId) => {
    const chunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, chunkId);
    const chunkSnap = await getDoc(chunkRef);
    if (chunkSnap.exists()) {
      const data = (chunkSnap.data().data || []) as Photo[];
      // Attach chunkId to each photo for easier updates/deletions later
      return data.map(photo => ({ ...photo, _chunkId: chunkId }));
    }
    return [];
  });

  const chunks = await Promise.all(chunkPromises);
  const photos = chunks.flat();

  return { photos, albums };
};

// --- Photos ---

export const addPhoto = async (photo: Photo): Promise<string> => {
  const metadataRef = doc(db, GALLERY_COLLECTION, METADATA_DOC);
  const metadataSnap = await getDoc(metadataRef);
  let metadata = metadataSnap.data() as Metadata;

  if (!metadata) {
    metadata = { albums: [], photoChunkIds: [] };
    await setDoc(metadataRef, metadata);
  }

  let chunkIds = metadata.photoChunkIds || [];
  let targetChunkId = chunkIds.length > 0 ? chunkIds[chunkIds.length - 1] : null;
  let createNewChunk = false;

  if (!targetChunkId) {
    createNewChunk = true;
  } else {
    // Check if the last chunk is full
    const chunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, targetChunkId);
    const chunkSnap = await getDoc(chunkRef);
    if (chunkSnap.exists()) {
      const chunkData = chunkSnap.data().data || [];
      if (chunkData.length >= CHUNK_SIZE) {
        createNewChunk = true;
      }
    } else {
      // Should not happen, but if chunk is missing, create new one
      createNewChunk = true;
    }
  }

  if (createNewChunk) {
    targetChunkId = `chunk_${Date.now()}`;
    const newChunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, targetChunkId);
    await setDoc(newChunkRef, { data: [photo] });

    await updateDoc(metadataRef, {
      photoChunkIds: arrayUnion(targetChunkId)
    });
  } else {
    const chunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, targetChunkId!);
    await updateDoc(chunkRef, {
      data: arrayUnion(photo)
    });
  }

  return targetChunkId!;
};

export const updatePhoto = async (photoId: string, chunkId: string, details: Partial<Photo>): Promise<void> => {
  const chunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, chunkId);
  const chunkSnap = await getDoc(chunkRef);

  if (chunkSnap.exists()) {
    const chunkData = chunkSnap.data().data as Photo[];
    const photoIndex = chunkData.findIndex(p => p.id === photoId);

    if (photoIndex > -1) {
      const updatedList = [...chunkData];
      updatedList[photoIndex] = { ...updatedList[photoIndex], ...details };

      await updateDoc(chunkRef, { data: updatedList });
    } else {
      throw new Error(`Photo with id ${photoId} not found in chunk ${chunkId}.`);
    }
  }
};

export const deletePhoto = async (photoId: string, chunkId: string): Promise<{ deletedAlbumId?: string }> => {
  const chunkRef = doc(db, GALLERY_COLLECTION, METADATA_DOC, PHOTO_CHUNKS_COLLECTION, chunkId);
  const chunkSnap = await getDoc(chunkRef);

  if (!chunkSnap.exists()) throw new Error("Chunk not found");

  const chunkData = chunkSnap.data().data as Photo[];
  const photoToDelete = chunkData.find(p => p.id === photoId);

  if (!photoToDelete) throw new Error("Photo not found");

  // 1. Remove photo from chunk
  const updatedList = chunkData.filter(p => p.id !== photoId);
  await updateDoc(chunkRef, { data: updatedList });

  // 2. Check if album needs to be deleted (This requires fetching all photos, which is expensive.
  // Instead, we will rely on the client-side state in useGallery to determine if an album is empty)
  // For now, we just return undefined for deletedAlbumId and handle album cleanup in useGallery.

  return { deletedAlbumId: undefined };
};

// --- Albums ---

export const addAlbum = async (album: Album): Promise<void> => {
  const metadataRef = doc(db, GALLERY_COLLECTION, METADATA_DOC);
  await updateDoc(metadataRef, {
    albums: arrayUnion(album)
  });
};

export const updateAlbum = async (albumId: string, details: Partial<Album>): Promise<void> => {
  const metadataRef = doc(db, GALLERY_COLLECTION, METADATA_DOC);
  const metadataSnap = await getDoc(metadataRef);

  if (metadataSnap.exists()) {
    const metadata = metadataSnap.data() as Metadata;
    const albumIndex = metadata.albums.findIndex(a => a.id === albumId);

    if (albumIndex > -1) {
      const updatedAlbums = [...metadata.albums];
      updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], ...details };
      await updateDoc(metadataRef, { albums: updatedAlbums });
    }
  }
};

export const deleteAlbum = async (albumId: string): Promise<void> => {
  const metadataRef = doc(db, GALLERY_COLLECTION, METADATA_DOC);
  const metadataSnap = await getDoc(metadataRef);

  if (metadataSnap.exists()) {
    const metadata = metadataSnap.data() as Metadata;
    const updatedAlbums = metadata.albums.filter(a => a.id !== albumId);
    await updateDoc(metadataRef, { albums: updatedAlbums });
  }
};

// Helper to log deleted photos
export const logDeletedPhoto = async (photo: Photo): Promise<void> => {
  // We can keep using a separate collection for logs as it doesn't impact the main gallery read cost
  await addDoc(collection(db, DELETED_PHOTOS_COLLECTION), {
    photoId: photo.id,
    url: photo.url,
    deletedAt: new Date().toISOString(),
    albumId: photo.albumId
  });
};
