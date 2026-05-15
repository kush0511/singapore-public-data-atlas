const fs = require('fs');

const DATASETS_URL = 'https://api-production.data.gov.sg/v2/public/api/datasets';
const OUT_CATALOG = 'sg_datasets_all.json';
const OUT_METADATA = 'sg_datasets_metadata.json';
const CONCURRENCY = Number(process.env.METADATA_CONCURRENCY || 10);

async function main() {
  let page = 1;
  let pages = 1;
  const byId = new Map();

  console.log('Fetching catalog pages');
  while (page <= pages) {
    const payload = await getJson(`${DATASETS_URL}?page=${page}`);
    pages = Math.max(pages, Number(payload.data.pages || pages));
    for (const dataset of payload.data.datasets || []) {
      byId.set(dataset.datasetId, dataset);
    }
    if (page % 50 === 0 || page === pages) {
      console.log(`catalog ${page}/${pages}: ${byId.size}`);
    }
    page += 1;
  }

  const datasets = [...byId.values()];
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
  const catalogById = new Map(datasets.map((dataset) => [dataset.datasetId, dataset]));
  const ids = datasets
    .filter((dataset) => shouldRefreshMetadata(dataset, metadata[dataset.datasetId]))
    .map((dataset) => dataset.datasetId);

  for (const id of Object.keys(metadata)) {
    if (!catalogById.has(id)) delete metadata[id];
  }
  for (const id of Object.keys(errors)) {
    if (!catalogById.has(id)) delete errors[id];
  }

  console.log(`Metadata cache has ${Object.keys(metadata).length} current records`);
  console.log(`Fetching metadata for ${ids.length} new or changed datasets with concurrency ${CONCURRENCY}`);
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

function shouldRefreshMetadata(catalogDataset, cachedMetadata) {
  if (!cachedMetadata) return true;
  return cachedMetadata.lastUpdatedAt !== catalogDataset.lastUpdatedAt ||
    cachedMetadata.name !== catalogDataset.name ||
    cachedMetadata.format !== catalogDataset.format ||
    (cachedMetadata.managedBy && cachedMetadata.managedBy !== catalogDataset.managedByAgencyName);
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
