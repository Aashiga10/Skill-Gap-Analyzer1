// import "https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js";
// import "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore-compat.js";

// const firebaseConfig = {
// //   apiKey: "YOUR_ACTUAL_API_KEY",
//   apiKey: "AIzaSyBmf01G_nEZMXB9nS7IpNCb2t7N2Wsf6fM",
//   authDomain: "skill-gap-analyser-bb2fe.firebaseapp.com",
//   projectId: "skill-gap-analyser-bb2fe",
//   storageBucket: "skill-gap-analyser-bb2fe.firebasestorage.app",
//   messagingSenderId: "1034173014047",
//   appId: "1:1034173014047:web:44b6f29fa0952dd564352a"
// };

// firebase.initializeApp(firebaseConfig);

// const fsdb = firebase.firestore();

// export { fsdb };

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmf01G_nEZMXB9nS7IpNCb2t7N2Wsf6fM",
  authDomain: "skill-gap-analyser-bb2fe.firebaseapp.com",
  projectId: "skill-gap-analyser-bb2fe",
  storageBucket: "skill-gap-analyser-bb2fe.firebasestorage.app",
  messagingSenderId: "1034173014047",
  appId: "1:1034173014047:web:44b6f29fa0952dd564352a"
};

const app = initializeApp(firebaseConfig);

const fsdb = getFirestore(app);
const auth = getAuth(app);

export { fsdb, auth };