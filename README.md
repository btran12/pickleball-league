# Zero 2 League
Pickleball league manager web app (repo: `pickleball-league`)

## Deployment (GitHub Pages)

Pushing to `dev` runs `.github/workflows/deploy-pages.yml`, which typechecks, builds with
`VITE_BASE_PATH=/<repo>/`, and force-pushes `dist/` to the orphan `production` branch.

One-time setup: Settings → Pages → Source = "Deploy from a branch", Branch = `production` /
`/ (root)`. The site is then served at https://btran12.github.io/pickleball-league/.

`production` is generated output — never commit to it by hand. To deploy on demand, use
Actions → "Build and deploy to GitHub Pages" → Run workflow.

The AWS S3/CloudFront path (`./deploy.sh`) is unaffected: it builds without `VITE_BASE_PATH`,
so assets stay rooted at `/`. Delete a stale `dist/` before running it.
