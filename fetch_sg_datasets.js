const fs = require('fs');

const DATASETS_URL = 'https://api-production.data.gov.sg/v2/public/api/datasets';
const OUT_CATALOG = 'sg_datasets_all.json';
const OUT_METADATA = 'sg_datasets_metadata.json';
const CONCURRENCY = Number(process.env.METADATA_CONCURRENCY || 10);

async function main() {
  const first = await getJson(`${DATASETS_URL}?page=1`);
  const pages = first.data.pages;
  const datasets = [...first.data.datasets];

  console.log(`Fetching ${pages} catalog pages`);
  for (let page = 2; page <= pages; page += 1) {
    const payload = await getJson(`${DATASETS_URL}?page=${page}`);
    datasets.push(...payload.data.datasets);
    if (page % 50 === 0 || page === pages) {
      console.log(`catalog ${page}/${pages}: ${datasets.length}`);
    }
  }

  fs.writeFileSync(OUT_CATALOG, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: DATASETS_URL,
    pages,
    count: datasets.length,
    datasets
  }, null, 2));

  const existing = fs.existsSync(OUT_METADATA)
    ? JSON.parse(fs.readFileSync(OUT_METADATA, 'utf8'))
    : { metadata: {}, errors: {} };
  const metadata = existing.metadata || {};
  const errors = existing.errors || {};
  const ids = datasets.map((dataset) => dataset.datasetId);

  console.log(`Fetching metadata for ${ids.length} datasets with concurrency ${CONCURRENCY}`);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor];
      cursor += 1;
      try {
        metadata[id] = await fetchMetadata(id);
        delete errors[id];
      } catch (error) {
        errors[id] = error.message || String(error);
      }
      completed += 1;
      if (completed % 100 === 0 || completed === ids.length) {
        writeMetadata(metadata, errors);
        console.log(`metadata ${completed}/${ids.length}, errors=${Object.keys(errors).length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeMetadata(metadata, errors);

  if (Object.keys(errors).length) {
    console.warn(`Metadata completed with ${Object.keys(errors).length} errors. Keeping successful records.`);
  }
}

async function fetchMetadata(id) {
  const url = `${DATASETS_URL}/${encodeURIComponent(id)}/metadata`;
  const payload = await getJson(url, 3);
  if (payload.code !== 0) {
    throw new Error(payload.errorMsg || `API code ${payload.code}`);
  }
  return payload.data;
}

async function getJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(350 * attempt);
      }
    }
  }
  throw lastError;
}

function writeMetadata(metadata, errors) {
  fs.writeFileSync(OUT_METADATA, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    count: Object.keys(metadata).length,
    errorCount: Object.keys(errors).length,
    metadata,
    errors
  }, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
