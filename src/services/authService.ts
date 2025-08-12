import { auth, db, storage} from "../components/firebase";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { signInWithEmailAndPassword, onAuthStateChanged, User, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, } from "firebase/auth";


export type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

export type ForumPost = {
  id: string;
  index?: number;
  UID?: string;
  User: string;
  Topic: string;
  Message: string;
  Likes: number;
  Saves?: number;
  LikedBy: string[];
  SavedBy?: string[];
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

export const signOut = async () => {
    auth.signOut();
}

export const getCurrentUserDetails = async (): Promise<UserDetails | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, "Users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDetails;
    } else {
      console.log("User document does not exist.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const deleteCurrentUserAndData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is currently logged in.");

  const folderRef = ref(storage, `images/${user.uid}`);
  const listResult = await listAll(folderRef);
  const deletePromises = listResult.items.map((fileRef) => deleteObject(fileRef));
  await Promise.all(deletePromises);

  await deleteDoc(doc(db, "Users", user.uid));
  await user.delete();
};

export const getSavedPostIds = async (): Promise<string[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const docSnap = await getDoc(doc(db, "Users", user.uid));
  if (docSnap.exists()) {
    return docSnap.data().SavedPosts || [];
  }
  return [];
};

export const getForumPostData = async (id: string): Promise<ForumPost> => {
  const postSnap = await getDoc(doc(db, "Forum", id));
  if (postSnap.exists()) {
    const data = postSnap.data();
    return {
      id,
      User: data.User || "Unknown",
      Topic: data.Topic || "Untitled",
      Message: data.Message || "",
      Likes: data.Likes || 0,
      LikedBy: data.LikedBy || [],
      Saves: data.Saves || 0,
      SavedBy: data.SavedBy || [],
      UID: data.UID || "",
      Time: data.Time || null,
    };
  } else {
    return {
      id,
      User: "Unknown",
      Topic: "Unknown Post",
      Message: "",
      Likes: 0,
      LikedBy: [],
    };
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (user) {
    await setDoc(doc(db, "Users", user.uid), {
      email: user.email,
      firstName: user.displayName,
      pic: user.photoURL,
    });
  }

  return user;
};
