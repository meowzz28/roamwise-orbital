import { auth, db } from "../components/firebase";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  runTransaction,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

export type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

export type Team = {
  id: string;
  Name: string;
  admin: string[];
  admin_name: string[];
  user_email: string[];
  user_uid: string[];
  user_name: string[];
};

export type Message = {
  id: string;
  text: string;
  uid: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  createdBy: string;
  user_name: string;
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

// Retrieve list of teams user belongs to
export const fetchTeamList = async (uid: string): Promise<Team[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, "Team"),
        where("user_uid", "array-contains", uid),
        orderBy("created_at", "desc")
      )
    );

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        Name: data.Name,
        admin: data.admin || [],
        admin_name: data.admin_name || [],
        user_email: data.user_email || [],
        user_uid: data.user_uid || [],
        user_name: data.user_name || [],
      } as Team;
    });
  } catch (err) {
    console.error("Error fetching team data:", err);
    return [];
  }
};

// Create a new team document in Firestore
export const addTeam = async (
  teamName: string,
  admin: string[],
  admin_name: string[],
  user_email: string[],
  user_uid: string[],
  user_name: string[],
  created_by: string
) => {
  try {
    const docRef = await addDoc(collection(db, "Team"), {
      Name: teamName,
      admin,
      admin_name,
      user_email,
      user_uid,
      user_name,
      created_at: new Date(),
      created_by,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding team:", error);
    throw error;
  }
};

export const findUserByEmail = async (email: string) => {
  const q = query(collection(db, "Users"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data() as UserDetails;
  return { id: snapshot.docs[0].id, ...docData };
};

export const promoteUserToAdmin = async (
  teamID: string,
  userUID: string,
  firstName: string
) => {
  const teamRef = doc(db, "Team", teamID);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(teamRef);
    if (!docSnap.exists()) {
      throw new Error("Team not found");
    }

    transaction.update(teamRef, {
      admin: arrayUnion(userUID),
      admin_name: arrayUnion(firstName.trim()),
    });
  });
};

export const addUserAsMember = async (
  teamID: string,
  userUID: string,
  user: UserDetails
) => {
  // Get all templates under this team to update member access

  const templatesQuery = query(
    collection(db, "Templates"),
    where("teamID", "==", teamID)
  );
  const templatesSnapshot = await getDocs(templatesQuery);
  const templateRefs = templatesSnapshot.docs.map((doc) => doc.ref);
  const teamRef = doc(db, "Team", teamID);

  // Perform Firestore transaction to add member to team and templates

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(teamRef);

    transaction.update(teamRef, {
      user_email: arrayUnion(user.email),
      user_uid: arrayUnion(userUID),
      user_name: arrayUnion(`${user.firstName}`.trim()),
    });
    for (const templateRef of templateRefs) {
      transaction.update(templateRef, {
        userEmails: arrayUnion(user.email),
        userUIDs: arrayUnion(userUID),
        users: arrayUnion(`${user.firstName}`.trim()),
      });
    }
  });
};

export const sendMsg = async (
  text: string,
  teamID: string,
  uid: string,
  firstName: string
) => {
  await addDoc(collection(db, "Messages"), {
    text: text,
    createdAt: serverTimestamp(),
    teamID: teamID,
    createdBy: uid,
    user_name: firstName,
  });

  //Notification
  const teamRef = doc(db, "Team", teamID);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const memberUIDs: string[] = teamData.user_uid || [];
    console.log("Member UIDs in team:", memberUIDs);

    const currentUser = auth.currentUser;
    const senderUID = currentUser?.uid;
    const senderName = firstName;
    const notifyPromises = memberUIDs
      .filter((uid) => uid !== senderUID)
      .map((uid) =>
        addDoc(collection(db, "Notifications"), {
          userId: uid,
          trigger: senderUID,
          message: `${senderName} sent a message in ${teamData.Name}.`,
          Time: serverTimestamp(),
          read: false,
          link: "/team",
        })
      );
    await Promise.all(notifyPromises);
  }
};

export const fetchMsg = (
  teamID: string,
  callback: (msgs: Message[]) => void
) => {
  const messagesQuery = query(
    collection(db, "Messages"),
    where("teamID", "==", teamID)
  );
  return onSnapshot(messagesQuery, (snapshot) => {
    console.log("Snapshot received:", snapshot.docs.length, "docs");
    const msgs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, "id">),
    }));
    msgs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.seconds - b.createdAt.seconds;
    });
    callback(msgs);
  });
};
export const quitTeam = async (teamID: string, uid: string) => {
  const templatesQuery = query(
    collection(db, "Templates"),
    where("teamID", "==", teamID)
  );
  const templatesSnapshot = await getDocs(templatesQuery);
  const templateRefs = templatesSnapshot.docs.map((doc) => doc.ref);
  const teamRef = doc(db, "Team", teamID);
  await runTransaction(db, async (transaction) => {
    const teamDoc = await transaction.get(teamRef);
    if (!teamDoc.exists()) {
      throw new Error("Team does not exist");
    }
    const templateDocs = await Promise.all(
      templateRefs.map((ref) => transaction.get(ref))
    );
    const teamData = teamDoc.data() as Team;

    // Get index of user in user_uid array
    const userIndex = teamData.user_uid.indexOf(uid);
    if (userIndex === -1) {
      throw new Error("You are not a member of this team");
    }

    const userEmail = teamData.user_email[userIndex];
    const userName = teamData.user_name[userIndex];

    // Remove from all arrays
    const updated_user_uid = teamData.user_uid.filter((id) => id !== uid);
    const updated_user_email = teamData.user_email.filter(
      (email) => email !== userEmail
    );
    const updated_user_name = teamData.user_name.filter(
      (name) => name !== userName
    );
    const updated_admin = teamData.admin.filter((id) => id !== uid);
    const updated_admin_name = teamData.admin_name.filter(
      (name) => name !== userName
    );

    // Apply update
    if (updated_user_uid.length === 0 && updated_admin.length === 0) {
      transaction.delete(teamRef);
    } else {
      transaction.update(teamRef, {
        user_uid: updated_user_uid,
        user_email: updated_user_email,
        user_name: updated_user_name,
        admin: updated_admin,
        admin_name: updated_admin_name,
      });
    }

    templateDocs.forEach((templateDoc, index) => {
      if (templateDoc.exists()) {
        const templateData = templateDoc.data();
        transaction.update(templateRefs[index], {
          userUIDs: templateData.userUIDs.filter((id: string) => id !== uid),
          userEmails: templateData.userEmails.filter(
            (email: string) => email !== userEmail
          ),
          users: templateData.users.filter((name: string) => name !== userName),
        });
      }
    });
  });
};

export const fetchUpdatedTeam = async (
  teamID: string,
  setCurrentTeam: (data: Team) => void
) => {
  const teamRef = doc(db, "Team", teamID);
  const docSnap = await getDoc(teamRef);
  if (docSnap.exists()) {
    const updatedTeam = docSnap.data() as Team;
    setCurrentTeam(updatedTeam); // Use currentTeam as your local team state
    // console.log("Fetched updated team:", updatedTeam);
  }
};
