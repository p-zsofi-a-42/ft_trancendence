## Plan
1. **Schema**: add `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin'))` to `users` in db/schema.sql. Use an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` line like the existing refresh_token_enc one, and mirror it in schema.ts. Bootstrap the first admin with a one-off UPDATE or the seed script.

2. **Guard**: add requireAdmin(event) to auth.ts. It calls getServiceUserId, returns 401 if null, loads role from the DB, and returns 403 if it isn't admin. Checking the DB instead of the session means a demotion takes effect immediately.

3. User-service routes (file routing under server/routes/):
	- admin/users/index.get.ts: paginated list
	- admin/users/index.post.ts: create
	- admin/users/[id].get.ts, [id].patch.ts, [id].delete.ts
Select explicit columns so passwordHash and totpSecret never leave the service. Validate id with the same /^\d+$/ check block.post.ts uses.

4. Client helper: callUserService only accepts 'GET' | 'POST', so widen it to include 'PATCH' | 'DELETE'.

5. Web BFF: add web/server/api/admin/users/... routes that mirror the user-service routes. Each calls requireUserSession and forwards with userId. For page gating, add a route middleware. The session user currently holds only { id, name, email } (set in login.post.ts from internal/login.post.ts), so you'd need to add role there. That copy is only for UI; the user service is the real check.

6. UI: an app/pages/admin/users.vue built with Nuxt UI's UTable and UModal. @nuxt/ui is already a module.