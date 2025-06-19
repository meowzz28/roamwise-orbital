// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from 'firebase/functions';
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import { getStorage } from "firebase/storage";
const apiKey = import.meta.env.VITE_API_KEY_FIREBASE;
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: apiKey,
    authDomain: "roamwise-a1c3d.firebaseapp.com",
    projectId: "roamwise-a1c3d",
    storageBucket: "roamwise-a1c3d.firebasestorage.app",
    messagingSenderId: "172796485640",
    appId: "1:172796485640:web:f354fd1f30bd1e7e2ef1bd",
    measurementId: "G-TCWMH0YQ3M"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);
export const storage = getStorage(app);
export const auth=getAuth();
export const db=getFirestore(app);
export default app;