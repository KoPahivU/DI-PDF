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

