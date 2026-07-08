import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/src/constants/collections';
import { db } from '@/src/services/firebase';

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
) {
  const documentRef = await addDoc(collection(db, collectionName), data);
  return documentRef.id;
}

export async function setDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T,
  merge = true,
) {
  await setDoc(doc(db, collectionName, documentId), data, { merge });
}

export async function getDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
) {
  const snapshot = await getDoc(doc(db, collectionName, documentId));

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...(snapshot.data() as T) };
}

export async function updateDocument(
  collectionName: string,
  documentId: string,
  data: DocumentData,
) {
  await updateDoc(doc(db, collectionName, documentId), data);
}

export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
) {
  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as T),
  }));
}

export async function getUserProfile<T extends DocumentData>(userId: string) {
  return getDocument<T>(FIRESTORE_COLLECTIONS.users, userId);
}

export async function saveUserProfile<T extends DocumentData>(userId: string, data: T) {
  await setDocument(FIRESTORE_COLLECTIONS.users, userId, data);
}

export async function queryByUserId<T extends DocumentData>(
  collectionName: string,
  userId: string,
) {
  return queryDocuments<T>(collectionName, [where('userId', '==', userId)]);
}
