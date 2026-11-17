const test = require("node:test");
const assert = require("node:assert/strict");
const {
  AuthorizationError,
  normalizeUsername,
  requireCallerProfile,
} = require("../src/auth/authorization");

const makeDatabase = (profile) => ({
  ref(path) {
    assert.equal(path, "KlinikAnaVeritabani/users/alice");
    return {
      async get() {
        return {
          exists: () => profile !== null,
          val: () => profile,
        };
      },
    };
  },
});

const makeRequest = (overrides = {}) => ({
  auth: {
    uid: "auth-uid-1",
    token: {
      username: "alice",
      clinicId: "clinic_alice",
      role: "assistant",
      active: true,
      ...overrides,
    },
  },
});

test("normalizes usernames consistently with the client", () => {
  assert.equal(normalizeUsername(" Alice "), "alice");
  assert.equal(normalizeUsername(null), "");
});

test("rejects unauthenticated requests", async () => {
  await assert.rejects(
    requireCallerProfile({ auth: null }, makeDatabase(null)),
    (error) => error instanceof AuthorizationError && error.code === "unauthenticated",
  );
});

test("rejects requests without trusted identity claims", async () => {
  await assert.rejects(
    requireCallerProfile(makeRequest({ username: undefined }), makeDatabase(null)),
    (error) => error instanceof AuthorizationError && error.code === "permission-denied",
  );
});

test("rejects a missing profile", async () => {
  await assert.rejects(
    requireCallerProfile(makeRequest(), makeDatabase(null)),
    (error) => error instanceof AuthorizationError && error.code === "permission-denied",
  );
});

test("accepts a profile that matches the trusted active identity", async () => {
  const profile = {
    username: "alice",
    clinicId: "clinic_alice",
    role: "assistant",
    active: true,
  };
  const result = await requireCallerProfile(makeRequest(), makeDatabase(profile));
  assert.equal(result.uid, "auth-uid-1");
  assert.equal(result.username, "alice");
  assert.equal(result.clinicId, "clinic_alice");
});

test("rejects mismatched clinic, role, and inactive profiles", async (t) => {
  const cases = [
    ["clinic mismatch", { clinicId: "clinic_other" }],
    ["role mismatch", { role: "clinic_owner" }],
    ["inactive profile", { active: false }],
  ];

  for (const [name, profileOverrides] of cases) {
    await t.test(name, async () => {
      const profile = {
        username: "alice",
        clinicId: "clinic_alice",
        role: "assistant",
        active: true,
        ...profileOverrides,
      };
      await assert.rejects(
        requireCallerProfile(makeRequest(), makeDatabase(profile)),
        (error) => error instanceof AuthorizationError && error.code === "permission-denied",
      );
    });
  }
});

test("treats a missing legacy active flag as active, matching the existing client", async () => {
  const profile = {
    username: "alice",
    clinicId: "clinic_alice",
    role: "assistant",
  };
  const result = await requireCallerProfile(makeRequest(), makeDatabase(profile));
  assert.equal(result.profile.active, undefined);
});
