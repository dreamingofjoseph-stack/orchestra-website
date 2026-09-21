---
name: App Storage browser uploads
description: The reliable upload boundary for browser-based App Storage uploads in this project.
---

Browser uploads to App Storage signed URLs can fail in the Replit preview because the direct cross-origin PUT is subject to storage CORS behavior, even when the signed URL itself is valid.

**Why:** A server-side signed PUT worked while the browser-created object was missing, so the failure was at the browser-to-storage boundary rather than bucket provisioning or URL signing.

**How to apply:** Keep uploads protected by the existing admin/auth guard. Let the browser send image bytes to a same-origin API endpoint, then have the API sign and perform the PUT to App Storage. Serve stored objects through short-lived signed GET redirects.