import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    columnId: { type: String, default: "todo" }, // matches board.columns[].id
    order: { type: Number, default: 0 },

    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dueDate: { type: Date, default: null },
    labels: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);