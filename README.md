# Dr. Rodrigo Benítez Olazar — Portfolio & CV

Personal landing page used as a portfolio and CV for clinical interviews.

## Quick start

1. Open `index.html` in any browser to view the site locally.
2. Open `admin.html` to edit content (default password: `rodrigo2026` — change it; see below).

## How to publish on GitHub Pages (free hosting)

1. Create a new repository on GitHub, e.g. `portfolio`.
2. Copy everything inside this `site/` folder into the root of that repo.
3. Commit and push.
4. In your repo: **Settings → Pages → Source = main branch / root**.
5. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

After that, every time you push a new `data/content.json`, the public site updates.

## Editing content

1. Visit `admin.html` (e.g. `https://<your-username>.github.io/<repo-name>/admin.html`).
2. Enter your password.
3. Edit any field. **Save changes** stores the new content locally in your browser, so the site preview will already reflect them.
4. Click **Export JSON** to download an updated `content.json`. Replace the file in `data/content.json` in your repo, commit, and the public site updates automatically.

## Changing the admin password

1. Open `admin.html` in a browser.
2. Open the developer console (F12) and run:
   ```js
   await sha256("yournewpassword")
   ```
3. Copy the resulting hash.
4. Open `js/admin.js` and replace the `PASSWORD_HASH` constant with the new value.
5. Commit and push.

The password is never stored in plain text in the repo — only its SHA-256 hash. The page is read-only by default; only people who know the password can edit, and even then their changes are local until they export and republish.

## Folder structure

```
site/
├── index.html              # Public site
├── admin.html              # Password-protected editor
├── css/
│   └── styles.css
├── js/
│   ├── main.js             # Public site logic
│   └── admin.js            # Editor logic
├── data/
│   └── content.json        # All editable content (single source of truth)
└── assets/
    ├── profile/            # Your photos (hero, about)
    └── cases/              # Before/after images for portfolio cases
```

## Adding a new case

1. Add the new before/after JPG files to `assets/cases/` (recommended naming: `case-XX-before-wide.jpg` and `case-XX-after-wide.jpg`).
2. In the admin editor, go to **Cases → + Add case**.
3. Fill in the title, description, category and image paths (e.g. `assets/cases/case-22-before-wide.jpg`).
4. Save → Export JSON → commit.

## Tips for great photography

- Use neutral backgrounds and consistent lighting between before/after pairs.
- Crop both images to the same frame and aspect ratio.
- 1100–1400 px on the longest side is plenty for the web; smaller files load faster.
- JPEG quality 80–85 is the sweet spot for clinical photos.

## Tech notes

- Pure HTML / CSS / vanilla JS — no build step, no framework.
- Works on any static host (GitHub Pages, Netlify, Vercel, S3 + CloudFront, your own server).
- Mobile-first responsive layout.
- Print stylesheet included (the page prints cleanly as a CV).
- Lighthouse-friendly: minimal external dependencies (only Google Fonts).

## License

Personal use only. Photographs of patients are used with consent.
