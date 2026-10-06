# Security Notes

## Current Scope

This repository is a browser-only prototype. Apache configuration below improves transport security when deployed behind a correctly configured HTTPS virtual host, but it does not make the client-side account system secure. Login checks, admin credentials, account records, and authorization state are visible or modifiable in browser JavaScript/storage. Do not use real passwords, real personal data, or this admin console for production.

The root `.htaccess` redirects non-local HTTP requests to HTTPS and sets baseline response headers when Apache's `mod_rewrite` and `mod_headers` modules are enabled. It intentionally excludes localhost so XAMPP development remains usable. It does not provision or renew a TLS certificate. Configure a valid certificate for the production hostname before publishing; otherwise the redirect will send visitors to a host that cannot complete TLS.

## Required Before Production

- Replace browser-side login and role checks with a server-side identity provider or backend. Store password hashes using a modern password-hashing algorithm; never ship credentials or authorization decisions to the browser.
- Enforce authorization on every server endpoint, use secure `HttpOnly`, `Secure`, and appropriate `SameSite` session cookies, add CSRF protection where applicable, and implement rate limiting and account recovery safely.
- Move user data, messages, moderation decisions, and reports out of `localStorage`; apply encryption in transit and at rest, least privilege, retention limits, backups, and incident response.
- Configure and verify TLS certificate issuance and renewal. Consider adding a restrictive Content Security Policy after removing/allowlisting existing inline scripts and styles.
- Conduct a threat model and independent security review before handling real users or sensitive data.

## Security Checks

After deployment, check the production origin:

1. Request the HTTP URL and verify it redirects to the HTTPS URL.
2. Inspect HTTPS responses for `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
3. Run an OWASP ZAP baseline scan against a staging deployment and investigate every finding; do not scan systems without authorization.
4. Run dependency and secret scans whenever dependencies or deployment configuration change. Re-test authentication and authorization server-side after implementing the backend; browser-only checks cannot validate either.

These are engineering notes, not an ISO/IEC 27001 certification or a guarantee of compliance with any law or security standard.