## Production: enable /debug-auth

The debug auth page `/debug-auth` is protected by middleware by default. To allow access in production, set the environment variable `ENABLE_DEBUG_AUTH=true` in your deployment environment. Use caution: this page exposes authentication-related debug information and should only be enabled temporarily and only in trusted environments.

Steps:

- Set `ENABLE_DEBUG_AUTH=true` in your production environment (e.g., Vercel project settings → Environment Variables).
- Redeploy your application.

Security note:

- Do not enable this permanently on public-facing production sites.
- Consider enabling only for limited IPs or using temporary feature flags.
