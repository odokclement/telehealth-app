import express from "express";
import { forgetPassword, login, logout, resendOtp, resetPassword, signup, verifyEmail } from "../controllers/authController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

//  User Signup Route
router.post("/signup", signup);

// verify account route
router.post("/verify",isAuthenticated, verifyEmail);

//resend otp route
router.post("/resend-otp", resendOtp);

//login route
router.post("/login",login );

//logout route
router.post("/logout",isAuthenticated, logout);
// forgot password - send OTP to email
router.post("/forgot-password", forgetPassword);

// reset password - verify OTP and update password
router.post("/reset-password", resetPassword);

export default router;
