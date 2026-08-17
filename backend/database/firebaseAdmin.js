// // import admin from "firebase-admin";
// // import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount)
// // });

// // const db = admin.firestore();

// // export default db;

// import * as admin from "firebase-admin";
// import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// export default db;


// console.log(admin);

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

admin.initializeApp({
  credential: admin.cert(serviceAccount)
});

const db = getFirestore();

export default db;