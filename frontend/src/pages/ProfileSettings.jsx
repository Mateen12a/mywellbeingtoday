// src/pages/ProfileSettings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  UploadCloud,
  RotateCcw,
  ArrowLeft,
  Edit3,
  Lock,
  FileText,
  Trash2,
} from "lucide-react";
import CountrySelect from "../components/CountrySelect";
import FeedbackList from "../components/FeedbackList";


const API_URL = import.meta.env.VITE_API_URL;

// Static dropdowns
const affiliations = [
  "NGO / Non-profit",
  "Academic / Research Institution",
  "Government Agency",
  "UN / Multilateral Organisation",
  "Private Sector Company",
  "Health Facility / Hospital / Clinic",
  "Independent Consultant",
  "Student / Trainee",
  "Faith-Based Organisation",
  "Other",
];

const orgTypes = [
  "NGO / Non-profit",
  "Academic / Research Institution",
  "Ministry / Department of Health",
  "Private Sector Company",
  "Health Facility / Hospital / Clinic",
  "Faith-Based Organisation",
  "Other",
];

const expertiseOptions = [
  "Delivery & Implementation",
  "Training, Capacity Building & Learning",
  "Data & Evaluation",
  "Digital & Technology Solutions",
  "Program Management & Operations",
  "Communications & Engagement",
  "Policy & Strategy",
];

const focusAreas = [
  "Maternal & Child Health",
  "Infectious Diseases",
  "Non-Communicable Diseases",
  "Mental Health",
  "Health Systems & Policy",
  "Environmental Health",
  "Community Health",
  "Global Health Security",
];

