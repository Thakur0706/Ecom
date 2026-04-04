export function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export function serializeSellerProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile._id,
    userId: profile.userId,
    fullName: profile.fullName,
    studentId: profile.studentId,
    collegeName: profile.collegeName,
    department: profile.department,
    contactNumber: profile.contactNumber,
    upiOrBankDetails: profile.upiOrBankDetails,
    govIdUrl: profile.govIdUrl,
    studentIdUrl: profile.studentIdUrl,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
    approvedAt: profile.approvedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
