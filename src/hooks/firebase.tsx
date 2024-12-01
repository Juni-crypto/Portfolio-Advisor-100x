// File: src/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZYyNUsDtAr430T71z8Mz99jX3psiZdpU",
  authDomain: "portfolio-planner-c0c7f.firebaseapp.com",
  projectId: "portfolio-planner-c0c7f",
  storageBucket: "portfolio-planner-c0c7f.firebasestorage.app",
  messagingSenderId: "669578795674",
  appId: "1:669578795674:web:a31105c22a225881011d23",
  measurementId: "G-JMPMESZ619"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };