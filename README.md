# Klinik Sistemi

## Local Firebase emulators

The Firebase CLI configuration defaults to the demo project `demo-klinik-sistemi`. Start the Auth, Realtime Database, and Functions emulators with:

```sh
npm run emulators
```

The root `npm install` must complete successfully first; `firebase-tools` is a development dependency.

In another terminal, start Vite with `VITE_USE_FIREBASE_EMULATORS=true` in the local environment. Emulator connections are enabled only in Vite development mode. Never point emulator tests at the production project.

Run the backend authorization unit tests with:

```sh
npm run test:functions
```

The Functions backend currently requires trusted `username`, `clinicId`, `role`, and `active` custom claims and verifies them against `KlinikAnaVeritabani/users/{username}`. Existing accounts have not been provisioned with these claims by this repository, so the callable is not yet integrated into the application. Do not deploy restrictive Realtime Database Rules or treat the backend foundation as a completed production migration.

Cloud Functions deployment and region selection require separate project-level review and explicit approval.
