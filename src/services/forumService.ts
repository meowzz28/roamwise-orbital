import { User } from "firebase/auth";
import { auth, db } from "../components/firebase";
import {
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  where,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addYears } from "date-fns";

export type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

export type ForumPost = {
  id: string;
  UID: string;
  index: number;
  User: string;
  Topic: string;
  Likes: number;
  LikedBy: string[];
  Saves: number;
  SavedBy: string[];
  Message: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

export type Template = {
  id: string;
  users: string[];
  userEmails: string[];
  userUIDs: string[];
  topic: string;
  startDate: string;
  endDate: string;
  imageURL: string;
  teamName?: string;
  teamID?: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

export type Props = {
  postId: string;
  parentId: string;
};

export type SubComment = {
  id: string;
  UID: string;
  User: string;
  Message: string;
  PostId: string;
  ParentCommentId: string;
  Time?: { seconds: number; nanoseconds: number };
};
export type Comment = {
  id: string;
  UID: string;
  User: string;
  Message: string;
  PostId: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
};

export type ForumPostType = {
  id: string;
  UID: string;
  User: string;
  Topic: string;
  Message: string;
  Likes: number;
  LikedBy: string[];
  Saves: number;
  SavedBy: string[];
  Time?: {
    seconds: number;
    nanoseconds: number;
  };

  TemplateID: string;
  imageUrls?: string[];
};

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
    throw error;
  }
};

export const fetchData = async (
  filter: string,
  searchTerm: string
): Promise<ForumPost[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "Forum"));
    const forumData = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        User: data.User || "",
        Topic: data.Topic || "",
        Likes: data.Likes || 0,
        Message: data.Message || "",
        Time: data.Time,
      } as ForumPost;
    });

    const recent = (a, b) => {
      if (!a.Time?.seconds && !b.Time?.seconds) return 0;
      if (!a.Time?.seconds) return 1;
      if (!b.Time?.seconds) return -1;

      return b.Time.seconds - a.Time.seconds;
    };

    const like = (a, b) => {
      if (!a.Likes && !b.Likes) return 0;
      if (!a.Likes) return 1;
      if (!b.Likes) return -1;

      return b.Likes - a.Likes;
    };

    // Sort and filter posts based on user selection
    const sortedPosts = forumData.sort(filter == "recent" ? recent : like);
    const filteredList = sortedPosts.filter((post) =>
      post.Topic.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filteredList;
  } catch (err) {
    console.error("Error fetching forum data:", err);
    return [];
  }
};

export const fetchTemplate = async (uid: string) => {
  const snapshot = await getDocs(collection(db, "Templates"));
  const filtered = snapshot.docs
    .filter((doc) => doc.data().userUIDs?.includes(uid))
    .map((doc) => ({
      id: doc.id,
      topic: doc.data().topic || "Untitled",
    }));
  return filtered;
};
export const addImg = async (image: File) => {
  const storage = getStorage();
  const imageRef = ref(storage, `forum_images/${Date.now()}_${image.name}`);
  const snapshot = await uploadBytes(imageRef, image);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};
export const addPost = async (
  userDetails: UserDetails,
  context: string,
  topic: string,
  selectedTemplateID: string,
  imageURLs: string[],
  uid: string
) => {
  await addDoc(collection(db, "Forum"), {
    User: userDetails.firstName,
    UID: uid,
    Message: context,
    Topic: topic,
    TemplateID: selectedTemplateID || null,
    Likes: 0,
    LikedBy: [],
    Saves: 0,
    SavedBy: [],
    Time: serverTimestamp(),
    ImageURLs: imageURLs,
  });
  throw Error;
};

export const listenToTrip = (
  templateID: string,
  callBack: (data: Template | null) => void
) => {
  const templateDocRef = doc(db, "Templates", templateID);
  return onSnapshot(templateDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callBack(docSnap.data() as Template);
    } else {
      callBack(null);
    }
  });
};

export const listenToDailyPlan = (
  templateID: string,
  date: string, // Firestore doc ID for the date
  callBack: (data: string) => void
) => {
  const planRef = doc(db, "Templates", templateID, "DailyPlans", date);
  return onSnapshot(planRef, (docSnap) => {
    if (docSnap.exists()) {
      callBack(docSnap.data().text || "");
    } else {
      callBack("");
    }
  });
};

