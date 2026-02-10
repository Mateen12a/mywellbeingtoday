import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Upload,
  Loader2,
} from "lucide-react";
import CountrySelect from "../components/CountrySelect";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import logo from "../assets/logo.png";

const API_URL = import.meta.env.VITE_API_URL;

const titles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs.", "Mx."];
const orgTypes = [
  "NGO / Non-profit",
  "Academic / Research Institution",
  "Ministry / Department of Health",
  "Other Government Agency",
  "Multilateral Organisation",
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
const genders = ["Female", "Male", "Prefer not to say", "Prefer to self-describe"];

export default function Signup() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#EEF2F7] p-6">
        <Link to="/" className="mb-8">
          <img src={logo} alt="GlobalHealth.Works" className="h-20 w-auto object-contain" />
        </Link>
        <h2 className="text-4xl font-extrabold text-[#1E376E] mb-8">Join the Community</h2>
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
          <button
            onClick={() => setRole("taskOwner")}
            className="border border-[#357FE9] bg-white shadow-md p-8 rounded-2xl hover:bg-[#357FE9] hover:text-white transition transform hover:scale-[1.02]"
          >
            <h3 className="text-2xl font-semibold">Task Owner</h3>
            <p className="text-sm mt-2 text-gray-600">Post global health tasks & connect with experts</p>
          </button>
          <button
            onClick={() => setRole("solutionProvider")}
            className="border border-[#E96435] bg-white shadow-md p-8 rounded-2xl hover:bg-[#E96435] hover:text-white transition transform hover:scale-[1.02]"
          >
            <h3 className="text-2xl font-semibold">Solution Provider</h3>
            <p className="text-sm mt-2 text-gray-600">Work on tasks and showcase your skills.</p>
          </button>
        </div>
        <p className="mt-8 text-gray-700">
          Already have an account?{" "}
          <Link to="/login" className="text-[#357FE9] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return <SignupForm role={role} navigate={navigate} goBack={() => setRole(null)} />;
}


