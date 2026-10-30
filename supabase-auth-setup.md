# Supabase account setup

The login page uses Supabase Auth for email/password registration, sign-in, email verification, and password recovery. GitHub Pages serves the frontend only; it cannot safely run server-side code. Only a Supabase project URL and publishable (or legacy `anon`) key belong in the public frontend. Never put a service-role key, database password, or AI provider key in this repository.

## Connect the frontend

1. In Supabase, create or open the project and copy its Project URL and publishable key (or legacy anon key).
2. Set `url` and `publishableKey` in [`js/supabase-config.js`](../js/supabase-config.js).
3. In Supabase Authentication settings, enable email/password sign-in and email confirmation.
4. Set the Site URL to `https://maxking0714.github.io/HYDROBOTICS.TECH/`.
5. Add both deployed URLs to the allowed redirect URLs:
   - `https://maxking0714.github.io/HYDROBOTICS.TECH/login.html`
   - `https://maxking0714.github.io/HYDROBOTICS.TECH/reset-password.html`
6. For local testing, serve the site through a local web server (not by opening the HTML files directly) and add its login and reset-password URLs to the redirect allowlist.
7. Test registration and confirm the email link returns to the site. Then test “Forgot your password?” and complete the reset form from the email link.

The repository config file is intentionally blank until the project's public values are supplied. Without them the account forms show a setup message and do not fall back to browser-stored passwords.

## Security boundary

Supabase Auth stores and verifies credentials; the site never writes passwords to local storage. The browser keeps an Auth session so a user remains signed in. The display name, account type, and optional location are user-editable profile metadata and must not be used to authorize privileged actions.

This only connects authentication. Other existing social/community features still use static files or browser storage and are not private or protected user data. The static admin tools are disabled as an authentication route; admin pages themselves are still public frontend code and are not protected. Before collecting or storing personal or business data, move that data behind a backend with database Row Level Security policies, enforce authorization there, and review the site's privacy/retention requirements. GitHub Pages alone cannot provide those protections.