// Fetch all subcomments for this post and parent comment
export const fetchSubComments = async (
  postId: string,
  parentId: string,
  callBack: (data: SubComment[]) => void
) => {
  const q = query(
    collection(db, "ForumSubComment"),
    where("PostId", "==", postId),
    where("ParentCommentId", "==", parentId)
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SubComment[];

  callBack(data);
};

export const deleteSubComment = async (id: string) => {
  await deleteDoc(doc(db, "ForumSubComment", id));
};

export const addSubComment = async (
  name: string,
  UID: string,
  Message: string,
  PostId: string,
  ParentCommentId: string
) => {
  addDoc(collection(db, "ForumSubComment"), {
    User: name,
    UID: UID,
    Message: Message,
    PostId: PostId,
    ParentCommentId: ParentCommentId,
    Time: serverTimestamp(),
  });
  //To deal with the Notification
  const parentCommentQuery = query(
    collection(db, "ForumComment"),
    where("PostId", "==", PostId),
    where("__name__", "==", ParentCommentId)
  );
  const parentSnap = await getDocs(parentCommentQuery);

  if (!parentSnap.empty) {
    const parent = parentSnap.docs[0].data();
    const parentUID = parent.UID;

    if (parentUID && parentUID !== UID) {
      await addDoc(collection(db, "Notifications"), {
        userId: parentUID,
        trigger: UID,
        message: `${name} replied to your comment.`,
        Time: serverTimestamp(),
        read: false,
        link: `/viewPost/${PostId}`,
      });
    }
  }
};

export const fetchPost = async (
  postId: string,
  uid: string,
  callBack: (data: ForumPostType) => void,
  setIsLiked: (data: boolean) => void,
  setIsSaved: (data: boolean) => void
) => {
  const postDocRef = doc(db, "Forum", postId);
  const postDocSnap = await getDoc(postDocRef);

  if (postDocSnap.exists()) {
    const data = postDocSnap.data();
    callBack({
      id: postId,
      UID: data.UID,
      User: data.User || "",
      Topic: data.Topic || "",
      Message: data.Message || "",
      Likes: data.Likes || 0,
      LikedBy: data.LikedBy || [],
      Saves: data.Saves || 0,
      SavedBy: data.SavedBy || [],
      Time: data.Time,
      TemplateID: data.TemplateID,
      imageUrls: data.ImageURLs,
    });
    setIsLiked(data.LikedBy?.includes(uid) || false);
    setIsSaved(data.SavedBy?.includes(uid) || false);
  }
};

export const fetchComment = async (
  postId: string,
  callBack: (data: Comment[]) => void
) => {
  const commentsQuery = query(
    collection(db, "ForumComment"),
    where("PostId", "==", postId)
  );
  const querySnapshot = await getDocs(commentsQuery);
  const commentsData = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      UID: data.UID,
      User: data.User || "",
      Message: data.Message || "",
      PostId: data.PostId || "",
      Time: data.Time,
    } as Comment;
  });
  // Sort comments from newest to oldest
  commentsData.sort((a, b) => {
    const timeA = a.Time?.seconds || 0;
    const timeB = b.Time?.seconds || 0;
    return timeB - timeA;
  });
  callBack(commentsData);
};

