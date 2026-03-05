import Workspace from "../models/Workspace.js";

export async function getWorkspaceRole(userId, workspaceId) {
  const ws = await Workspace.findById(workspaceId).select("owner members");
  if (!ws) return { ok: false, role: null, ws: null };

  if (ws.owner.toString() === userId) {
    return { ok: true, role: "admin", ws };
  }

  const member = ws.members?.find((m) => m.user.toString() === userId);
  if (!member) return { ok: false, role: null, ws };

  return { ok: true, role: member.role, ws };
}

export function requireWorkspaceRole(minRole) {
  const rank = { member: 1, manager: 2, admin: 3 };
  return (role) => (rank[role] || 0) >= (rank[minRole] || 99);
}