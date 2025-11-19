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

 // Generate OTP (valid 5 minutes)
const otp = generateOtp();
const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min


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
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Please provide email and OTP", 400));
  }

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  if (user.otp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  //  EXPIRY CHECK FIXED
  if (user.otpExpires.getTime() < Date.now()) {
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

//resend token controller
export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Generate new OTP and expiry for 5 minutes
  const newOtp = generateOtp();
  const newOtpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp = newOtp;
  user.otpExpires = newOtpExpires;

  await user.save({ validateBeforeSave: false });

  // Send OTP email
  await sendEmail({
    email: user.email,
    subject: "New OTP Code",
    html: `<h1>Your new OTP is: ${newOtp}</h1>`,
  });

  res.status(200).json({
    status: "success",
    message: "OTP resent successfully",
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

// forgot password controller
export const forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No user found", 404));
  }

  const otp = generateOtp();

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = Date.now() + 5 * 60 * 1000; // 5 mins

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password Reset OTP (Valid for 5 Minutes)",
      html: `<h1>Your password reset OTP is: <b>${otp}</b></h1>`,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("Error sending email. Try again later.", 500));
  }
});
// reset password controller
export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password, passwordConfirm } = req.body;

  // Validate
  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  // Update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;

  await user.save();

  // Send token after password reset
  createSendToken(user, 200, res, "Password reset successfully");
});




