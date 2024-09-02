import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title."],
  },
  description: {
    type: String,
    required: [true, "Please provide a title description."],
  },
  timeline: {
    from: {
      type: String,
      required: [true, "The timeline starting date is required."],
    },
    to: {
      type: String,
    },
  },
});

export const Timeline = mongoose.model("Timeline", timelineSchema);
