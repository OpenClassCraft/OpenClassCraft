# OpenClassCraft launch site

This is the zero-dependency static site for the Founding School Beta. Its primary action is the public school-pilot application issue. Applicants are explicitly told not to include student names or private records.

Build it from the repository root:

```bash
bash website/build.sh
node website/validate.mjs website/dist
```

The generated site is written to `website/dist/`. Serve that directory with any static web server. The build copies the existing, tracked OpenClassCraft icon and world artwork into the generated asset directory, so those large PNG files are not duplicated in Git.

The `website` GitHub Actions workflow builds and deploys this directory to GitHub Pages after a relevant push to `Latest`. The repository owner must select **GitHub Actions** as the Pages publishing source before the first deployment; see [GitHub's custom Pages workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Before public deployment:

1. Verify every price and beta date in `index.html` against the owner-approved school offer.
2. Confirm that the school application template is enabled in GitHub Issues.
3. Configure a private official contact route before asking applicants for personal contact information.
4. Test keyboard navigation, 320 px mobile layout, desktop layout, and all external links.
5. Do not claim a public alpha is available unless a validated asset is present on the Releases page.
