# djay.lab — Dhananjay's Website

Personal website and deep-learning research notebook built with **Jekyll** and styled with **Tailwind CSS v4**.

## Prerequisites

| Tool | Version |
|------|---------|
| Ruby | 3.3 |
| Bundler | 2.6.x |
| Node.js | 24 LTS |
| npm | ≥ 9 |

## Local installation

```bash
git clone https://github.com/undercutspiky/undercutspiky.github.io.git
cd undercutspiky.github.io

# Install Node dependencies (Tailwind CLI)
npm ci

# Install Ruby/Jekyll dependencies
bundle install

# Install the Chromium browser used by the responsive checks
npx playwright install --with-deps chromium
```

## Development

Build CSS in watch mode (auto-rebuilds on changes to `assets/index.css`):

```bash
npm run watch
```

In a second terminal, serve the Jekyll site:

```bash
bundle exec jekyll serve
```

Open `http://localhost:4000`.

## Production CSS build

```bash
npm run build
```

Outputs the minified stylesheet to `assets/css/site.css`.

## Jekyll build

```bash
bundle exec jekyll build --strict_front_matter
```

The built site is written to `_site/`.

## Responsive regression checks

```bash
npm run test:responsive
```

This command rebuilds the CSS, rebuilds the Jekyll site with strict front matter,
and runs the Playwright checks against Home, Research, Blog, About, one generated
blog post, and one generated research entry. Install the Playwright Chromium browser
locally first with `npx playwright install --with-deps chromium`.

## How deployment works

The repository deploys via **GitHub Pages** directly from the `master` branch.
Generated CSS (`assets/css/site.css`) is committed to the repository so GitHub Pages
can serve it without a custom build step.

When you push to `master`:
1. GitHub Pages automatically runs Jekyll and publishes `_site/`.
2. The committed `assets/css/site.css` is copied into `_site/assets/css/site.css`.

> **Switching to Actions-based deployment:** If you add a custom GitHub Actions deploy
> workflow (e.g. using `actions/jekyll-build-pages`), change *Settings → Pages →
> Source* from "Deploy from a branch" to "GitHub Actions". Once you do that you can
> remove the committed `assets/css/site.css` and let CI build it on every push.

## CI

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull
request. It:

1. Installs Node dependencies (`npm ci`)
2. Installs the Playwright Chromium browser and Linux dependencies
3. Builds the production CSS (`npm run build`)
4. Checks that `assets/css/site.css` exists and reports its size
5. Installs Ruby gems (`bundle install`)
6. Builds the Jekyll site with `--strict_front_matter` (fails on Liquid errors)
7. Checks that key output pages exist: `index.html`, `blog.html`, `about.html`,
   `research.html`
8. Runs the responsive Playwright checks and uploads failure screenshots when useful

Pull-request builds do **not** deploy to GitHub Pages.

## Dependency maintenance

- `package-lock.json` and `Gemfile.lock` are committed for reproducible local, CI,
  and GitHub Pages branch builds.
- Dependabot checks npm, Bundler, and GitHub Actions dependencies weekly.
- Patch and minor updates are grouped where practical, while major upgrades stay in
  separate pull requests.

## Creating a blog post

1. Create a new file in `_posts/` using the date-slug pattern:

   ```
   _posts/YYYY-MM-DD-my-post-title.html
   ```

2. Add the required front matter:

   ```yaml
   ---
   layout: blog_post
   title: My Post Title
   image: /assets/images/my-thumbnail.jpg
   description: A one-sentence description for the card preview.
   ---
   ```

3. Write content using the existing `.blog-post` class conventions:

   ```html
   <p class="blog-post">Paragraph text.</p>
   <h2 class="blog-post">Section heading</h2>
   <ul class="blog-post">
     <li>List item</li>
   </ul>
   ```

   Use `<span class="ref">[1]</span>` for inline citations; add a `<ol id="citations">` block at the bottom.

4. Post URLs are auto-generated as `/YYYY/MM/DD/slug.html` — **do not change** the
   date or slug after publication.

## Creating a research entry

1. Create a new Markdown file in `_research/`:

   ```
   _research/my-paper-slug.md
   ```

2. Use the full front-matter schema:

   ```yaml
   ---
   layout: research_item
   title: "Full Paper Title"
   short_title: "Short Title"
   slug: my-paper-slug
   year: 2024
   date: 2024-01-01
   venue: "Conference Name Year"
   status: Published          # Published | Preprint | Ongoing | Project
   authors:
     - "Author One"
     - "Author Two"
   role: "First author"
   featured: false             # set true to show on homepage
   image: /assets/images/my-paper-figure.png
   image_alt: "Alt text for hero image"
   tags:
     - deep learning
     - feature learning
   paper_url: https://...
   preprint_url:
   code_url: https://github.com/...
   project_url:
   video_url:
   slides_url:
   dataset_url:
   doi: 10.xxxx/xxxxx
   citation: "Author et al., 2024."
   bibtex: |
     @inproceedings{...}
   summary: >
     Plain-language summary (2–4 sentences).
   contributions:
     - "First contribution"
     - "Second contribution"
   ---
   ```

   Fields that are left blank or omitted are **not rendered** — no empty buttons or
   labels will appear.

3. Write body content using Markdown headings and paragraphs. The `research_item`
   layout supports these optional sections in the body:
   - `## Motivation`
   - `## Method`
   - `## Main Contributions`
   - `## Key Results`
   - `## Limitations`

4. The page is published at `/research/my-paper-slug/`.

### Linking a blog post to a research entry

In the blog post's front matter add:

```yaml
research:
  - my-paper-slug
```

The research item page will automatically show the linked post under "Related Writing".

## Generated files

| File | Description | Committed? |
|------|-------------|------------|
| `assets/css/site.css` | Minified Tailwind + custom CSS | **Yes** (needed for GitHub Pages) |
| `assets/index.css` | CSS source — edit this, not site.css | Yes (source) |
| `_site/` | Jekyll output — entire website | No (in `.gitignore`) |
| `Gemfile.lock` | Bundler lock for reproducible builds | Yes |

## Troubleshooting

**`npm ci` fails** — delete `node_modules/` and `package-lock.json`, run `npm install`, then re-run `npm ci`.

**CSS not updating** — run `npm run build` and hard-refresh the browser. In watch mode, make sure `npm run watch` is running.

**Jekyll build fails with Liquid error** — run `bundle exec jekyll build --strict_front_matter --verbose` to see the exact error.

**Research entry not appearing** — check that the `_config.yml` `research` collection is present and `layout: research_item` is set in the front matter.

**GitHub Pages shows old content** — GitHub Pages caches aggressively. Wait a few minutes or use a hard refresh (`Ctrl+Shift+R`).
