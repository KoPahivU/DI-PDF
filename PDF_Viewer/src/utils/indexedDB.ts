import { openDB } from 'idb';

const DB_NAME = 'pdfStorage';
const STORE_NAME = 'pdfFiles';

type StoredPDFData = {
  id: string;
  file: Blob;
  fileName: string;
  xfdf: string;
};

export const initDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const savePDFWithAnnotations = async (id: string, file: Blob, fileName: string, xfdf: string) => {
  const db = await initDB();
  const data: StoredPDFData = { id, file, fileName, xfdf };
  await db.put(STORE_NAME, data, id); // dùng `id` làm key
};

export const getPDFWithAnnotations = async (id: string): Promise<StoredPDFData | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const updateXFDF = async (id: string, xfdf: string): Promise<void> => {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);

  if (!existing) {
    throw new Error(`PDF with id "${id}" not found`);
  }

  const updated = { ...existing, xfdf };
  await db.put(STORE_NAME, updated, id);
};

export const deletePDF = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {}
};
