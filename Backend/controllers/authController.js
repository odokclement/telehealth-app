import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import generateOtp from "../utils/generateOtp.js";
import sendEmail from "../utils/email.js";

// 🔹 Function to sign JWT token
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// 🔹 Function to create token, set cookie, and send response
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  // Cookie options (optional, if using cookies)
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // prevents JS access to cookies
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  // Optionally set cookie (if frontend expects cookies)
  res.cookie("token", token, cookieOptions);

  // Remove sensitive fields before sending
  user.password = undefined;
  user.passwordConfirm = undefined;
  user.otp = undefined;

  // Send response
  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

// 🔹 User Signup Controller
export const signup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, username } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError("Email already registered", 400));

  // Generate OTP (valid for 24 hrs)
  const otp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

  // Create new user
  const newUser = await User.create({
    username,
    email,
    password,
    passwordConfirm,
    otp,
    otpExpires,
  });

  try {
    // Send email with OTP
    await sendEmail({
      email: newUser.email,
      subject: "OTP for Email Verification",
      html: `<h1>Your OTP is: ${otp}</h1>`,
    });

    // Return success + JWT
    createSendToken(newUser, 200, res, "Registration successful");
  } catch (error) {
    console.error("Email send error:", error);
    await User.findByIdAndDelete(newUser.id);
    return next(
      new AppError("There was an error sending the email. Try again later.", 500)
    );
  }
});
// verifyEmail
export const verifyEmail = catchAsync(async (req, res, next) => {
  console.log("Request body:", req.body);
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Please provide email and OTP", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.otp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  if (user.otpExpires < Date.now()) {
    return next(new AppError("OTP has expired", 400));
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

//login controller

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password presence
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  //Check if user exists and verify password
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //  Create JWT token
  const token = signToken(user._id);

  // Configure cookie options (fixed *)
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  //Send cookie and response
  res.cookie("token", token, cookieOptions);

  user.password = undefined; // hide password in response

  res.status(200).json({
    status: "success",
    message: "Logged in successfully",
    token,
    data: {
      user,
    },
  });
});

//logout controller

export const logout = catchAsync(async (req, res, next) => {
  // Clear the auth token cookie
  res.cookie("token", "loggedout", {
    expires: new Date(0), // Immediately expires
    httpOnly: true, // Prevents JavaScript access
    secure: process.env.NODE_ENV === "production", // Only HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-site cookies in prod
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});



