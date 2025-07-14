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
  const [list, setList] = useState<Notifications[]>([]);
  const shownNotiIds = useRef<Set<string>>(new Set());
  const onlineSince = useRef<number>(0);
  const [showNoti, setShowNoti] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's noti
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsub = auth.onAuthStateChanged((user) => {
      if (user) {
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
    let unread = 0;

    const queries = query(
      collection(db, "Notifications"),
      where("userId", "==", uid),
      orderBy("Time", "desc")
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
        if (!noti.read) {
          unread++;
        }
        // Only toast if it's new
        //(created after user came online & never shown before)
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
      setUnreadCount(unread);
      setList(notiData);
    });

    return unsubscribe;
  };

  return (
    <div className="relative">
      <button
        style={{ borderRadius: "7px" }}
        className="hover:bg-gray-700 text-lg rounded-md font-medium  nav-link dropdown-toggle  text-white px-2 py-2 flex items-center"
        onClick={() => setShowNoti((prev) => !prev)}
        role="button"
        aria-expanded={showNoti}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 ${
          showNoti ? "" : "hidden"
        }`}
      >
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
      </div>
    </div>
  );
};

export default Notification;