const genderOptions = ["Male", "Female", "Prefer not to say"];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [user, setUser] = useState({});
  const [role, setRole] = useState(storedUser.role || localStorage.getItem("role") || "solutionProvider");
  const [imageFile, setImageFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editableFields, setEditableFields] = useState({});

  // === Fetch user profile ===
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          setRole(data.role || storedUser.role || localStorage.getItem("role"));
        } else {
          setUser(storedUser);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setUser(storedUser);
      }
    };
    fetchProfile();
  }, [token]);

  const toggleEdit = (field) =>
    setEditableFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));

  const handleChange = (e) =>
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleMultiSelect = (field, value) => {
    setUser((prev) => {
      const arr = prev[field] || [];
      const exists = arr.includes(value);
      return {
        ...prev,
        [field]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setUser((prev) => ({ ...prev, profileImage: url }));
    }
  };

  const handleResetAvatar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, profileImage: data.profileImage }));
        localStorage.setItem("user", JSON.stringify({ ...user, profileImage: data.profileImage }));
        alert("Avatar reset successfully");
      } else alert(data.msg || "Unable to reset avatar");
    } catch (err) {
      console.error("Reset avatar error:", err);
    }
  };

  const handleUploadCv = async () => {
    if (!cvFile) return alert("Select a file first");
    try {
      const form = new FormData();
      form.append("cv", cvFile);
      const res = await fetch(`${API_URL}/api/auth/upload-cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, cvFile: data.url }));
        alert("CV uploaded successfully");
      } else alert(data.msg || "CV upload failed");
    } catch (err) {
      console.error("Upload CV error:", err);
    }
  };

  const handleRemoveCv = async () => {
    if (!user.cvFile) return;
    const confirmDelete = confirm("Are you sure you want to remove your CV?");
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvFile: "" }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, cvFile: "" }));
        alert("CV removed successfully");
      } else alert(data.msg || "Failed to remove CV");
    } catch (err) {
      console.error("Remove CV error:", err);
    }
  };
  const handleCv = (e) => {
    const file = e.target.files[0];
    if (file) setCvFile(file);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = user.profileImage;
      if (imageFile) {
        const form = new FormData();
        form.append("avatar", imageFile);
        const resUpload = await fetch(`${API_URL}/api/auth/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const uploadData = await resUpload.json();
        if (resUpload.ok) avatarUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...user, profileImage: avatarUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        alert("Profile updated successfully!");
        setEditableFields({});
      } else alert(data.msg || "Could not update profile");
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (img) => (img?.startsWith("http") ? img : img ? `${API_URL}${img}` : "");

  const BackButton = () => (
    <button
      type="button"
      onClick={() => {
        if (role === "taskOwner") navigate("/dashboard/to");
        else if (role === "admin") navigate("/dashboard/admin");
        else navigate("/dashboard/sp");
      }}
      className="inline-flex items-center gap-2 mb-6 text-[#1E376E] font-medium hover:underline"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
  );

  const Label = ({ text, field }) => (
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-semibold text-gray-700">{text}</label>
      <button
        type="button"
        onClick={() => toggleEdit(field)}
        title={editableFields[field] ? "Lock field" : "Edit field"}
        className="text-[#1E376E] hover:bg-gray-100 p-1 rounded-md transition"
      >
        {editableFields[field] ? <Lock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
      </button>
    </div>
  );

  // === Shared fields ===
  const CommonFields = () => (
    <>
      {[{ label: "First Name", name: "firstName" }, { label: "Last Name", name: "lastName" }, { label: "Email", name: "email", disabled: true }].map((f) => (
        <div key={f.name}>
          <Label text={f.label} field={f.name} />
          <input
            name={f.name}
            value={user[f.name] || ""}
            onChange={handleChange}
            disabled={!editableFields[f.name] || f.disabled}
            className={`w-full border p-2 rounded transition ${
              editableFields[f.name]
                ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
                : "bg-gray-100 cursor-not-allowed"
            }`}
          />
        </div>
      ))}

      <div>
        <Label text="Country" field="country" />
        <CountrySelect
          value={user.country || ""}
          onChange={(val) => editableFields.country && setUser((prev) => ({ ...prev, country: val }))}
          disabled={!editableFields.country}
        />
      </div>

      <div>
        <Label text="Gender" field="gender" />
        <select
          name="gender"
          value={user.gender || ""}
          onChange={handleChange}
          disabled={!editableFields.gender}
          className={`w-full border p-2 rounded transition ${
            editableFields.gender
              ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        >
          <option value="">Select</option>
          {genderOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <Label text="Short Bio" field="bio" />
        <textarea
          name="bio"
          value={user.bio || ""}
          onChange={handleChange}
          rows={4}
          disabled={!editableFields.bio}
          className={`w-full border p-2 rounded resize-y min-h-[100px] transition ${
            editableFields.bio
              ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
          placeholder="Tell us something about yourself..."
        />
      </div>
    </>
  );

  const TaskOwnerFields = () => (
    <>
      <CommonFields />
      <div className="md:col-span-2">
        <Label text="Organisation Name" field="organisationName" />
        <input
          name="organisationName"
          value={user.organisationName || ""}
          onChange={handleChange}
          disabled={!editableFields.organisationName}
          className={`w-full border p-2 rounded transition ${
            editableFields.organisationName
              ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        />
      </div>

      <div className="md:col-span-2">
        <Label text="Organisation Type" field="organisationType" />
        <select
          name="organisationType"
          value={user.organisationType || ""}
          onChange={handleChange}
          disabled={!editableFields.organisationType}
          className={`w-full border p-2 rounded transition ${
            editableFields.organisationType
              ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        >
          <option value="">Select</option>
          {orgTypes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  const SolutionProviderFields = () => (
    <>
      <CommonFields />

      <div className="md:col-span-2">
        <Label text="Affiliation" field="affiliation" />
        <select
          name="affiliation"
          value={Array.isArray(user.affiliation) ? user.affiliation[0] || "" : user.affiliation || ""}
          onChange={handleChange}
          disabled={!editableFields.affiliation}
          className={`w-full border p-2 rounded transition ${
            editableFields.affiliation
              ? "bg-white focus:ring-2 focus:ring-[#1E376E]"
              : "bg-gray-100 cursor-not-allowed"
          }`}
        >
          <option value="">Select</option>
          {affiliations.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <Label text="Areas of Expertise" field="expertise" />
        <div className="flex flex-wrap gap-2">
          {expertiseOptions.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => editableFields.expertise && handleMultiSelect("expertise", e)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                user.expertise?.includes(e)
                  ? "bg-[#E96435] text-white border-[#E96435]"
                  : "border-gray-300 text-gray-700"
              } ${!editableFields.expertise ? "opacity-50 cursor-not-allowed" : "hover:border-[#E96435]"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      {/* CV Upload Section */}
      <div className="md:col-span-2 mt-4 border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1E376E]" /> Resume (CV)
        </h3>

        {user.cvFile ? (
          <div className="flex items-center justify-between bg-gray-50 border rounded p-3">
            <a
              href={`${API_URL}${user.cvFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E376E] hover:underline flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> View Uploaded CV
            </a>
            <button
              type="button"
              onClick={handleRemoveCv}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleCv} />
            <button
              type="button"
              onClick={handleUploadCv}
              className="bg-[#1E376E] text-white px-4 py-1.5 rounded hover:opacity-90 text-sm"
            >
              Upload CV
            </button>
          </div>
        )}
      </div>
    </>
  );

  const AdminFields = () => <CommonFields />;

  return (
    <DashboardLayout role={role} title="Profile & Settings">
      <BackButton />
      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center md:w-48">
            <div className="w-36 h-36 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center">
              {user.profileImage ? (
                <img src={getImageUrl(user.profileImage)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>
            <label className="mt-3 inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded border hover:bg-gray-50 text-sm">
              <UploadCloud className="w-4 h-4" /> Upload
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
            <button
              type="button"
              onClick={handleResetAvatar}
              className="mt-2 inline-flex items-center gap-1 text-xs text-gray-600 hover:text-[#1E376E]"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Editable Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {role === "taskOwner" ? <TaskOwnerFields /> : role === "admin" ? <AdminFields /> : <SolutionProviderFields />}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button disabled={saving} className="bg-[#1E376E] text-white px-6 py-2 rounded-lg shadow hover:opacity-90">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {role === "solutionProvider" && (
        <section className="mt-10 max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1E376E] mb-4">My Feedback</h2>
          <FeedbackList userId={user._id} />
        </section>
      )}
    </DashboardLayout>
  );
}