function SignupForm({ role, navigate, goBack }) {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organisationName: "",
    organisationType: "",
    country: "",
    gender: "",
    genderSelfDescribe: "",
    expertise: [],
    affiliation: [],
    bio: "",
    professionalLink: "",
    resume: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMissingTooltip, setShowMissingTooltip] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [orgNameError, setOrgNameError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+(?:\.[^\s@]+)*@[^\s@]+\.[^\s@]+$/;
    if (!email) return "";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.includes("..")) return "Email cannot contain consecutive dots";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "email") {
      setEmailError(validateEmail(value));
    }
    if (name === "organisationName") {
      if (value && value.length < 2) {
        setOrgNameError("Organization name must be at least 2 characters");
      } else {
        setOrgNameError("");
      }
    }
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((v) => v !== value) : [...prev[field], value],
      };
    });
  };

  const passwordCriteria = {
    minLength: /.{8,}/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };
  const passwordStrength = Object.values(passwordCriteria).filter(Boolean).length;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = passwordStrength === 5;

  // merged requiredFields logic
  const requiredFields = useMemo(() => {
    const fields = ["title", "firstName", "lastName", "email", "password", "confirmPassword", "phone", "country", "gender"];
    if (role === "taskOwner") {
      fields.push("organisationName", "organisationType");
    } else if (role === "solutionProvider") {
      fields.push("affiliation");
      if (!formData.resume) fields.push("resume");
      if (formData.expertise.length === 0) fields.push("expertise");
    }
    return fields;
  }, [role, formData]);

  const missingFields = requiredFields.filter((f) => {
    if (f === "expertise") return formData.expertise.length === 0;
    if (f === "confirmPassword") return !formData.confirmPassword || !passwordsMatch;
    return !formData[f];
  });

  const hasValidationErrors = emailError || orgNameError || !isPasswordValid || !passwordsMatch;
  const allFilled = missingFields.length === 0 && !hasValidationErrors;

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!allFilled) return;

  // Make sure nothing remains from old sessions
  localStorage.clear(); 
  setLoading(true);
  try {
    // 1️⃣ Register user
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Registration failed");
      setLoading(false);
      return;
    }

    // 2️⃣ Upload CV if solutionProvider
    if (role === "solutionProvider" && formData.resume) {
      const cvForm = new FormData();
      cvForm.append("cv", formData.resume);

      const cvRes = await fetch(`${API_URL}/api/auth/upload-cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data.tempToken}` }, // temporary token only for CV upload
        body: cvForm,
      });

      const cvData = await cvRes.json();
      if (cvRes.ok) console.log("CV uploaded:", cvData.url);
      else console.warn("CV upload failed:", cvData.msg);
    }

    // 3️⃣ Ensure no login occurs
    // Remove any token/state that could log in the user
    delete data.tempToken;
    delete data.user;
    delete data.role;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // 4️⃣ Show success modal
    setShowSuccessModal(true);

  } catch (err) {
    console.error("Register error:", err);
    alert("Something went wrong. Try again.");
  } finally {
    setLoading(false);
  }
};



  const Label = ({ text, required, optional }) => (
    <label className="block font-semibold text-gray-800 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
      {optional && <span className="text-gray-400 font-normal text-sm ml-1">(Optional)</span>}
    </label>
  );

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-[#F9FAFB] to-[#EEF2F7] py-12 px-4">
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-2xl space-y-6 relative"
        style={{
          animation: "fadeIn 0.3s ease-out forwards",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <div className="flex items-center mb-4">
          <button type="button" onClick={goBack} className="flex items-center text-gray-600 hover:text-[#357FE9]">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
        </div>

        <h2 className="text-3xl font-bold text-[#1E376E] mb-4">
          {role === "taskOwner" ? "Task Owner" : "Solution Provider"} Registration
        </h2>

        {/* Name Section */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <Label text="Title" required />
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
              required
            >
              <option value="">Select</option>
              {titles.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label text="First Name" required />
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
              required
            />
          </div>
          <div className="md:col-span-3">
            <Label text="Last Name" required />
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <Label text="Email Address" required />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9] ${emailError ? "border-red-500" : ""}`}
            required
          />
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <Label text="Password" required />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm pr-10 focus:ring-2 focus:ring-[#357FE9]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          {formData.password && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <div className={`flex items-center gap-2 ${passwordCriteria.minLength ? "text-green-600" : "text-gray-500"}`}>
                  <span>{passwordCriteria.minLength ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordCriteria.uppercase ? "text-green-600" : "text-gray-500"}`}>
                  <span>{passwordCriteria.uppercase ? "✓" : "○"}</span>
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordCriteria.lowercase ? "text-green-600" : "text-gray-500"}`}>
                  <span>{passwordCriteria.lowercase ? "✓" : "○"}</span>
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordCriteria.number ? "text-green-600" : "text-gray-500"}`}>
                  <span>{passwordCriteria.number ? "✓" : "○"}</span>
                  <span>At least one number (0-9)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordCriteria.special ? "text-green-600" : "text-gray-500"}`}>
                  <span>{passwordCriteria.special ? "✓" : "○"}</span>
                  <span>At least one special character (!@#$%^&*)</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`h-2 transition-all duration-300 rounded ${
                      passwordStrength <= 2
                        ? "bg-red-500"
                        : passwordStrength === 3
                        ? "bg-yellow-400"
                        : passwordStrength === 4
                        ? "bg-blue-400"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label text="Confirm Password" required />
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full border p-3 rounded-lg shadow-sm pr-10 focus:ring-2 focus:ring-[#357FE9] ${
                formData.confirmPassword && !passwordsMatch ? "border-red-500" : ""
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
          )}
          {formData.confirmPassword && passwordsMatch && (
            <p className="text-green-600 text-xs mt-1">Passwords match</p>
          )}
        </div>

        {/* Phone with Country Code */}
        <div>
          <Label text="Phone Number" required />
          <PhoneInput
            country={"ng"}
            value={formData.phone}
            onChange={(phone) => setFormData({ ...formData, phone })}
            inputStyle={{
              width: "100%",
              height: "48px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            buttonStyle={{
              borderRadius: "8px 0 0 8px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Task Owner Fields */}
        {role === "taskOwner" && (
          <>
            <div className="relative">
              <Label text="Organisation Name" required />
              <div className="absolute top-1 right-1">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-[#357FE9]"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
              {showTooltip && (
                <div className="absolute top-8 right-0 bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 w-64 z-10">
                  Task Owners must work in an organization in global health.
                </div>
              )}
              <input
                name="organisationName"
                value={formData.organisationName}
                onChange={handleChange}
                placeholder="Enter your organization name (minimum 2 characters)"
                className={`w-full border p-3 rounded-lg shadow-sm mt-1 focus:ring-2 focus:ring-[#357FE9] ${orgNameError ? "border-red-500" : ""}`}
                required
              />
              <p className="text-gray-500 text-xs mt-1">Minimum 2 characters required</p>
              {orgNameError && (
                <p className="text-red-500 text-xs mt-1">{orgNameError}</p>
              )}
            </div>

            <div>
              <Label text="Organisation Type" required />
              <select
                name="organisationType"
                value={formData.organisationType}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
                required
              >
                <option value="">Select</option>
                {orgTypes.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Solution Provider Fields */}
        {role === "solutionProvider" && (
          <>
            <div>
              <Label text="Affiliation" required />
              <select
                name="affiliation"
                value={formData.affiliation}
                onChange={(e) =>
                  setFormData({ ...formData, affiliation: [e.target.value] })
                }
                className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
                required
              >
                <option value="">Select your affiliation</option>
                {affiliations.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <Label text="What kind of expertise do you offer?" required />
              <div className="flex flex-wrap gap-2">
                {expertiseOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleMultiSelect("expertise", e)}
                    className={`px-3 py-2 rounded-full border text-sm ${
                      formData.expertise.includes(e)
                        ? "bg-[#E96435] text-white border-[#E96435]"
                        : "border-gray-300 text-gray-700 hover:border-[#E96435]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <Label text="Upload Resume / CV" required />
              <div className="relative">
                <label
                  htmlFor="resume-upload"
                  className="group flex items-center gap-3 border-2 border-dashed border-gray-400 rounded-lg p-5 cursor-pointer hover:border-[#357FE9] hover:bg-[#F7FAFC] transition relative z-10"
                >
                  <Upload className="w-6 h-6 text-gray-600 group-hover:text-[#357FE9]" />
                  <span className="text-gray-600 group-hover:text-[#357FE9]">
                    Click to upload or drag & drop (PDF, DOC, DOCX)
                  </span>
                </label>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {formData.resume && (
                <div className="mt-3 flex items-center justify-between bg-gray-50 border rounded-lg p-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 truncate max-w-[200px]">
                      {formData.resume.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {(formData.resume.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resume: null })}
                    className="text-red-500 hover:text-red-600 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Country & Gender */}
        <div>
          <Label text="Country" required />
          <CountrySelect
            value={formData.country}
            onChange={(val) => setFormData({ ...formData, country: val })}
          />
        </div>

        <div>
          <Label text="Gender" required />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
            required
          >
            <option value="">Select</option>
            {genders.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {formData.gender === "Prefer to self-describe" && (
            <input
              type="text"
              name="genderSelfDescribe"
              placeholder="Please specify"
              value={formData.genderSelfDescribe}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm mt-2 focus:ring-2 focus:ring-[#357FE9]"
            />
          )}
        </div>

        {/* Bio & Link */}
        <div>
          <Label text="Short Bio" optional />
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
            placeholder="Briefly describe your experience..."
          />
        </div>

        <div>
          <Label text="Professional Link (LinkedIn, website, etc.)" optional />
          <input
            type="url"
            name="professionalLink"
            value={formData.professionalLink}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        {/* Submit button + tooltip */}
        <div className="relative mt-6">
          <button
            type="submit"
            disabled={!allFilled || loading}
            onMouseEnter={() => !allFilled && setShowMissingTooltip(true)}
            onMouseLeave={() => setShowMissingTooltip(false)}
            className={`w-full py-3 rounded-lg font-semibold shadow transition-all duration-300 flex justify-center items-center ${
              allFilled
                ? "bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white hover:opacity-90"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          {!allFilled && showMissingTooltip && (
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-28 bg-white border border-gray-200 shadow-xl rounded-xl p-4 w-72 z-50"
              style={{
                animation: "fadeIn 0.3s ease-out forwards",
                "@keyframes fadeIn": {
                  from: { opacity: 0, transform: "translateY(6px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <div className="flex items-center gap-2 mb-2 text-[#1E376E] font-semibold">
                <Info size={18} />
                <span>Complete the following fields:</span>
              </div>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="capitalize">
                    {field.replace(/([A-Z])/g, " $1")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
      {showSuccessModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-fadeIn">
      <img src={logo} alt="GlobalHealth.Works" className="h-16 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-[#1E376E] mb-3">
        Registration Recieved
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Thanks for registering. Your account is now 
        pending review. We aim to approve accounts within 24-48 hours.
        We'll email you once verified.
      </p>
      <button
        onClick={() => {
          ["token", "user", "role"].forEach((k) => localStorage.removeItem(k));
          window.location.reload();
        }}
        className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white hover:opacity-90 transition-all duration-300"
      >
        Close
      </button>
    </div>
  </div>
)}
<style>
{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.4s ease-out forwards;
  }
`}
</style>

    </div>
  );
}