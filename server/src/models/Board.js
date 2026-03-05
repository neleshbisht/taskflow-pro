import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },      // client-friendly id
    title: { type: String, required: true }
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true, trim: true },
    columns: {
      type: [columnSchema],
      default: [
        { id: "todo", title: "Todo" },
        { id: "inprogress", title: "In Progress" },
        { id: "done", title: "Done" }
      ]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Board", boardSchema);