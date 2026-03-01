import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { AssessmentResult, UserProfile } from '../types';

export interface UserDocument {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  assessmentResult?: AssessmentResult;
  userProfile?: UserProfile;
  completedMissions: string[];
}

export const createUserDocument = async (
  uid: string,
  email: string,
  displayName: string
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email,
      displayName,
      createdAt: Timestamp.now(),
      completedMissions: []
    });
  }
};

export const saveUserProgress = async (
  uid: string,
  data: { assessmentResult?: AssessmentResult; userProfile?: UserProfile }
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
};

export const getUserProgress = async (uid: string): Promise<Partial<UserDocument> | null> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserDocument>;
  // Normalize so Dashboard never gets undefined missions
  if (data?.userProfile && !Array.isArray(data.userProfile.missions)) {
    data.userProfile = { ...data.userProfile, missions: data.userProfile.missions ?? [] };
  }
  return data;
};

export const markMissionComplete = async (uid: string, missionId: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    const data = snap.data() as UserDocument;
    const completedMissions = data.completedMissions || [];
    if (!completedMissions.includes(missionId)) {
      completedMissions.push(missionId);
      await setDoc(userRef, { completedMissions }, { merge: true });
    }
  }
};
