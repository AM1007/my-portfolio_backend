import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(
      new ErrorHandler("Please provide both an avatar and a resume.", 400)
    );
  }
  const { avatar, resume } = req.files;

  //POSTING AVATAR
  const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(
    avatar.tempFilePath,
    { folder: "AVATARS" }
  );
  if (!cloudinaryResponseForAvatar || cloudinaryResponseForAvatar.error) {
    console.error(
      "Error with Cloudinary:",
      cloudinaryResponseForAvatar.error ||
        "An unknown error occurred with Cloudinary."
    );
    return next(
      new ErrorHandler("Failed to upload the icon to Cloudinary.", 500)
    );
  }

  const cloudinaryResponseForResume = await cloudinary.uploader.upload(
    resume.tempFilePath,
    { folder: "MY_RESUME" }
  );
  if (!cloudinaryResponseForResume || cloudinaryResponseForResume.error) {
    console.error(
      "Error with Cloudinary:",
      cloudinaryResponseForResume.error ||
        "An unknown error occurred with Cloudinary."
    );
    return next(
      new ErrorHandler("Failed to upload the resume to Cloudinary.", 500)
    );
  }

  const {
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    linkedinURL,
    telegramURL,
  } = req.body;

  const user = await User.create({
    fullName,
    email,
    phone,
    aboutMe,
    password,
    portfolioURL,
    githubURL,
    linkedinURL,
    telegramURL,
    avatar: {
      public_id: cloudinaryResponseForAvatar.public_id,
      url: cloudinaryResponseForAvatar.secure_url,
    },
    resume: {
      public_id: cloudinaryResponseForResume.public_id,
      url: cloudinaryResponseForResume.secure_url,
    },
  });
  generateToken(user, "User successfully registered!", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    return next(new ErrorHandler("The user is already logged in.", 400));
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new ErrorHandler("Please provide your email and password.", 404)
    );
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("The email or password is incorrect.", 404));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("The email or password is incorrect.", 401));
  }
  generateToken(user, "Logged in successfully!", 200, res);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged out successfully!",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("The user could not be found.", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserdata = {
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    aboutMe: req.body.aboutMe,
    portfolioURL: req.body.portfolioURL,
    githubURL: req.body.githubURL,
    linkedinURL: req.body.linkedinURL,
    telegramURL: req.body.telegramURL,
  };
  if (req.files && req.files.avatar) {
    const avatar = req.files.avatar;
    const user = await User.findById(req.user.id);
    const profileImageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(profileImageId);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      { folder: "AVATARS" }
    );
    newUserdata.avatar = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }
  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const user = await User.findById(req.user.id);
    const resumeId = user.resume.public_id;
    await cloudinary.uploader.destroy(resumeId);
    const cloudinaryResponse = await cloudinary.uploader.upload(
      resume.tempFilePath,
      { folder: "MY_RESUME" }
    );
    newUserdata.resume = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserdata, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
    user,
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please fill in all the fields.", 400));
  }
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(currentPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("The current password is incorrect.", 400));
  }
  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("The new password and confirmation do not match.", 400)
    );
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated successfully!",
  });
});

export const getUserForPortfolio = catchAsyncErrors(async (req, res, next) => {
  const id = "66cfe4ccfffff6bdcfe97a5f";
  const user = await User.findById(id);
  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;
  const message = `Here is your password reset token:\n\n ${resetPasswordUrl} \n\n If you did not request a password reset, you can safely ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Personal Portfolio Dashboard Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `The email to ${user.email} was sent successfully!`,
    });
  } catch (error) {
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    await user.save();
    return next(new ErrorHandler(error.message, 500));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "The password reset token is either invalid or has expired.",
        400
      )
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("The password and confirmation do not match.")
    );
  }
  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();
  generateToken(user, "Password has been successfully reset!", 200, res);
});
