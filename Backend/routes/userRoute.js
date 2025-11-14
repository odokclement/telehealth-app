import express from "express";
import { login, logout, signup, verifyEmail } from "../controllers/authController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

//  User Signup Route
router.post("/signup", signup);

// verify account route
router.post("/verify",isAuthenticated, verifyEmail);

//login route
router.post("/login",login );

//logout route
router.post("/logout",isAuthenticated, logout);

export default router;
