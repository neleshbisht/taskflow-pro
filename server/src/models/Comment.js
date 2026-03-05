import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);