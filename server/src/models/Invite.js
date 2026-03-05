import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    role: { type: String, enum: ["manager", "member"], default: "member" },

    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },

    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    token: { type: String, required: true, unique: true }, // used for accept link if needed
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

inviteSchema.index({ workspace: 1, email: 1, status: 1 });

export default mongoose.model("Invite", inviteSchema);