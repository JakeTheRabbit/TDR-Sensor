# GitHub Pages build

The live site is <https://jaketherabbit.github.io/TDR-Sensor/>.

`tools/setup/` remains the source for the offline calculator. `tools/build_site.py`
copies its public assets, renders `docs/*.md` as readable field guides, rewrites
links for the project URL, and verifies every local link and heading anchor.
Configuration and firmware links open their source files on GitHub.

Build with Python 3.12:

```sh
python -m pip install -r tools/site/requirements.txt
python tools/build_site.py
python -m http.server 8764 --directory _site
```

Open <http://localhost:8764/>. The output directory must be empty; use
`--output another-empty-directory` for a separate build. Generated files are not
committed. No credentials or device configuration files are included in the site.

The `Publish setup site` workflow builds and checks changes in pull requests.
Relevant pushes to `main` also deploy the checked artifact to the `github-pages`
environment. GitHub Pages must use **GitHub Actions** as its publishing source.
The workflow can also be run manually from the repository's Actions tab.

## Calculator source

- `calculator.js`: substrate, weighing, shot and dryback arithmetic.
- `units.js`: canonical-to-display conversion for metric, US and UK units.
- `wizard.js`: calibration checks and board-specific YAML generation.
- `diagrams.js`: unit-aware cube, slab and coco drawings and physical print sheets.
- `app.js`: the four-step interface and browser-local project storage.

Generated YAML references an immutable v3 package revision. Update that revision
only after checking the generator against the package's actual entity IDs and
calibration contract. The Pages workflow validates 15 export variants and compiles
one with the reference-import action before publishing.
