import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Briefcase, Star } from "lucide-react";
import { getImageUrl } from "../utils/api";
const API_URL = import.meta.env.VITE_API_URL;

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`${API_URL}/api/auth/users/${id}/public`);
        if (res.status === 403) {
          setErrorMsg("You do not have permission to view this profile.");
          setProfile(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setErrorMsg("Could not load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Helper to format roles
const formatRole = (role) => {
  if (!role) return "";
  switch (role) {
    case "taskOwner":
      return "Task Owner";
    case "solutionProvider":
      return "Solution Provider";
    case "admin":
      return "Admin";
    default:
      return role;
  }
};

  if (loading)
    return (
      <div className="flex justify-center items-center mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-b-4"></div>
        <span className="ml-4 text-gray-600">Loading profile...</span>
      </div>
    );

  if (errorMsg)
    return (
      <div className="text-center mt-20 text-red-600">
        <p className="font-semibold">{errorMsg}</p>
      </div>
    );

  if (!profile)
    return (
      <div className="text-center mt-20 text-gray-500">
        <p>No profile data available.</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Profile Info */}
      <div className="bg-white rounded-xl shadow p-6 md:col-span-2 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4">
          {profile.profileImage && !profile.profileImage.includes("default.jpg") ? (
            <img
              src={getImageUrl(profile.profileImage)}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1E376E] to-[#3B5998] flex items-center justify-center text-white text-2xl font-bold border shadow">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-gray-600 flex items-center gap-1">
              <Briefcase className="w-4 h-4" /> {formatRole(profile.role)}
            </p>
            {profile.country && (
              <p className="text-sm text-gray-500">{profile.country}</p>
            )}
            {profile.status && (
              <p
                className={`mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  profile.status === "suspended"
                    ? "bg-red-100 text-red-700"
                    : profile.isApproved
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {profile.status === "suspended"
                  ? "Suspended"
                  : profile.isApproved
                  ? "Approved"
                  : "Pending"}
              </p>
            )}
            {profile.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">
                Rejection Reason: {profile.rejectionReason}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>
        )}

        {/* Skills / Expertise */}
        {profile.expertise?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-800 mb-2">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border flex items-center gap-1"
                >
                  <Star className="w-4 h-4 text-yellow-500" /> {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focus Areas */}
        {profile.focusAreas?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-800 mb-2">Focus Areas</h2>
            <div className="flex flex-wrap gap-2">
              {profile.focusAreas.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  <Star className="w-4 h-4 text-yellow-400" /> {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {profile.links?.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-800 mb-2">Links</h2>
            <ul className="space-y-2">
              {profile.links.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    🔗 {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Tasks Completed */}
        <div className="mt-8">
          <h2 className="font-semibold text-gray-800 mb-2">Recent Tasks Completed</h2>
          <ul className="space-y-3">
            {profile.recentTasks?.length > 0 ? (
              profile.recentTasks.map((task, idx) => (
                <li
                  key={idx}
                  className="p-3 border rounded-lg hover:shadow-sm transition"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.summary}</p>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No recent tasks yet.</p>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
}