export const deletePost = async (postId: string) => {
  const commentsQuery = query(
    collection(db, "ForumComment"),
    where("PostId", "==", postId)
  );
  const commentsSnapshot = await getDocs(commentsQuery);
  const commentDeletionPromises = commentsSnapshot.docs.map((doc) =>
    deleteDoc(doc.ref)
  );
  await Promise.all(commentDeletionPromises);

  await deleteDoc(doc(db, "Forum", postId));
};
export const triggerNotification = async (
  recipientUID: string,
  message: string,
  link: string,
  UID: string
) => {
  try {
    await addDoc(collection(db, "Notifications"), {
      userId: recipientUID,
      trigger: UID,
      message,
      read: false,
      Time: serverTimestamp(),
      link,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

export const postComment = async (
  uid: string,
  userDetails: UserDetails,
  postId: string,
  comment: string
) => {
  await addDoc(collection(db, "ForumComment"), {
    User: userDetails.firstName,
    UID: uid,
    Message: comment,
    PostId: postId,
    Time: serverTimestamp(),
  });
};

export const deleteComment = async (commentId: string) => {
  await deleteDoc(doc(db, "ForumComment", commentId));
  const subCommentsQuery = query(
    collection(db, "ForumSubComment"),
    where("ParentCommentId", "==", commentId)
  );
  const subCommentsSnapshot = await getDocs(subCommentsQuery);
  const subDeletePromises = subCommentsSnapshot.docs.map((doc) =>
    deleteDoc(doc.ref)
  );
  await Promise.all(subDeletePromises);
};

export const likeUpdate = async (
  postId: string,
  UID: string,
  setPost: (data: ForumPostType) => void,
  post: ForumPostType,
  setIsLiked: (data: boolean) => void,
  userDetails: UserDetails
) => {
  const postRef = doc(db, "Forum", postId);
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) {
      throw new Error("Post does not exist.");
    }

    const likedBy = postDoc.data().LikedBy || [];
    const isCurrentlyLiked = likedBy.includes(UID);
    const newLikes = isCurrentlyLiked
      ? postDoc.data().Likes - 1
      : postDoc.data().Likes + 1;

    const updatedLikedBy = isCurrentlyLiked
      ? likedBy.filter((id: string) => id !== UID)
      : [...likedBy, UID];

    transaction.update(postRef, {
      Likes: newLikes,
      LikedBy: updatedLikedBy,
    });
    setPost({
      ...(post as ForumPostType),
      Likes: newLikes,
      LikedBy: updatedLikedBy,
    });
    setIsLiked(!isCurrentlyLiked);

    if (!isCurrentlyLiked && UID !== post.UID) {
      await triggerNotification(
        post.UID,
        `${userDetails?.firstName || "Someone"} liked your post: "${
          post.Topic
        }"`,
        `/viewPost/${postId}`,
        UID
      );
    }
  });
};

export const saveUpdate = async (
  postId: string,
  UID: string,
  setPost: (data: ForumPostType) => void,
  post: ForumPostType,
  setIsSaved: (data: boolean) => void,
  userDetails: UserDetails
) => {
  const postRef = doc(db, "Forum", postId);
  const userRef = doc(db, "Users", UID);
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    const userDoc = await transaction.get(userRef);
    if (!postDoc.exists()) {
      throw new Error("Post does not exist.");
    }
    if (!userDoc.exists()) {
      throw new Error("User does not exist.");
    }
    const rawSaves = postDoc.data().Saves;
    const saves =
      typeof rawSaves === "number" && !isNaN(rawSaves) ? rawSaves : 0;
    const savedBy = postDoc.data().SavedBy || [];
    const isCurrentlySaved = savedBy.includes(UID);
    const newLikes = isCurrentlySaved ? Math.max(saves - 1, 0) : saves + 1;
    const updatedSavedBy = isCurrentlySaved
      ? savedBy.filter((id: string) => id !== UID)
      : [...savedBy, UID];

    transaction.update(postRef, {
      Saves: newLikes,
      SavedBy: updatedSavedBy,
    });

    const userData = userDoc.data();
    const savedPosts: string[] = userData.SavedPosts || [];

    const updatedSavedPosts = isCurrentlySaved
      ? savedPosts.filter((id) => id !== postId)
      : [...savedPosts, postId];

    transaction.update(userRef, {
      SavedPosts: updatedSavedPosts,
    });

    setPost({
      ...(post as ForumPostType),
      Saves: newLikes,
      SavedBy: updatedSavedBy,
    });
    setIsSaved(!isCurrentlySaved);

    if (!isCurrentlySaved && UID !== post.UID) {
      await triggerNotification(
        post.UID,
        `${userDetails?.firstName || "Someone"} saved your post: "${
          post.Topic
        }"`,
        `/viewPost/${postId}`,
        UID
      );
    }
  });
};

export const fetchEditPost = async (postId: string) => {
  const postDocRef = doc(db, "Forum", postId);
  const postDocSnap = await getDoc(postDocRef);
  return postDocSnap;
};

export const updatePost = async (
  images: File[],
  imageUrls: string[],
  postId: string,
  userDetails: UserDetails,
  uid: string,
  context: string,
  topic: string,
  selectedTemplateID: string
) => {
  const uploadedUrls: string[] = [];
  const storage = getStorage();
  for (const image of images) {
    const imageRef = ref(storage, `forumImages/${Date.now()}_${image.name}`);
    await uploadBytes(imageRef, image);
    const url = await getDownloadURL(imageRef);
    uploadedUrls.push(url);
  }
  const finalImageUrls = [...imageUrls, ...uploadedUrls];

  // Update post in Firestore
  await updateDoc(doc(db, "Forum", postId), {
    User: userDetails.firstName,
    UID: uid,
    Message: context,
    Topic: topic,
    Time: serverTimestamp(),
    TemplateID: selectedTemplateID || null,
    ImageURLs: finalImageUrls,
  });
};
