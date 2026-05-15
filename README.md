# Singapore Public Data Atlas

An interactive static atlas for exploring Singapore's public data.gov.sg catalog.

The site is built from the public dataset listing API and dataset metadata API. It clusters all datasets into exploration topics, scores them for project leverage, and provides lenses for live feeds, map-first datasets, human-stakes datasets, hidden gems, long time arcs, and buildable APIs.

## Local Use

```sh
node fetch_sg_datasets.js
node build_sg_datasets_explorer_data.js
python3 -m http.server 8766 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8766/sg_datasets_explorer.html`.

## Daily Refresh

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` runs once per day at 02:17 Singapore time, fetches fresh data from data.gov.sg, rebuilds `sg_datasets_explorer_data.js`, and deploys the static artifact to GitHub Pages.

The daily job always refreshes the lightweight paginated catalog, then uses a GitHub Actions cache for dataset metadata. Metadata is refetched only when a dataset is new or its catalog `lastUpdatedAt`, name, format, or managing agency changes. The first run fetches every metadata record; normal daily runs should usually fetch only a small changed subset.

## Classification Audit

See `AUDIT_NOTES.md` for the first audit pass and the improvement backlog.
