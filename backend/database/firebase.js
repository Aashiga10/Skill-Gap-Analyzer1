//  const firebaseConfig = {
//     apiKey: "AIzaSyAIhJ0VnhnsVPBn3vl0JJoeH2Xw5mKlag8",
//     authDomain: "skillsync-ai-16d09.firebaseapp.com",
//     projectId: "skillsync-ai-16d09",
//     storageBucket: "skillsync-ai-16d09.firebasestorage.app",
//     messagingSenderId: "161646891487",
//     appId: "1:161646891487:web:3908f7b1dab4c89fa2f46a",
//     measurementId: "G-5J1W7PV4GL"
//   };
//   firebase.initializeApp(firebaseConfig);
//   const fsdb = firebase.firestore();
//   console.log("✅ Firebase Firestore ready");



// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "skill-gap-analyser-bb2fe.firebaseapp.com",
//   projectId: "skill-gap-analyser-bb2fe",
//   storageBucket: "skill-gap-analyser-bb2fe.firebasestorage.app",
//   messagingSenderId: "1034173014047",
//   appId: "1:1034173014047:web:44b6f29fa0952dd564352a"
// };

// const app = initializeApp(firebaseConfig);
// const fsdb = getFirestore(app);

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