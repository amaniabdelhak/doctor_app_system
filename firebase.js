import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBOxjSGQVEEDEB5fGfIg6dTkRVJw92Ltc4",
  authDomain:        "mhabooking-db.firebaseapp.com",
  projectId:         "mhabooking-db",
  storageBucket:     "mhabooking-db.firebasestorage.app",
  messagingSenderId: "218118993065",
  appId:             "1:218118993065:web:7b02aada8ed4b51829a5b8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);