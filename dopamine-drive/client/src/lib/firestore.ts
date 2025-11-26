import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { WizardData } from "@/contexts/WizardContext";

export interface SessionData extends WizardData {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Save wizard session to Firestore
export async function saveSession(userId: string, wizardData: WizardData): Promise<string> {
  const sessionId = `session-${Date.now()}`;
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  
  const sessionData: Partial<SessionData> = {
    ...wizardData,
    userId,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // If it's a new session, add createdAt
  const existingDoc = await getDoc(sessionRef);
  if (!existingDoc.exists()) {
    sessionData.createdAt = serverTimestamp() as Timestamp;
  }

  await setDoc(sessionRef, sessionData, { merge: true });
  return sessionId;
}

// Load latest session for user
export async function loadLatestSession(userId: string): Promise<WizardData | null> {
  const sessionsRef = collection(db, "users", userId, "sessions");
  const q = query(sessionsRef, orderBy("updatedAt", "desc"), limit(1));
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data() as SessionData;
  
  // Remove Firebase-specific fields
  const { userId: _, createdAt, updatedAt, ...wizardData } = data;
  
  return wizardData as WizardData;
}

// Load specific session
export async function loadSession(userId: string, sessionId: string): Promise<WizardData | null> {
  const sessionRef = doc(db, "users", userId, "sessions", sessionId);
  const sessionDoc = await getDoc(sessionRef);
  
  if (!sessionDoc.exists()) {
    return null;
  }

  const data = sessionDoc.data() as SessionData;
  const { userId: _, createdAt, updatedAt, ...wizardData } = data;
  
  return wizardData as WizardData;
}

// Get all sessions for user
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  const sessionsRef = collection(db, "users", userId, "sessions");
  const q = query(sessionsRef, orderBy("updatedAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as SessionData);
}

// Save user profile
export async function saveUserProfile(userId: string, profile: {
  email: string;
  displayName?: string;
  photoURL?: string;
}) {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    ...profile,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

