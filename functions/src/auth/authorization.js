const VALID_ROLES = new Set([
  "clinic_owner",
  "doctor",
  "head_assistant",
  "assistant",
]);

class AuthorizationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

const normalizeUsername = (username) =>
  typeof username === "string" ? username.trim().toLowerCase() : "";

async function requireCallerProfile(request, database) {
  const auth = request?.auth;
  if (!auth?.uid) {
    throw new AuthorizationError("unauthenticated", "Authentication is required.");
  }

  const username = normalizeUsername(auth.token?.username);
  const clinicId = auth.token?.clinicId;
  const role = auth.token?.role;
  if (
    !username ||
    typeof clinicId !== "string" ||
    clinicId.length === 0 ||
    !VALID_ROLES.has(role) ||
    auth.token?.active !== true
  ) {
    throw new AuthorizationError("permission-denied", "A valid active clinic identity is required.");
  }

  const profileSnapshot = await database
    .ref(`KlinikAnaVeritabani/users/${username}`)
    .get();
  if (!profileSnapshot.exists()) {
    throw new AuthorizationError("permission-denied", "The clinic user profile was not found.");
  }

  const profile = profileSnapshot.val();
  const profileActive = profile.active !== false;
  if (
    profile.username !== username ||
    profile.clinicId !== clinicId ||
    profile.role !== role ||
    !profileActive
  ) {
    throw new AuthorizationError("permission-denied", "The identity does not match an active clinic profile.");
  }

  return { uid: auth.uid, username, clinicId, role, profile };
}

module.exports = {
  AuthorizationError,
  normalizeUsername,
  requireCallerProfile,
};
