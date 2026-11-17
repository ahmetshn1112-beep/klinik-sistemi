const { initializeApp, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { AuthorizationError, requireCallerProfile } = require("./auth/authorization");

if (getApps().length === 0) {
  initializeApp();
}

exports.getMyProfile = onCall(async (request) => {
  try {
    const identity = await requireCallerProfile(request, getDatabase());
    const profile = identity.profile;

    return {
      username: identity.username,
      clinicId: identity.clinicId,
      role: identity.role,
      active: profile.active !== false,
      displayName: profile.displayName || profile.username,
      title: profile.title || "",
      email: profile.email || "",
      assignedDoctors: Array.isArray(profile.assignedDoctors) ? profile.assignedDoctors : [],
      createdAt: profile.createdAt || null,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw new HttpsError(error.code, error.message);
    }
    console.error("Profile authorization failed.", error);
    throw new HttpsError("internal", "The profile could not be loaded.");
  }
});
