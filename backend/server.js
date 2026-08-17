
// // newly added

// app.get("/add-user", async (req, res) => {
//   try {
//     const docRef = await addDoc(collection(db, "users"), {
//       name: "Aashiga",
//       skill: "Java"
//     });

//     res.send(`User added with ID: ${docRef.id}`);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// app.get("/test-firebase", (req, res) => {
//   res.send("Firebase Connected");
// });

// app.get("/add-user", async (req, res) => {
//   res.send("Testing");
// });


// working code

// import express from "express";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Home Page");
// });

// app.get("/add-user", (req, res) => {
//   res.send("Add User Route Working");
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });



// before code



// import express from "express";
// import db from "./database/firebaseAdmin.js";

// const app = express();

// app.get("/", (req, res) => {
//   res.send("Home Page");
// });
// app.get("/add-user", async (req, res) => {
//   try {
//     const docRef = await db.collection("users").add({
//       name: "Aashiga",
//       email: "aashiga@gmail.com",
//       dreamJob: "Java Developer",
//       completedCourses: []
//     });

//     res.send(`User added with ID: ${docRef.id}`);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });
// // app.get("/add-user", async (req, res) => {
// //   try {
// //     const docRef = await db.collection("users").add({
// //       name: "Aashiga",
// //       skill: "Java"
// //     });

// //     res.send(`User added with ID: ${docRef.id}`);
// //   } catch (error) {
// //     res.status(500).send(error.message);
// //   }
// // });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// import uploadResume from "./routes/uploadResume.js";

// app.use("/uploadResume",uploadResume);

import express from "express";
import cors from "cors";
import db from "./database/firebaseAdmin.js";
import uploadResume from "./routes/uploadResume.js";

const app = express();

app.use(cors());  
app.use(express.json());

// // Resume Upload Route
// app.use("/uploadResume", uploadResume);

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/add-user", async (req, res) => {
  try {
    const docRef = await db.collection("users").add({
      name: "Aashiga",
      email: "aashiga@gmail.com",
      dreamJob: "Java Developer",
      completedCourses: []
    });

    res.send(`User added with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});