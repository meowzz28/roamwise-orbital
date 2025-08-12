// notificationStore.ts
import { useState, useEffect } from "react";
import { auth, db } from "../components/firebase";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";

export type Notification = {
  id: string;
  userId: string;
  trigger: string;
  message: string;
  Time?: { seconds: number; nanoseconds: number };
  read: boolean;
  link: string;
};

const listState: Notification[] = [];
let setListState: React.Dispatch<React.SetStateAction<Notification[]>>;
let unreadCountState = 0;
let setUnreadCountState: React.Dispatch<React.SetStateAction<number>>;
const shownNotiIds = new Set<string>();
let onlineSince = 0;

export const getNotifications = () => {
  const [list, setList] = useState<Notification[]>(listState);
  const [unreadCount, setUnreadCount] = useState(unreadCountState);

  useEffect(() => {
    setListState = setList;
    setUnreadCountState = setUnreadCount;

    let unsubscribe: (() => void) | undefined;

    const authUnsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onlineSince = Date.now();
        unsubscribe = fetchNotiList(user.uid);
      } else {
        setList([]);
        setUnreadCount(0);
        shownNotiIds.clear();
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { list, unreadCount };
};

const fetchNotiList = (uid: string) => {
  const q = query(
    collection(db, "Notifications"),
    where("userId", "==", uid),
    orderBy("Time", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const notiData: Notification[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const noti: Notification = {
        id: docSnap.id,
        userId: data.userId,
        trigger: data.trigger,
        message: data.message,
        Time: data.Time,
        read: data.read,
        link: data.link,
      };

      const createdAtMillis = noti.Time?.seconds
        ? noti.Time.seconds * 1000
        : 0;

      if (
        createdAtMillis > onlineSince &&
        !shownNotiIds.has(noti.id)
      ) {
        toast.info(`🔔 ${noti.message}`, { position: "top-right", autoClose: 5000 });
        shownNotiIds.add(noti.id);
      }

      notiData.push(noti);
    });

    setListState?.(notiData);
    setUnreadCountState?.(notiData.filter((n) => !n.read).length);
  });
};

export const markAllAsRead = async () => {
  const list = listState;
  try {
    const unreadNotis = list.filter((n) => !n.read);
    const updatePromises = unreadNotis.map((noti) =>
      updateDoc(doc(db, "Notifications", noti.id), { read: true })
    );
    setListState?.(list.map((n) => ({ ...n, read: true })));
    setUnreadCountState?.(0);
    await Promise.all(updatePromises);
    toast.success("All notifications marked as read", { position: "bottom-center" });
  } catch(err) {
    console.error("Failed to mark notification as read:", err);
    toast.error("Failed to mark all as read", { position: "bottom-center" });
  }
};

export const markAsRead = async (noti: Notification) => {
  if (!noti.read) {
    try {
      await updateDoc(doc(db, "Notifications", noti.id), { read: true });
      setListState?.((prev) => prev.map((n) => (n.id === noti.id ? { ...n, read: true } : n)));
      setUnreadCountState?.((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }
};

export const clearNoti = async () => {
  const list = listState;
  try {
    await Promise.all(list.map((noti) => deleteDoc(doc(db, "Notifications", noti.id))));
    setListState?.([]);
    setUnreadCountState?.(0);
    toast.success("All notifications are cleared", { position: "bottom-center" });
  } catch(err) {
    toast.error("Failed to clear all notifications", { position: "bottom-center" });
    console.error("Failed to clear all notifications:", err);
  }
};
