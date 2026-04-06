import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Register() {
  const { currentUser, register, authPending } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // 'buyer' or 'seller'
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profilePictureUrl: "",
    password: "",
    confirmPassword: "",
  });
  const [sellerData, setSellerData] = useState({
    fullName: "",
    studentId: "",
    collegeName: "",
    department: "",
    contactNumber: "",
    upiOrBankDetails: "",
    govIdUrl: "",
    studentIdUrl: "",
  });

  if (currentUser) {
    return (
      <Navigate
        to={
          currentUser.role === "admin"
            ? "/admin/dashboard"
            : currentUser.role === "seller"
              ? "/seller/dashboard"
              : "/dashboard"
        }
        replace
      />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSellerChange = (event) => {
    const { name, value } = event.target;
    setSellerData((previous) => ({ ...previous, [name]: value }));
  };

  const validateSellerForm = () => {
    const requiredFields = [
      "fullName",
      "studentId",
      "collegeName",
      "department",
      "contactNumber",
      "upiOrBankDetails",
      "govIdUrl",
      "studentIdUrl",
    ];
    for (const field of requiredFields) {
      if (!sellerData[field].trim()) {
        setError(`${field.replace(/([A-Z])/g, " $1").trim()} is required.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (selectedRole === "seller" && !validateSellerForm()) {
      return;
    }

    setError("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        profilePictureUrl: formData.profilePictureUrl,
      };

      if (selectedRole === "seller") {
        payload.desiredRole = "seller";
        payload.sellerApplication = sellerData;
      }

      await register(payload);

      if (selectedRole === "seller") {
        setShowPendingApproval(true);
      } else {
        navigate("/dashboard");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-lg">
        {/* Show Pending Approval Message */}
        {showPendingApproval ? (
          <div className="text-center">
            <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 px-6 py-8">
              <div className="mb-4 text-5xl">✓</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Application Submitted!
              </h2>
              <p className="text-slate-600 mb-4">
                Thank you for registering as a seller on CampusConnect. Your
                application is now under review by our admin team.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                We will verify your details and notify you via email once your
                account is approved. This usually takes 24-48 hours.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                  <li>Admin verifies your details</li>
                  <li>We validate your student and government ID</li>
                  <li>You'll receive a confirmation email</li>
                  <li>Start listing products and services</li>
                </ul>
              </div>
              <Link
                to="/login"
                className="inline-block rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : !selectedRole ? (
          // Role Selection Step
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                Join CampusConnect
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Choose your role to get started
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setSelectedRole("buyer")}
                className="rounded-xl border-2 border-slate-200 px-6 py-8 text-left transition hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="mb-3 text-3xl">🛍️</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  I'm a Buyer
                </h3>
                <p className="text-sm text-slate-600">
                  Browse and purchase products, book services, and discover
                  student sellers.
                </p>
              </button>

              <button
                onClick={() => setSelectedRole("seller")}
                className="rounded-xl border-2 border-slate-200 px-6 py-8 text-left transition hover:border-green-500 hover:bg-green-50"
              >
                <div className="mb-3 text-3xl">📦</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  I'm a Seller
                </h3>
                <p className="text-sm text-slate-600">
                  Sell products and services, build your business, and connect
                  with buyers.
                </p>
              </button>
            </div>
          </div>
        ) : (
          // Registration Form
          <div>
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setError("");
                }}
                className="text-blue-500 hover:text-indigo-600 transition font-semibold"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {selectedRole === "buyer"
                    ? "Create your account"
                    : "Become a seller"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedRole === "buyer"
                    ? "Join the student marketplace"
                    : "Tell us about yourself"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              {/* Basic Info Section */}
              <div className="md:col-span-2">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Basic Information
                </h3>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="profilePictureUrl"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Profile Picture URL
                </label>
                <input
                  id="profilePictureUrl"
                  name="profilePictureUrl"
                  type="url"
                  value={formData.profilePictureUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>

              {/* Seller-specific fields */}
              {selectedRole === "seller" && (
                <>
                  <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Seller Details
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={sellerData.fullName}
                      onChange={handleSellerChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="studentId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Student ID
                    </label>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      value={sellerData.studentId}
                      onChange={handleSellerChange}
                      placeholder="e.g., SPIT2026001"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="collegeName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      College Name
                    </label>
                    <input
                      id="collegeName"
                      name="collegeName"
                      type="text"
                      value={sellerData.collegeName}
                      onChange={handleSellerChange}
                      placeholder="e.g., SPIT, VESIT, DJ Sanghvi"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Department
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      value={sellerData.department}
                      onChange={handleSellerChange}
                      placeholder="e.g., Information Technology"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactNumber"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Contact Number
                    </label>
                    <input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      value={sellerData.contactNumber}
                      onChange={handleSellerChange}
                      placeholder="10-digit mobile number"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="upiOrBankDetails"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      UPI ID / Bank Account
                    </label>
                    <input
                      id="upiOrBankDetails"
                      name="upiOrBankDetails"
                      type="text"
                      value={sellerData.upiOrBankDetails}
                      onChange={handleSellerChange}
                      placeholder="e.g., yourname@upi or account details"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="govIdUrl"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Government ID Document URL
                    </label>
                    <input
                      id="govIdUrl"
                      name="govIdUrl"
                      type="url"
                      value={sellerData.govIdUrl}
                      onChange={handleSellerChange}
                      placeholder="Link to Aadhar/Passport document"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="studentIdUrl"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Student ID Document URL
                    </label>
                    <input
                      id="studentIdUrl"
                      name="studentIdUrl"
                      type="url"
                      value={sellerData.studentIdUrl}
                      onChange={handleSellerChange}
                      placeholder="Link to Student ID document"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                    <strong>Note:</strong> All documents will be verified by our
                    admin team. Once approved, you'll be able to start selling.
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={authPending}
                  className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {authPending
                    ? "Creating account..."
                    : selectedRole === "buyer"
                      ? "Create Account"
                      : "Submit Application"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 transition hover:text-indigo-600"
              >
                Log in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
