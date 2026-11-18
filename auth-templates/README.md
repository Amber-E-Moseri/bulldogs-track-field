# Shared Supabase password recovery: neutral template

This repository includes a **neutral** recovery email that is suitable for all three applications using the same Supabase Auth project. This file is not automatically installed into the Supabase dashboard by GitHub or Vercel.

## Email template installation (shared project configuration)

Supabase project: `cdbeadjwwmakpsmtyguy`.

1. In **Supabase Dashboard → Authentication → Email Templates → Reset Password / Recovery**, export or copy the existing recovery template as a backup.
2. Set the **Subject** to: `Reset your password`.
3. Replace the recovery email **HTML body** with the contents of `auth-templates/password-recovery.html`.
4. Keep the existing SMTP/from-address configuration unchanged. "ACCOUNT SECURITY" in the body is a neutral label, not a changed sender identity.
5. Save and verify that the email renders correctly in a test inbox.

The action link must remain exactly `{{ .ConfirmationURL }}`. Supabase creates the secure confirmation link, checks the token, and then redirects to the allowlisted callback. Do **not** replace this with `{{ .SiteURL }}` or a static Bulldogs link: it would break other applications sharing Auth.

## Bulldog-specific redirect URL (shared allowlist)

In **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

- Verify the *exact* entry `https://bulldogs-track-field.vercel.app/?bulldogs_recovery=1` is allowed.
- If absent, add **only this exact URL**, preserving the Site URL and all existing entries used by other applications.
- Do not replace the global Site URL with Bulldogs.
- Do not add wildcard redirects when an exact URL is enough.
- Do not remove, rename, or alter any other application redirect.

The Bulldogs browser client calls `resetPasswordForEmail(email, { redirectTo: 'https://bulldogs-track-field.vercel.app/?bulldogs_recovery=1' })`. When the secure link is opened, the Bulldogs client verifies its signed-in identity is in `bulldogs_admins` before allowing the password update. Admin role assignment remains separate and unchanged.

## Acceptance test

**Do not use a client account for the first test.** Use a dedicated Bulldogs admin email inbox that you control.

1. Open `https://bulldogs-track-field.vercel.app/#admin`.
2. Select **Forgot password?** and enter the Bulldogs test admin email.
3. Confirm receipt of the neutral email: "Reset your password".
4. Inspect the button URL: it should be a Supabase Auth confirmation URL, not a hard-coded application link.
5. Click the link and verify it returns to the Bulldogs production domain and shows **Choose a new password**.
6. Change the password, verify sign-out, and sign in with the new password.
7. Verify another project's login and its email recovery route still work. **Do not** reset any other user's password.
8. Test expired/invalid recovery links and ensure no unauthorized admin access.

## Scope and deployment

- The neutral email template is **shared Supabase configuration**; editing it in the dashboard changes recovery emails for all three projects.
- The Bulldogs recovery forms are **Bulldogs-only website code** and do not create users or touch RLS.
- Deployment of this code alone does not update shared Supabase Auth settings.
- This integration is **not production-verified** until the email template, redirect allowlist, and acceptance test above succeed.
