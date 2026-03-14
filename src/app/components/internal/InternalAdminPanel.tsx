import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import {
  getInternalAdminCredentials,
  clearInternalAdminSession,
  internalAdminListUsers,
  internalAdminUpdateUser,
} from "./internalAdminApi";

const PAGE_SIZE = 15;

export function InternalAdminPanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const creds = getInternalAdminCredentials();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    if (!creds) return;
    setLoading(true);
    const { users: u, total: t } = await internalAdminListUsers(creds, {
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    setUsers(u);
    setTotal(t);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const goHome = () => {
    clearInternalAdminSession();
    onBack();
    navigate("/");
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    const exp = user.credits_expires_at;
    const expStr =
      exp && !isNaN(new Date(exp).getTime())
        ? new Date(exp).toISOString().slice(0, 16)
        : "";
    setEditForm({
      credits: user.credits ?? 0,
      extra_credits: user.extra_credits ?? 0,
      credits_expires_at: expStr,
      tier: user.tier ?? "architect",
      is_admin: user.is_admin ?? false,
    });
  };

  const handleSaveUser = async () => {
    if (!creds || !editingUser) return;
    setSaving(true);
    const updates: Record<string, any> = {
      credits: Number(editForm.credits) || 0,
      extra_credits: Number(editForm.extra_credits) || 0,
      tier: editForm.tier,
      is_admin: Boolean(editForm.is_admin),
    };
    if (editForm.credits_expires_at) {
      updates.credits_expires_at = new Date(editForm.credits_expires_at).toISOString();
    } else {
      updates.credits_expires_at = null;
    }
    const result = await internalAdminUpdateUser(creds, editingUser.user_id, updates);
    setSaving(false);
    if (result.ok) {
      toast.success("User updated");
      setEditingUser(null);
      fetchUsers();
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  };

  if (!creds) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goHome}
              className="text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-sm text-zinc-400">
                Edit credits, extra credits, and expiration dates
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goHome}
            className="text-zinc-400 hover:text-white gap-2"
          >
            <LogOut size={16} />
            Log out
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <Input
              placeholder="Search by display name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-zinc-500">
              No users found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Credits</TableHead>
                    <TableHead className="text-zinc-400">Extra Credits</TableHead>
                    <TableHead className="text-zinc-400">Expires At</TableHead>
                    <TableHead className="text-zinc-400">Tier</TableHead>
                    <TableHead className="text-zinc-400">Admin</TableHead>
                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.user_id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{u.display_name || "Anonymous"}</div>
                          <div className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">
                            {u.user_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{u.credits ?? 0}</TableCell>
                      <TableCell>{u.extra_credits ?? 0}</TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {u.credits_expires_at
                          ? new Date(u.credits_expires_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{u.tier || "architect"}</span>
                      </TableCell>
                      <TableCell>{u.is_admin ? "Yes" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(u)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
                <span className="text-sm text-zinc-500">
                  {total} total users
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-zinc-400"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-sm text-zinc-500">
                    Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * PAGE_SIZE >= total}
                    className="text-zinc-400"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              Edit {editingUser?.display_name || "User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Credits</label>
              <Input
                type="number"
                min={0}
                value={editForm.credits ?? 0}
                onChange={(e) => setEditForm((f: any) => ({ ...f, credits: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Extra Credits</label>
              <Input
                type="number"
                min={0}
                value={editForm.extra_credits ?? 0}
                onChange={(e) => setEditForm((f: any) => ({ ...f, extra_credits: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Credits Expires At</label>
              <Input
                type="datetime-local"
                value={editForm.credits_expires_at ?? ""}
                onChange={(e) => setEditForm((f: any) => ({ ...f, credits_expires_at: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">Leave empty for no expiration</p>
            </div>
            <div>
              <label htmlFor="edit-tier" className="text-sm text-zinc-400 block mb-1">Tier</label>
              <select
                id="edit-tier"
                aria-label="User tier"
                value={editForm.tier ?? "architect"}
                onChange={(e) => setEditForm((f: any) => ({ ...f, tier: e.target.value }))}
                className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-white"
              >
                <option value="architect">architect</option>
                <option value="standard">standard</option>
                <option value="max">max</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_admin"
                checked={editForm.is_admin ?? false}
                onChange={(e) => setEditForm((f: any) => ({ ...f, is_admin: e.target.checked }))}
                className="rounded border-zinc-600"
              />
              <label htmlFor="is_admin" className="text-sm">Admin</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
