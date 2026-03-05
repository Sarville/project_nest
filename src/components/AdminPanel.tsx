import { useCallback, useEffect, useState } from "react";

interface UserRow {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (id: string, role: "USER" | "ADMIN") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-xl">Users</h2>
          {!loading && (
            <p className="text-slate-400 text-xs mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""} total</p>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-20">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-center py-20">No users found.</p>
      ) : (
        <div className="bg-[#1e3a5f] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-xs text-slate-400 uppercase tracking-wide px-5 py-3 border-b border-slate-700/50">
            <span>Email</span>
            <span className="text-center px-4">Created</span>
            <span className="text-center">Role</span>
          </div>
          <div className="divide-y divide-slate-700/30">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_auto_auto] gap-0 items-center px-5 py-3">
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{u.email}</p>
                </div>
                <p className="text-slate-400 text-xs px-4 whitespace-nowrap">{formatDate(u.createdAt)}</p>
                <select
                  value={u.role}
                  disabled={updating === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as "USER" | "ADMIN")}
                  className="bg-[#0a1628] text-white text-xs rounded-lg px-2 py-1.5 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
