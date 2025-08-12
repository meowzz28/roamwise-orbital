import { FieldValue } from "firebase-admin/firestore";
import { auth, db, storage } from "../components/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  deleteDoc,
  runTransaction
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";

export const allCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
];

export type BudgetData = {
  totalBudgetPerPerson: number;
  currency: string;
  budgetLevel: string;
  breakdown: {
    flights?: number;
    accommodation: number;
    food: number;
    activities: number;
    transportation: number;
    miscellaneous: number;
  };
  dailyBreakdown: Array<{
    date: string;
    estimatedCost: number;
    breakdown: {
      accommodation: number;
      food: number;
      activities: number;
      transportation: number;
    };
    activityDetails?: Array<{
      name: string;
      estimatedCost: number;
    }>;
  }>;
  budgetTips: string[];
  disclaimer: string;
};

export type BudgetEstimationProps = {
  template: Template;
  templateID: string;
};

export type BudgetPreferences = {
  budgetLevel: "budget" | "mid-range" | "luxury";
  homeCountry: string;
  currency: string;
};

export type CurrencySelectorProps = {
  selected: string;
  onSelect: (currencyCode: string) => void;
};

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
  time?: FieldValue;
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
    return null;
  }
};

export const fetchUserTemplates = async (uid: string): Promise<Template[]> => {
  try {
    const q = query(
      collection(db, "Templates"),
      where("userUIDs", "array-contains", uid),
      orderBy("time", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Template[];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
};

export const listenToTeams = (
  uid: string,
  callback: (teams: Team[]) => void
): (() => void) => {
  const q = query(
    collection(db, "Team"),
    where("user_uid", "array-contains", uid),
    orderBy("created_at", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Team[];
    callback(teams);
  });
};

export const createTemplate = async (
  templateName: string,
  start: string,
  end: string,
  image: File | null,
  teamID: string,
  userDetails: UserDetails
): Promise<{ success: boolean; newTemplate?: Template; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    let uploadedImageURL = "";
    let teamName = "";

    if (image) {
      const imageRef = ref(storage, `templateImages/${user.uid}/${image.name}`);
      const uploadTask = await uploadBytesResumable(imageRef, image);
      uploadedImageURL = await getDownloadURL(uploadTask.ref);
    }

    let userEmails = [userDetails.email];
    let userUIDs = [user.uid];
    let users = [userDetails.firstName];

    if (teamID) {
      const teamRef = doc(db, "Team", teamID);
      const teamDoc = await getDoc(teamRef);
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        teamName = teamData.Name;
        userEmails = [...new Set([...userEmails, ...teamData.user_email])];
        userUIDs = [...new Set([...userUIDs, ...teamData.user_uid])];
        users = [...new Set([...users, ...teamData.user_name])];
      }
    }

    const newDocRef = await addDoc(collection(db, "Templates"), {
      userEmails,
      userUIDs,
      users,
      topic: templateName,
      startDate: start,
      endDate: end,
      imageURL: uploadedImageURL,
      teamID,
      teamName,
      time: serverTimestamp(),
    });

    return {
      success: true,
      newTemplate: {
        id: newDocRef.id,
        userEmails,
        userUIDs,
        users,
        topic: templateName,
        startDate: start,
        endDate: end,
        imageURL: uploadedImageURL,
        teamID,
        teamName,
        time: serverTimestamp(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const subscribeToTemplate = (
  templateID: string,
  callback: (template: Template | null) => void,
  onUnauthorized?: () => void
) => {
  const user = auth.currentUser;
  const templateDocRef = doc(db, "Templates", templateID);

  return onSnapshot(templateDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.userUIDs.includes(user?.uid)) {
        onUnauthorized?.();
        return;
      }
      callback({ id: docSnap.id, ...data } as Template);
    } else {
      callback(null);
    }
  });
};

export const fetchUserEmail = async (uid: string): Promise<string | null> => {
  const docRef = doc(db, "Users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().email : null;
};

export const canUserDeleteTemplate = async (
  template: Template,
  uid: string
): Promise<boolean> => {
  if (!template.teamID) return true;

  const teamRef = doc(db, "Team", template.teamID);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) return false;

  const teamData = teamSnap.data();
  return teamData.admin?.includes(uid) || false;
};

export const deleteTemplateAndAssets = async (templateID: string, imageURL?: string) => {
  await deleteDoc(doc(db, "BudgetEstimates", templateID));
  await deleteDoc(doc(db, "Templates", templateID));
  if (imageURL) {
    const imageRef = ref(storage, imageURL);
    await deleteObject(imageRef);
  }
};

export const updateTemplateDates = async (
  templateId: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const templateRef = doc(db, "Templates", templateId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(templateRef);
    if (!docSnap.exists()) {
      throw new Error("Template not found.");
    }

    transaction.update(templateRef, { startDate, endDate });
  });
};

export const listenToDailyPlan = (
  templateID: string,
  date: string,
  callback: (text: string) => void
): (() => void) => {
  const planRef = doc(db, "Templates", templateID, "DailyPlans", date);
  return onSnapshot(planRef, (docSnap) => {
    callback(docSnap.exists() ? docSnap.data().text || "" : "");
  });
};

export const saveDailyPlan = async (templateID: string, date:string, text:string) => {
    const planRef = doc(db, "Templates", templateID, "DailyPlans", date);
    await runTransaction(db, async (transaction) => {
        transaction.set(planRef, { text }, { merge: true });
    });
}

export const subscribeToBudget = (templateID: string, callback: (budgetData:BudgetData) => void ) => {
    const budgetRef = doc(db, "BudgetEstimates", templateID);
    return onSnapshot(budgetRef, (docSnap) => {
        if (docSnap.exists()) {
        const data = docSnap.data() as BudgetData;
        callback(data);
      }
    })
}