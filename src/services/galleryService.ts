import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, deleteObject, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { db, storage, auth } from "../components/firebase";
import { toast } from "react-toastify";


export const deleteImageById = async (imageId: string, imageUrl: string) => {
  const user = auth.currentUser;
  if (!user) return;

  // Delete Firestore document
  await deleteDoc(doc(db, "Users", user.uid, "images", imageId));

  // Delete image from Firebase Storage
  await deleteObject(ref(storage, imageUrl));
};


export const listenToUserImages = (
  callback: (images: any[]) => void,
  onError?: (error: any) => void
) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, "Users", user.uid, "images"),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      callback(docs);
    },
    onError
  );

  return unsubscribe;
};

export const uploadImageToGallery = (
  file: File,
  onProgress: (percent: number) => void,
  onComplete: (url: string) => void,
  onError: (error: Error) => void
) => {
  const user = auth.currentUser;
  if (!file || !user) return;

  const imageRef = ref(storage, `images/${user.uid}/${file.name}`);
  const uploadTask = uploadBytesResumable(imageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(percentage);
    },
    (error) => {
      toast.error(`Error uploading image: ${error.message}`, {
        position: "bottom-center",
      });
      onError(error);
    },
    async () => {
      try {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        const collectionRef = collection(db, "Users", user.uid, "images");
        await addDoc(collectionRef, {
          url: downloadUrl,
          userId: user.uid,
          createdAt: serverTimestamp(),
          fileName: file.name,
        });
        toast.success("Image uploaded successfully!", {
          position: "top-center",
        });
        onComplete(downloadUrl);
      } catch (error: any) {
        toast.error(`Error saving image URL: ${error.message}`, {
          position: "bottom-center",
        });
        onError(error);
      }
    }
  );
};