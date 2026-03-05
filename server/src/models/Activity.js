import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g. TASK_CREATED, TASK_MOVED
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
