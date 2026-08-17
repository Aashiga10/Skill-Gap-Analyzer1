// import express from "express";
// import multer from "multer";
// import path from "path";

// const router = express.Router();

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "./uploads");
//     },

//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     }
// });

// const upload = multer({ storage });

// router.post("/", upload.single("resume"), (req, res) => {

//     if (!req.file) {
//         return res.status(400).json({
//             success: false,
//             message: "No file uploaded"
//         });
//     }

//     console.log(req.file);

//     res.status(200).json({
//         success: true,
//         message: "Resume uploaded successfully",
//         file: req.file.filename
//     });

// });

// export default router;