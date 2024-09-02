import mongoose from "mongoose";

const softwareAppicationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  svg: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
});

export const SoftwareApplication = mongoose.model(
  "SoftwareApplication",
  softwareAppicationSchema
);
