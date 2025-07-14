import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { toast } from "react-toastify";

type Notifications = {
  id: string;
  userId: string;
  trigger: string;
  message: string;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
  read: boolean;
};

const Notification = () => {
  const [UID, setUID] = useState("");
  const [list, setList] = useState<Notifications[]>([]);
  const shownNotiIds = useRef<Set<string>>(new Set());
  const onlineSince = useRef<number>(0);

  // Fetch user's teams after UID is set
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUID(user.uid);
        onlineSince.current = Date.now();
        unsubscribe = fetchNotiList(user.uid);
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Retrieve list of teams user belongs to
  const fetchNotiList = (uid: string) => {
    const queries = query(
      collection(db, "Notifications"),
      where("userId", "==", uid),
      orderBy("Time", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(queries, (querySnapshot) => {
      const notiData: Notifications[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const noti: Notifications = {
          id: doc.id,
          userId: data.userId,
          trigger: data.trigger,
          message: data.message,
          Time: data.Time,
          read: data.read,
        };

        // Only toast if it's new (created after user came online & never shown before)
        const createdAtMillis = noti.Time?.seconds
          ? noti.Time.seconds * 1000
          : 0;
        if (
          createdAtMillis > (onlineSince.current ?? 0) &&
          !shownNotiIds.current.has(noti.id)
        ) {
          toast.info(`🔔 ${noti.message}`, {
            position: "top-right",
            autoClose: 5000,
          });
          shownNotiIds.current.add(noti.id);
        }

        notiData.push(noti);
      });

      setList(notiData);
    });

    return unsubscribe;
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Notifications</h2>
      {list.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2">
          {list.map((noti) => (
            <li key={noti.id} className="border p-2 rounded">
              <p>{noti.message}</p>
              <small className="text-gray-500">
                {noti.Time?.seconds
                  ? new Date(noti.Time.seconds * 1000).toLocaleString()
                  : "No timestamp"}
              </small>
            </li>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;
