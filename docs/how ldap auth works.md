# How LDAP Auth Works

This document explains how LDAP authentication is wired into the RobEurope app: the flow between frontend and backend, configuration, what gets stored, and how to test and troubleshoot.

## Overview

- The frontend provides a hidden LDAP login dialog (double‑click the login title) where a user enters username and password.
- The backend uses `passport-ldapauth` to authenticate against your LDAP server using a bind DN and search filter.
- On success, we create or link a local “shadow” user (provider = `ldap`) to support roles, relations, and audit logs. We never store the LDAP password.
- A session is created so subsequent requests are authorized like any other provider (Google/GitHub/Apple/LDAP).

## Configuration

The backend reads these environment variables:

- `LDAP_URL` — LDAP server URL (e.g., `ldap://localhost:389` or `ldaps://localhost:636`).
- `LDAP_BIND_DN` — Service account DN used to search (e.g., `cn=admin,dc=example,dc=org`).
- `LDAP_BIND_PASSWORD` — Password for the bind DN.
- `LDAP_SEARCH_BASE` — Base DN for user search (e.g., `ou=users,dc=example,dc=org`).
- `LDAP_SEARCH_FILTER` — Filter template used to locate users by the provided username. Example:
  - `(|(cn={{username}})(mail={{username}})(uid={{username}}))`
  - Add more attributes if needed (e.g., `sAMAccountName`).

Place these in `backend/.env` and restart the backend after changes.

## Authentication Flow

1. User opens hidden LDAP dialog and submits credentials.
2. Frontend POSTs to `/api/auth/ldap` with `{ username, password }`.
3. Backend (Passport LDAP strategy) performs:
   - Bind to LDAP with `LDAP_BIND_DN`/`LDAP_BIND_PASSWORD`.
   - Search under `LDAP_SEARCH_BASE` using `LDAP_SEARCH_FILTER` with `{{username}}` substituted.
   - Attempt user bind with found DN and the provided password.
4. On success:
   - We upsert a local shadow user:
     - provider: `ldap`
     - externalId: the user DN or uid
     - name/email if available from LDAP attributes
     - roles handled locally (e.g., `super_admin`)
   - Serialize user into session.
5. Response returns success and the session cookie; the client can redirect to the appropriate area (e.g., `/admin` for super_admin).

## What We Store (and What We Don’t)

- Stored locally: a minimal shadow user record to support roles/permissions and joins.
- Not stored: the LDAP password. Authentication continues to be validated against LDAP.

If you prefer session-only (no DB record), we can switch to that mode, but you’ll lose some local relations and role tooling unless we rework them to query LDAP groups.

## Frontend Notes

- Hidden trigger: double‑click on the login page title to open the LDAP dialog.
- The dialog collects username/password and calls `/api/auth/ldap`.
- On success, redirect according to role or desired destination.

## Backend Files Involved

- `backend/config/passport.js` — registers the LDAP strategy with env-driven options.
- `backend/routes/api/auth.route.js` — exposes `POST /auth/ldap` and sets session on success.
- `backend/controller/ldap.controller.js` — admin tools for LDAP (e.g., listing users) using the same base DN.
- `backend/init-ldap.js` — optional initializer that creates `ou=users` under the configured base.

## LDAP Directory Requirements

- Users must exist under `LDAP_SEARCH_BASE` (e.g., `ou=users,dc=example,dc=org`).
- Entries should have attributes that match your filter (e.g., `cn`, `mail`, `uid`).
- Ensure `userPassword` (or equivalent) is set so user bind works.

## Testing

- Try logging in with a known user whose DN is under `LDAP_SEARCH_BASE`.
- Use a username that matches one of the attributes in your `LDAP_SEARCH_FILTER`.
- Confirm the user has a valid `userPassword`.
- Check backend logs in `backend/logs/*` for any errors or rejections.

## Troubleshooting

- “Invalid LDAP credentials”:
  - Verify the username matches your search filter attributes.
  - Confirm the entry exists under `LDAP_SEARCH_BASE`.
  - Ensure `userPassword` is set and correct.
- Bind or search errors:
  - Check `LDAP_URL`, `LDAP_BIND_DN`, and `LDAP_BIND_PASSWORD`.
  - Validate TLS certificates if using `ldaps://` (see `backend/certs`).
- No local user created:
  - Confirm the passport LDAP verify callback performs upsert/link on success.
  - Check for model or migration errors in the backend.

## Security Considerations

- Use LDAPS (`ldaps://`) in production and trusted CA certificates.
- Limit the bind DN to minimal privileges required for user search.
- Avoid storing LDAP passwords locally; rely on LDAP for verification.
- Rotate credentials and log access appropriately (`logging-and-rotation.md`).

## Customization

- Add attributes to `LDAP_SEARCH_FILTER` if your directory uses different identifiers (e.g., `sAMAccountName`).
- Map LDAP groups to local roles (e.g., `super_admin`) via attribute inspection or group membership queries.
- Switch to session-only mode if you don’t want a shadow user in the DB, with caveats noted above.

## Change Log

- December 2025:
  - Implemented LDAP auth with `passport-ldapauth`.
  - Added `ou=users` initializer and aligned admin LDAP controller to `LDAP_SEARCH_BASE`.
  - Frontend hidden LDAP dialog via double‑click trigger.
  - Expanded default filter to include `cn`, `mail`, and `uid`.