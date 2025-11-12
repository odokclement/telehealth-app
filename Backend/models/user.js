import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import validator from "validator";


const userSchema = new mongoose.Schema(
  {
    username: {type: String, required: [true, "Please provide username"], trim: true, minlength: 3, maxlength: 30, index: true,},
    email: {type: String, required: [true, "Please Provide an email"], unique: true, lowercase: true, validate: [validator.isEmail, "Please provide a valid email"],},
    password: {type: String, required: [true, "Please provide a Password"], minlength: 8, select: false,},
    passwordConfirm: {type: String, required: [true, "Please confirm your Password"],
     validate: {validator: function (el) {return el === this.password;},
        message: "Passwords do not match",
      },
    },
    isVerified: {type: Boolean, default: false,}, otp: String,
    otpExpires: Date,
     resetPasswordOTP: String,
      resetPasswordOTPExpires: Date,
    createdAt: {type: Date, default: Date.now,},}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Remove passwordConfirm before saving
  next();
});

export const User = mongoose.model("User", userSchema);