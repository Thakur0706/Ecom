import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

function Register() {
  const { currentUser, register, authPending } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // 'buyer' or 'supplier'
  const [showPendingApproval, setShowPendingApproval] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profilePictureUrl: "",
    password: "",
    confirmPassword: "",
  });
  const [supplierData, setSupplierData] = useState({
    fullName: "",
    storeName: "",
    businessType: "individual", // 'physical_shop', 'side_business', 'individual', 'freelance'
    businessAddress: "",
    businessDescription: "",
    isStudent: false,
    studentId: "",
    collegeName: "",
    department: "",
    contactNumber: "",
    upiOrBankDetails: "",
    govIdUrl: "",
    studentIdUrl: "",
  });

  if (currentUser && !showPendingApproval) {
    return (
      <Navigate
        to={
          currentUser.role === "admin"
            ? "/admin/dashboard"
            : currentUser.role === "supplier"
              ? "/supplier/dashboard"
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

  const handleSupplierChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSupplierData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateSupplierForm = () => {
    const commonFields = [
      "fullName",
      "storeName",
      "contactNumber",
      "upiOrBankDetails",
      "govIdUrl",
    ];
    
    for (const field of commonFields) {
      if (!supplierData[field].trim()) {
        setError(`${field.replace(/([A-Z])/g, " $1").trim()} is required.`);
        return false;
      }
    }

    if (supplierData.isStudent) {
      const studentFields = ["studentId", "collegeName", "department", "studentIdUrl"];
      for (const field of studentFields) {
        if (!supplierData[field].trim()) {
          setError(`${field.replace(/([A-Z])/g, " $1").trim()} is required for student verification.`);
          return false;
        }
      }
    }

    if (supplierData.businessType === "physical_shop" && !supplierData.businessAddress.trim()) {
      setError("Business address is required for physical shops.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (selectedRole === "supplier" && !validateSupplierForm()) {
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

      if (selectedRole === "supplier") {
        payload.desiredRole = "supplier";
        payload.sellerApplication = supplierData;
      }

      await register(payload);

      if (selectedRole === "supplier") {
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
                Thank you for registering as a supplier on CampusConnect. Your
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
                onClick={() => setSelectedRole("supplier")}
                className="rounded-xl border-2 border-slate-200 px-6 py-8 text-left transition hover:border-green-500 hover:bg-green-50"
              >
                <div className="mb-3 text-3xl">📦</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  I'm a Supplier
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
                    : "Become a supplier"}
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
              {selectedRole === "supplier" && (
                <>
                  <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Business Details
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Legal Full Name (for Identity Verification)
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={supplierData.fullName}
                      onChange={handleSupplierChange}
                      required
                      placeholder="As on your ID card"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="mb-6 flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        name="isStudent"
                        checked={supplierData.isStudent}
                        onChange={handleSupplierChange}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition">
                        I am a Student Seller (Campus Vendor)
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="storeName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Shop / Business Name
                    </label>
                    <input
                      id="storeName"
                      name="storeName"
                      type="text"
                      value={supplierData.storeName}
                      onChange={handleSupplierChange}
                      placeholder="e.g., TechGizmos Store or Arjun's Side Business"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="businessType"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={supplierData.businessType}
                      onChange={handleSupplierChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 bg-white"
                    >
                      <option value="individual">Individual / Freelancer</option>
                      <option value="side_business">Side Business (Part-time)</option>
                      <option value="physical_shop">Physical Shop / Professional Outlet</option>
                      <option value="freelance">Freelance Services</option>
                    </select>
                  </div>

                  {supplierData.businessType === "physical_shop" && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="businessAddress"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Shop Address
                      </label>
                      <textarea
                        id="businessAddress"
                        name="businessAddress"
                        value={supplierData.businessAddress}
                        onChange={handleSupplierChange}
                        rows="3"
                        placeholder="Enter full address of your shop..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label
                      htmlFor="businessDescription"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Tell us about your business
                    </label>
                    <textarea
                      id="businessDescription"
                      name="businessDescription"
                      value={supplierData.businessDescription}
                      onChange={handleSupplierChange}
                      rows="3"
                      placeholder="What do you sell? How long have you been in business?"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  {supplierData.isStudent && (
                    <>
                      <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100 italic text-sm text-slate-500">
                        Student-specific verification details:
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
                          value={supplierData.collegeName}
                          onChange={handleSupplierChange}
                          placeholder="e.g., SPIT, VESIT"
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
                          value={supplierData.studentId}
                          onChange={handleSupplierChange}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4 md:col-span-2">
                    <h4 className="font-semibold text-slate-900">Verification & Contact</h4>
                    <div className="grid gap-5 md:grid-cols-2">
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
                          value={supplierData.contactNumber}
                          onChange={handleSupplierChange}
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="upiOrBankDetails"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          UPI / Bank Details (for Payouts)
                        </label>
                        <input
                          id="upiOrBankDetails"
                          name="upiOrBankDetails"
                          type="text"
                          value={supplierData.upiOrBankDetails}
                          onChange={handleSupplierChange}
                          required
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="govIdUrl"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Government ID URL (Verified Document)
                    </label>
                    <input
                      id="govIdUrl"
                      name="govIdUrl"
                      type="url"
                      value={supplierData.govIdUrl}
                      onChange={handleSupplierChange}
                      required
                      placeholder="Link to hosted Aadhar/Passport/License"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  {supplierData.isStudent && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="studentIdUrl"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Student ID Card URL
                      </label>
                      <input
                        id="studentIdUrl"
                        name="studentIdUrl"
                        type="url"
                        value={supplierData.studentIdUrl}
                        onChange={handleSupplierChange}
                        placeholder="Link to hosted ID card"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 shadow-inner">
                    <strong>Note:</strong> CampusConnect verifies all suppliers to maintain safety. Our admin team will review your application within 24-48 hours.
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
