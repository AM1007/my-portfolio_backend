import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { SoftwareApplication } from "../models/softwareApplicationSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const addNewApplication = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(
      new ErrorHandler("Please provide a software application icon.", 404)
    );
  }
  const { svg } = req.files;
  const { name } = req.body;

  if (!name) {
    return next(new ErrorHandler("Please enter the software's name.", 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    svg.tempFilePath,
    { folder: "PORTFOLIO_SOFTWARE_APPLICATION_IMAGES" }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Error with Cloudinary:",
      cloudinaryResponse.error || "An unknown error occurred with Cloudinary."
    );
    return next(
      new ErrorHandler("Failed to upload the icon to Cloudinary.", 500)
    );
  }

  const softwareApplication = await SoftwareApplication.create({
    name,
    svg: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(201).json({
    success: true,
    message: "A new software application has been added!",
    softwareApplication,
  });
});

export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const softwareApplication = await SoftwareApplication.findById(id);
  if (!softwareApplication) {
    return next(
      new ErrorHandler("The software application could not be found.", 404)
    );
  }
  const softwareApplicationSvgId = softwareApplication.svg.public_id;
  await cloudinary.uploader.destroy(softwareApplicationSvgId);
  await softwareApplication.deleteOne();
  res.status(200).json({
    success: true,
    message: "The software application has been deleted.",
  });
});

export const getAllApplications = catchAsyncErrors(async (req, res, next) => {
  const softwareApplications = await SoftwareApplication.find();
  res.status(200).json({
    success: true,
    softwareApplications,
  });
});
