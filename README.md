# Bulldogs Track & Field

Website and content studio for **Bulldogs Track & Field**, coached by Sean Freeman in Medicine Hat, Alberta.

**Website:** https://bulldogs-track-field.vercel.app/  
**Instagram:** https://www.instagram.com/bulldogs.trackandfield/

## Programs

- **Cross Country**, competitive: Junior High, High School, College / Open
- **Sprints**, competitive: Junior High, High School, College / Open
- **Open Training**, non-competitive: Junior High, High School, Adult / Open

## What the website includes

- Responsive homepage with authentic Bulldogs photography
- Coach profile, training programs, and a swipeable athlete photo carousel
- Reach Out contact form; inquiries are stored in the Bulldogs admin inbox
- Private content studio at **/#admin** for approved administrators
- Editable headings, descriptions, programs, gallery images, logo, and featured photos
- CSV export and removal of inquiries from the admin inbox

## Stack

Static HTML, CSS, and JavaScript on Vercel, connected to a dedicated Bulldogs area in Supabase:

- **Auth:** Supabase email/password authentication; authorization via `bulldogs_admins`
- **Published content:** `public.bulldogs_content`
- **Contact inquiries:** `public.bulldogs_inquiries`
- **Media uploads:** `bulldogs-media` bucket

The database project also hosts unrelated products. **Do not** modify Pearl Studio or personal portfolio tables, policies, or buckets when working on Bulldogs.

Only browser-safe Supabase publishable keys belong in frontend code. **Never** commit secret/service-role keys. The database enforces row-level security and read-only inquiry access for authorized Bulldogs admins. Anonymous visitors may **insert** contact inquiries only.

### Admin access

Visit `/#admin` and sign in with an existing, authorized Supabase account. Accounts must be explicitly listed in `bulldogs_admins`. Signup alone **does not** grant admin access. Do not insert a coach's account into `bulldogs_admins` without approval.

Changes to website content are published to Supabase. Uploaded photos are stored in Bulldogs-only storage; the public site reads the published URLs.

### Contact messages

Visitors submit **name, email, optional event, and training goals** in the Reach Out form. Messages appear under **Admin → Inquiries**. The inbox shows recent messages, offers CSV export, and supports deletion. Currently, **emails are not sent**. A future email notification service can be added server-side without changing the public form. Never put a private email API key in frontend code.

Note: A public form needs production spam and rate-limit monitoring. A hidden honeypot deters basic bots but is not a substitute for a verified rate limiter or CAPTCHA.

## Run locally

The site uses static files. Serve the repository with a local HTTP server (opening as `file://` can affect browser module/network behavior).

```bash
python -m http.server 8080
```

Open http://localhost:8080/. A network connection is required for Supabase and the pinned browser SDK.

## Tests

The GitHub Actions workflow in `.github/workflows/site-content-tests.yml` runs automatically on changes to `main` and pull requests.

```bash
node --check app.js
node --check bulldogs-backend.js
node --test tests/*.test.cjs
```

Tests exercise content/photo references and mocked Supabase authentication, reads, writes, and media uploads. Passing mocked tests does **not** replace live-browser verification or production end-to-end checks.

## Deployment

GitHub `main` is the canonical source. After merging changes, check the **Production** Vercel deployment and verify the public domain points at the latest commit. A passing GitHub Actions run or Vercel Preview build alone does not prove the production site updated.

## Media and design notes

Keep original athlete/coach faces and use only authentic photographs with permission. The Cross Country and coach images are framed to avoid aggressive cropping. The hero has a lightweight purple/green tint applied through CSS. The current logo uses a visual blending treatment for its white background; **true transparent pixels require a transparent source logo asset**, which can be uploaded in the admin media editor.

## Planned improvements

- Secure rate limiting / CAPTCHA for the public inquiry form
- Optional server-side email notifications to a coach-selected address
- Admin image-crop positioning controls and improved media workflows
