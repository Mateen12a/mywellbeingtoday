// src/components/admin/UsersTable.jsx
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

export default function UsersTable() {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Fetch users error:", err));
  }, [token]);

  const toggleBlock = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/users/${id}/toggle-block`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(users.map((u) => (u._id === id ? { ...u, blocked: !u.blocked } : u)));
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter((u) => {
              const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
              const email = u.email?.toLowerCase() || "";
              const s = search.toLowerCase();

              return name.includes(s) || email.includes(s);
            })
            .map((u) => (
              <tr key={u._id} className="border-b">
                <td className="p-2"><a href={`/review/${u._id}`}>{u.firstName} {u.lastName}</a></td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">
                  {u.blocked ? (
                    <span className="text-red-600 font-medium">Blocked</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => toggleBlock(u._id)}
                    className={`px-3 py-1 rounded text-white ${
                      u.blocked ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {u.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
