const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('sg_datasets_all.json', 'utf8'));
const metadata = JSON.parse(fs.readFileSync('sg_datasets_metadata.json', 'utf8')).metadata;
const buildReferenceTime = Date.parse(catalog.fetchedAt) || Date.now();

const datasets = catalog.datasets.map((dataset) => ({
  ...dataset,
  ...(metadata[dataset.datasetId] || {}),
  managedByAgencyName: dataset.managedByAgencyName || metadata[dataset.datasetId]?.managedBy || 'Unknown'
}));

const termSets = {
  live: [
    'real-time', 'realtime', 'updated every five minutes', 'minute-by-minute', 'minute', 'availability',
    'traffic', 'taxi', 'carpark', 'flood alert', 'lightning', 'forecast', 'weather', 'wbgt',
    'temperature', 'humidity', 'wind speed', 'wind direction', 'psi', 'pm2.5', 'uvi'
  ],
  geo: [
    'geojson', 'planning area', 'subzone', 'town', 'location', 'locations', 'address',
    'coordinates', 'mrt', 'bus stop', 'road', 'route', 'park', 'school', 'clinic', 'centre',
    'hawker', 'cycling', 'network', 'map', 'polygon'
  ],
  housing: [
    'hdb', 'resale', 'rental', 'rent', 'residential property', 'private residential',
    'dwelling', 'flat', 'household', 'ura', 'housing', 'landed', 'condominium'
  ],
  economy: [
    'cpi', 'price', 'prices', 'inflation', 'gdp', 'trade', 'exports', 'imports',
    'retail', 'business', 'entities', 'employment', 'unemployment', 'wage', 'income',
    'labour', 'vacancy', 'productivity', 'tourism', 'industry'
  ],
  human: [
    'dementia', 'disability', 'elderly', 'vulnerable', 'abuse', 'health', 'disease',
    'hospital', 'death', 'mortality', 'birth', 'fertility', 'drug', 'rehabilitation',
    'inmate', 'prison', 'suicide', 'cancer', 'education', 'marriage', 'divorce',
    'religion', 'language', 'ethnic', 'sex', 'age group'
  ],
  culture: [
    'library', 'newspaper', 'museum', 'arts', 'heritage', 'hawker', 'sports',
    'religion', 'language', 'dialect', 'shimbun', 'syonan'
  ],
  safety: [
    'crime', 'offence', 'fire', 'fatalities', 'casualties', 'accident', 'flood',
    'dengue', 'aedes', 'pollution', 'hazardous', 'workplace fatalities'
  ],
  time: [
    'annual', 'monthly', 'quarterly', 'daily', 'weekly', 'historical', 'time series',
    'census', 'trend', 'index'
  ],
  rareStory: [
    'dementia', 'vulnerable adult', 'abuse', 'drug rehabilitation', 'inmates',
    'religion', 'language literate', 'hawker centres closure', 'syonan', 'shimbun',
    'coastal and marine habitat', 'tree conservation', 'disability services',
    'neighbourhood police centre', 'birth order', 'mother’s education', "mother's education",
    'cause of death', 'suicide', 'lightning', 'aedes', 'flood alerts'
  ]
};

const manualScores = new Map(Object.entries({
  d_e2d10e591bc8560b8946a0da24790fa5: 98,
  d_dbfabf16158d1b0e1c420627c0819168: 97,
  d_5d060d8b7838a15e8906fb22c50dbf51: 95,
  d_9bde6cb42dce64ebaf2dc7ccc2db6201: 95,
  d_3a6a142859398cd6b14f8a071b8f4cf3: 95,
  d_b51323a474ba789fb4cc3db58a3116d4: 94,
  d_e25662f1a062dd046453926aa284ba64: 94,
  d_6cdb6b405b25aaaacbaf7689bcc6fae0: 93,
  d_f1404e08587ce555b9ea3f565e2eb9a3: 93,
  d_a58564fbed922609a0f79af96069dd9b: 93,
  d_949f02d8e5f54488a5d6a48a6d9f5e50: 92,
  d_18f1b1597c10ef1c347d56e8f66f3d68: 92,
  d_ca933a644e55d34fe21f28b8052fac63: 92,
  d_87884af1f85d702d4f74c6af13b4853d: 91,
  d_5767147db6e5b4c4cfa874db132fef39: 90,
  d_8fd4e04e7058ee19521d123caf28a855: 90,
  d_bda4baa634dd1cc7a6c7cad5f19e2d68: 89,
  d_bc1c53268697009babf3918cd37771b7: 89,
  d_5dec466b08a55497218daf8bafbfe96c: 88,
  d_37d905893542417ee27c2f9153c08330: 88,
  d_52b9eabe398353bd6acd9aee15b13f72: 87,
  d_6a8d81084dfcb26248545b8a91362ce6: 87,
  d_63bfb01a27595bedef08da39a344402c: 86,
  d_c49410cc1e293b0a7213a433ab612067: 86,
  d_23f946fa557947f93a8043bbef41dd09: 86,
  d_bdaff844e3ef89d39fceb962ff8f0791: 85,
  d_c11c0b0de3184d7c2a4e6edbdb19c2d5: 85,
  d_313bb58d4f9eac8d301e5b1f7230e420: 84,
  d_ba347562a01a85401078d3d70ca720ad: 84,
  d_6580738cdd7db79374ed3152159fbd69: 82
}));

const manualReasons = new Map(Object.entries({
  d_e2d10e591bc8560b8946a0da24790fa5: 'care infrastructure · map-ready · aging society angle',
  d_dbfabf16158d1b0e1c420627c0819168: 'outbreak geography · live-ish · joins with weather',
  d_5d060d8b7838a15e8906fb22c50dbf51: 'mosquito risk layer · map-ready · joins with dengue',
  d_9bde6cb42dce64ebaf2dc7ccc2db6201: 'accessibility services · map-ready · service-desert analysis',
  d_3a6a142859398cd6b14f8a071b8f4cf3: 'sensitive vulnerability signal · aging society angle',
  d_b51323a474ba789fb4cc3db58a3116d4: 'town-level housing prices · flat type granularity',
  d_e25662f1a062dd046453926aa284ba64: 'live mobility supply · joins with weather and events',
  d_6cdb6b405b25aaaacbaf7689bcc6fae0: 'live road cameras · immediate visual surface',
  d_f1404e08587ce555b9ea3f565e2eb9a3: 'real-time flood alerts · disruption signal',
  d_a58564fbed922609a0f79af96069dd9b: 'religion by planning area · cultural geography',
  d_949f02d8e5f54488a5d6a48a6d9f5e50: 'rehabilitation and education · rare public signal',
  d_18f1b1597c10ef1c347d56e8f66f3d68: 'language literacy by planning area · civic identity map',
  d_ca933a644e55d34fe21f28b8052fac63: 'live parking pressure · estate-level utility',
  d_87884af1f85d702d4f74c6af13b4853d: 'heat stress metric · public health and outdoor work',
  d_5767147db6e5b4c4cfa874db132fef39: 'offences by police centre · local safety geography',
  d_8fd4e04e7058ee19521d123caf28a855: 'cycling network geometry · mobility gaps',
  d_bda4baa634dd1cc7a6c7cad5f19e2d68: 'hawker closure calendar · everyday city rhythm',
  d_bc1c53268697009babf3918cd37771b7: 'wartime newspaper archive · searchable history surface',
  d_5dec466b08a55497218daf8bafbfe96c: 'monthly accident casualties · transport safety pulse',
  d_37d905893542417ee27c2f9153c08330: 'marine habitats · ecological geography',
  d_52b9eabe398353bd6acd9aee15b13f72: 'tree conservation areas · protected urban nature',
  d_6a8d81084dfcb26248545b8a91362ce6: 'library search API · archive/product surface',
  d_63bfb01a27595bedef08da39a344402c: 'design filings API · innovation pulse',
  d_c49410cc1e293b0a7213a433ab612067: 'patent filings API · invention timeline',
  d_23f946fa557947f93a8043bbef41dd09: 'carpark geometry · pairs with live availability',
  d_bdaff844e3ef89d39fceb962ff8f0791: 'monthly CPI since 1961 · cost-of-living backbone',
  d_c11c0b0de3184d7c2a4e6edbdb19c2d5: 'monthly trade composition · economic structure',
  d_313bb58d4f9eac8d301e5b1f7230e420: 'business births · startup and cycle signal',
  d_ba347562a01a85401078d3d70ca720ad: 'business closures · stress and churn signal',
  d_6580738cdd7db79374ed3152159fbd69: 'weather input layer · useful when combined'
}));

const projectSeeds = [
  {
    id: 'city-disruption',
    name: 'City Disruption Lab',
    question: 'Can you detect city stress as rain, lightning, floods, traffic images, taxis, and parking all move together?',
    ids: [
      'd_f1404e08587ce555b9ea3f565e2eb9a3',
      'd_08238953fe0f6dd13f10714ebfbcb9f9',
      'd_6cdb6b405b25aaaacbaf7689bcc6fae0',
      'd_e25662f1a062dd046453926aa284ba64',
      'd_ca933a644e55d34fe21f28b8052fac63',
      'd_6580738cdd7db79374ed3152159fbd69'
    ]
  },
  {
    id: 'care-geography',
    name: 'Ageing & Care Geography',
    question: 'Where do care points, disability services, elderly population, and vulnerability signals line up or fail to line up?',
    ids: [
      'd_e2d10e591bc8560b8946a0da24790fa5',
      'd_9bde6cb42dce64ebaf2dc7ccc2db6201',
      'd_3a6a142859398cd6b14f8a071b8f4cf3',
      'd_986539e65706d7d1c3ee4fc47c403db3',
      'd_3d227e5d9fdec73f3bcadce671c333a6'
    ]
  },
  {
    id: 'dengue-microclimate',
    name: 'Dengue + Microclimate',
    question: 'Can outbreak geography be read alongside Aedes hotspots, rainfall, humidity, heat, and wind?',
    ids: [
      'd_dbfabf16158d1b0e1c420627c0819168',
      'd_5d060d8b7838a15e8906fb22c50dbf51',
      'd_6580738cdd7db79374ed3152159fbd69',
      'd_2d3b0c4da128a9a59efca806441e1429',
      'd_66b77726bbae1b33f218db60ff5861f0',
      'd_7677738484067741bf3b56ab5d69c7e9'
    ]
  },
  {
    id: 'housing-pressure',
    name: 'Housing Pressure Atlas',
    question: 'How do resale prices, rents, incomes, population, town geography, and transport access move together?',
    ids: [
      'd_b51323a474ba789fb4cc3db58a3116d4',
      'd_14f63e595975691e7c24a27ae4c07c79',
      'd_647dabde09e726b9eeb75e4d9cd96699',
      'd_6d878eb9c5a47f54fee7ce496f681e8d',
      'd_3f172c6feb3f4f92a2f47d93eed2908a'
    ]
  },
  {
    id: 'identity-atlas',
    name: 'Civic Identity Atlas',
    question: 'What does Singapore look like when mapped by language, religion, dwelling type, age, and education?',
    ids: [
      'd_a58564fbed922609a0f79af96069dd9b',
      'd_18f1b1597c10ef1c347d56e8f66f3d68',
      'd_5c4667aee18cb4b99528b9d98effb579',
      'd_986539e65706d7d1c3ee4fc47c403db3'
    ]
  },
  {
    id: 'mobility-friction',
    name: 'Mobility Friction',
    question: 'Where do roads, bus stops, cameras, cycling paths, accidents, taxis, and carparks reveal friction in movement?',
    ids: [
      'd_e25662f1a062dd046453926aa284ba64',
      'd_6cdb6b405b25aaaacbaf7689bcc6fae0',
      'd_8fd4e04e7058ee19521d123caf28a855',
      'd_3f172c6feb3f4f92a2f47d93eed2908a',
      'd_5dec466b08a55497218daf8bafbfe96c',
      'd_69b3380ad7e51aff3a7dcc84eba52b8a'
    ]
  },
  {
    id: 'archive-machine',
    name: 'Archive Machine',
    question: 'Can public archives become a searchable, visual time machine rather than a static catalog?',
    ids: [
      'd_bc1c53268697009babf3918cd37771b7',
      'd_6fe660ee98460d1be880580f99e86da1',
      'd_6a8d81084dfcb26248545b8a91362ce6',
      'd_39d77f60d11fbb9c85cb102e59ca0d08',
      'd_bdc72edbd61f04946913f47d079240e7'
    ]
  },
  {
    id: 'innovation-pulse',
    name: 'Innovation Pulse',
    question: 'Can trademarks, patents, designs, and business births show what Singapore is trying to build next?',
    ids: [
      'd_63bfb01a27595bedef08da39a344402c',
      'd_c49410cc1e293b0a7213a433ab612067',
      'd_313bb58d4f9eac8d301e5b1f7230e420',
      'd_ba347562a01a85401078d3d70ca720ad'
    ]
  }
];

const topicDefs = [
  ['Live city', ['live', 'traffic', 'taxi', 'carpark', 'flood', 'lightning', 'weather', 'forecast', 'rainfall', 'temperature', 'humidity', 'wind', 'availability']],
  ['Health & vulnerability', ['dementia', 'disability', 'elderly', 'vulnerable', 'abuse', 'health', 'disease', 'dengue', 'aedes', 'hospital', 'death', 'drug', 'rehabilitation', 'suicide', 'cancer']],
  ['Maps & infrastructure', ['geojson', 'planning area', 'subzone', 'road', 'park', 'school', 'bus stop', 'cycling', 'building', 'land', 'map', 'location']],
  ['Housing & land', ['hdb', 'resale', 'rent', 'rental', 'residential property', 'private residential', 'dwelling', 'flat', 'housing', 'ura', 'landed']],
  ['Economy & work', ['cpi', 'gdp', 'trade', 'retail', 'business', 'employment', 'unemployment', 'wage', 'income', 'labour', 'industry', 'productivity']],
  ['People & identity', ['population', 'census', 'religion', 'language', 'ethnic', 'age group', 'sex', 'household', 'marriage', 'birth', 'fertility', 'education']],
  ['Culture & archives', ['library', 'newspaper', 'museum', 'arts', 'heritage', 'hawker', 'sports', 'syonan', 'shimbun']],
  ['Safety & environment', ['crime', 'offence', 'fire', 'accident', 'fatalities', 'casualties', 'pollution', 'coastal', 'marine', 'tree', 'conservation']]
];

const centers = {
  'Live city': [0.78, 0.24],
  'Health & vulnerability': [0.72, 0.66],
  'Maps & infrastructure': [0.50, 0.36],
  'Housing & land': [0.40, 0.62],
  'Economy & work': [0.31, 0.71],
  'People & identity': [0.58, 0.76],
  'Culture & archives': [0.22, 0.45],
  'Safety & environment': [0.66, 0.42],
  Other: [0.30, 0.28]
};

const agencyCounts = countBy(datasets, (d) => d.managedByAgencyName);
const formatCounts = countBy(datasets, (d) => d.format || 'Unknown');

const familyCounts = countBy(datasets, (d) => familyKey(d.name));

const enriched = datasets.map((dataset) => {
  const format = dataset.format || 'Unknown';
  const fields = getFields(dataset);
  const fieldText = fields.map((field) => `${field.name} ${field.title} ${field.type}`).join(' ');
  const text = makeText(`${dataset.datasetId} ${dataset.name} ${dataset.description || ''} ${dataset.managedByAgencyName} ${format} ${fieldText}`);
  const geoFields = dataset.geoJsonMetadata?.properties || [];
  const joinKeys = detectJoinKeys(fields, text.raw);
  const spanYears = coverageYears(dataset.coverageStart, dataset.coverageEnd, format, dataset.status);
  const updatedDays = daysSince(dataset.lastUpdatedAt);
  const family = familyKey(dataset.name);
  const topic = pickTopic(text);
  const termScore = (set) => countTerms(text, termSets[set]);
  const fieldNames = fields.map((field) => field.name || field.title).filter(Boolean);
  const schemaGeo = joinKeys.some((key) => ['town', 'planning_area', 'subzone', 'station', 'lat_lon', 'postal_code', 'address'].includes(key));
  const schemaTime = joinKeys.some((key) => ['year', 'month', 'quarter', 'date', 'timestamp'].includes(key));
  const schemaValue = fields.some((field) => /numeric|number|integer|decimal|float|year|quarter|date/i.test(field.type || '') || /count|rate|price|index|value|total|amount|incidence/i.test(`${field.name} ${field.title}`));

  const live = clamp(
    termScore('live') * 12 +
    (format === 'API' ? 28 : 0) +
    (text.raw.includes('updated every five minutes') ? 26 : 0) +
    (updatedDays <= 30 ? 8 : updatedDays <= 120 ? 5 : 0),
    0,
    100
  );

  const geo = clamp(
    termScore('geo') * 8 +
    (format === 'GEOJSON' ? 42 : 0) +
    (geoFields.length ? Math.min(16, geoFields.length * 1.8) : 0) +
    (schemaGeo ? 20 : 0),
    0,
    100
  );

  const human = clamp(termScore('human') * 8 + termScore('safety') * 5, 0, 100);
  const macro = clamp(termScore('economy') * 8 + termScore('housing') * 9, 0, 100);
  const time = clamp((spanYears ? Math.min(36, spanYears * 0.65) : 0) + termScore('time') * 9 + (schemaTime ? 14 : 0), 0, 100);
  const rareAgency = Math.max(0, 18 - Math.log2(agencyCounts[dataset.managedByAgencyName] || 1) * 2.2);
  const rareFamily = Math.max(0, 18 - Math.log2(familyCounts[family] || 1) * 4);
  const hidden = clamp(termScore('rareStory') * 15 + rareAgency + rareFamily + (dataset.datasetSize > 1000000 ? 8 : 0), 0, 100);

  const usability = clamp(
    (format === 'API' ? 34 : format === 'GEOJSON' ? 32 : format === 'CSV' ? 22 : 8) +
    (dataset.datasetSize ? 10 : 0) +
    (updatedDays <= 365 ? 8 : 0) +
    (fields.length ? 10 : 0) +
    (schemaValue ? 8 : 0) +
    (geoFields.length ? 8 : 0),
    0,
    100
  );

  const joinability = clamp(
    joinKeys.length * 12 +
    (schemaGeo && schemaTime ? 16 : 0) +
    (schemaGeo && schemaValue ? 12 : 0) +
    (schemaTime && schemaValue ? 10 : 0) +
    (format === 'GEOJSON' ? 12 : 0) +
    (format === 'API' ? 10 : 0),
    0,
    100
  );
  const nonZeroAxes = [live, geo, human, macro, time, hidden].filter((v) => v >= 35).length;
  const combo = clamp(
    nonZeroAxes * 10 +
    joinability * 0.62 +
    (live > 45 && geo > 40 ? 16 : 0) +
    (geo > 40 && human > 45 ? 16 : 0) +
    (macro > 45 && geo > 25 ? 10 : 0) +
    (hidden > 55 && usability > 40 ? 12 : 0),
    0,
    100
  );

  const computedPotential = Math.round(
    live * 0.12 +
    geo * 0.17 +
    human * 0.14 +
    macro * 0.10 +
    time * 0.08 +
    hidden * 0.17 +
    usability * 0.10 +
    combo * 0.22
  );
  const editorPick = manualScores.get(dataset.datasetId) || 0;
  const projectScore = Math.round(clamp(
    computedPotential * 0.82 + editorPick * 0.18 + (editorPick ? 14 : 0),
    computedPotential,
    100
  ));

  const signals = [];
  if (live >= 45) signals.push('live feed');
  if (geo >= 48) signals.push('map-ready');
  if (human >= 45) signals.push('human stakes');
  if (macro >= 45) signals.push('macro signal');
  if (time >= 45) signals.push('long timeline');
  if (hidden >= 50) signals.push('underexplored');
  if (combo >= 45) signals.push('combines well');
  if (!signals.length) signals.push(topic.toLowerCase());

  const reason = manualReasons.get(dataset.datasetId) || reasonFor({ format, live, geo, human, macro, time, hidden, combo, topic, spanYears, fieldCount: fields.length, joinKeys });
  const relatedProjects = projectSeeds.filter((project) => project.ids.includes(dataset.datasetId)).map((project) => project.id);
  const [cx, cy] = centers[topic] || centers.Other;
  const jitter = hashUnit(dataset.datasetId);
  const x = clamp(cx + (projectScore - 50) / 350 + (jitter.a - 0.5) * 0.17, 0.04, 0.96);
  const y = clamp(cy + (jitter.b - 0.5) * 0.18, 0.07, 0.93);

  return {
    datasetId: dataset.datasetId,
    name: dataset.name,
    agency: dataset.managedByAgencyName,
    status: dataset.status,
    format,
    description: cleanDescription(dataset.description),
    lastUpdatedAt: dataset.lastUpdatedAt,
    coverageStart: dataset.coverageStart,
    coverageEnd: dataset.coverageEnd,
    datasetSize: dataset.datasetSize || 0,
    fieldCount: fields.length,
    fields: fieldNames.slice(0, 12),
    joinKeys,
    family,
    topic,
    signals,
    reason,
    relatedProjects,
    scores: {
      project: clamp(projectScore, 0, 100),
      computed: clamp(computedPotential, 0, 100),
      editor: editorPick,
      live: Math.round(live),
      geo: Math.round(geo),
      human: Math.round(human),
      macro: Math.round(macro),
      time: Math.round(time),
      hidden: Math.round(hidden),
      combo: Math.round(combo),
      joinability: Math.round(joinability),
      usability: Math.round(usability)
    },
    spanYears: spanYears ? Number(spanYears.toFixed(1)) : 0,
    updatedDays,
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4))
  };
}).sort((a, b) => b.scores.project - a.scores.project || a.name.localeCompare(b.name));

const byId = new Map(enriched.map((dataset) => [dataset.datasetId, dataset]));
const projects = projectSeeds.map((project) => ({
  ...project,
  ids: project.ids.filter((id) => byId.has(id)),
  datasets: project.ids.filter((id) => byId.has(id)).map((id) => ({
    datasetId: id,
    name: byId.get(id).name,
    topic: byId.get(id).topic,
    format: byId.get(id).format
  }))
}));

const topics = topicDefs.map(([name]) => ({
  name,
  count: enriched.filter((dataset) => dataset.topic === name).length,
  center: centers[name]
})).concat([{ name: 'Other', count: enriched.filter((dataset) => dataset.topic === 'Other').length, center: centers.Other }]);

const topWords = {};
const stop = new Set('and the of by for to in with from as at on over into per a an or across singapore data dataset datasets number total annual quarterly monthly age sex type status rate resident residents persons years year group source updated frequency'.split(' '));
for (const dataset of datasets) {
  const words = normalize(dataset.name).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !stop.has(word));
  for (const word of new Set(words)) topWords[word] = (topWords[word] || 0) + 1;
}

const payload = {
  fetchedAt: catalog.fetchedAt,
  metadataFetchedAt: JSON.parse(fs.readFileSync('sg_datasets_metadata.json', 'utf8')).fetchedAt,
  source: catalog.source,
  pages: catalog.pages,
  count: catalog.count,
  generatedAt: new Date().toISOString(),
  agencies: Object.entries(agencyCounts).sort((a, b) => b[1] - a[1]),
  formats: Object.entries(formatCounts).sort((a, b) => b[1] - a[1]),
  topics,
  words: Object.entries(topWords).sort((a, b) => b[1] - a[1]).slice(0, 120),
  projects,
  datasets: enriched
};

fs.writeFileSync('sg_datasets_explorer_data.js', `window.SG_DATASETS=${JSON.stringify(payload)};\n`);
console.log(enriched.slice(0, 20).map((dataset, index) => `${index + 1}. ${dataset.scores.project}\t${dataset.name}\t${dataset.reason}`).join('\n'));

function normalize(value) {
  return decodeMojibake(String(value || ''))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u2018\u2019]/g, "'");
}

function makeText(value) {
  const raw = normalize(value);
  const tokens = new Set(raw.split(/[^a-z0-9.]+/).filter(Boolean));
  return { raw, tokens };
}

function cleanDescription(value) {
  return decodeMojibake(String(value || 'No description provided in the catalog metadata.'))
    .replace(/\s+/g, ' ')
    .replace(/\u2800/g, ' ')
    .trim();
}

function countTerms(text, terms) {
  return terms.reduce((count, term) => {
    const normalized = normalize(term);
    if (normalized.includes(' ')) return count + (text.raw.includes(normalized) ? 1 : 0);
    return count + (text.tokens.has(normalized) ? 1 : 0);
  }, 0);
}

function pickTopic(text) {
  let best = ['Other', 0];
  for (const [topic, terms] of topicDefs) {
    const score = countTerms(text, terms);
    if (score > best[1]) best = [topic, score];
  }
  return best[1] ? best[0] : 'Other';
}

function daysSince(value) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return 99999;
  return Math.max(0, Math.round((buildReferenceTime - time) / 86400000));
}

function coverageYears(start, end, format, status) {
  const a = Date.parse(start);
  let b = Date.parse(end);
  if (!Number.isFinite(b) && Number.isFinite(a) && (format === 'API' || String(status).toLowerCase() === 'active')) {
    b = buildReferenceTime;
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, (b - a) / 31557600000);
}

function getFields(dataset) {
  if (dataset.geoJsonMetadata?.properties) {
    return dataset.geoJsonMetadata.properties.map((field) => ({
      name: field.attribute || '',
      title: field.attribute || '',
      type: field.dataType?.label || field.dataType?.value || '',
      source: 'geojson'
    }));
  }

  const columnMetadata = dataset.columnMetadata;
  if (!columnMetadata?.order || !columnMetadata?.map) return [];

  return columnMetadata.order.map((id) => {
    const meta = columnMetadata.metaMapping?.[id] || {};
    return {
      name: columnMetadata.map[id] || meta.name || '',
      title: meta.columnTitle || meta.name || columnMetadata.map[id] || '',
      type: meta.dataType || '',
      source: 'column'
    };
  });
}

function detectJoinKeys(fields, rawText) {
  const text = normalize(`${rawText} ${fields.map((field) => `${field.name} ${field.title} ${field.type}`).join(' ')}`);
  const names = new Set(fields.flatMap((field) => normalize(`${field.name} ${field.title}`).split(/[^a-z0-9]+/).filter(Boolean)));
  const joined = normalize(fields.map((field) => `${field.name} ${field.title}`).join(' '));
  const keys = [];
  const add = (key, condition) => { if (condition) keys.push(key); };

  add('year', names.has('year') || /\byyyy\b/.test(text));
  add('month', names.has('month') || /\bmonthly\b/.test(text));
  add('quarter', names.has('quarter') || /\bquarterly\b|\bq[1-4]\b/.test(text));
  add('date', names.has('date') || /\bdate\b/.test(joined));
  add('timestamp', names.has('timestamp') || /\btime\b/.test(joined));
  add('town', names.has('town'));
  add('planning_area', joined.includes('planning area') || joined.includes('pln area'));
  add('subzone', names.has('subzone'));
  add('station', names.has('station') || joined.includes('station id') || joined.includes('weather station'));
  add('lat_lon', names.has('latitude') || names.has('longitude') || names.has('lat') || names.has('lon') || names.has('lng') || names.has('x') && names.has('y'));
  add('postal_code', joined.includes('postal code') || names.has('postal'));
  add('address', names.has('address'));
  add('flat_type', joined.includes('flat type'));
  add('age', joined.includes('age group') || names.has('age'));
  add('sex_gender', names.has('sex') || names.has('gender'));
  add('ethnicity', names.has('ethnic') || names.has('ethnicity'));
  add('religion', names.has('religion'));
  add('language', names.has('language'));
  add('school', names.has('school'));
  add('industry', names.has('industry') || names.has('ssic'));
  add('occupation', names.has('occupation'));
  add('npc', names.has('npc') || joined.includes('neighbourhood police centre'));

  return [...new Set(keys)];
}

function countBy(values, fn) {
  return values.reduce((acc, value) => {
    const key = fn(value) || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function familyKey(name) {
  return normalize(name)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(annual|monthly|quarterly|weekly|daily|census|survey|from|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/g, ' ')
    .replace(/\bby\b.+$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 90) || normalize(name).slice(0, 90);
}

function reasonFor(metrics) {
  const parts = [];
  if (metrics.geo >= 48) parts.push(metrics.format === 'GEOJSON' ? 'map-ready geography' : 'place-level structure');
  if (metrics.live >= 45) parts.push('fresh operational signal');
  if (metrics.human >= 45) parts.push('human-stakes subject');
  if (metrics.hidden >= 50) parts.push('unusual public-data angle');
  if (metrics.macro >= 45) parts.push('policy/economic signal');
  if (metrics.time >= 45) parts.push(`${Math.round(metrics.spanYears)} years of time depth`);
  if (metrics.combo >= 45) parts.push('strong join potential');
  if (metrics.joinKeys?.length) parts.push(`joins on ${metrics.joinKeys.slice(0, 3).join(', ')}`);
  if (metrics.fieldCount >= 8) parts.push(`${metrics.fieldCount} fields`);
  if (!parts.length) parts.push(`${metrics.topic.toLowerCase()} dataset`);
  return parts.slice(0, 3).join(' · ');
}

function decodeMojibake(value) {
  return String(value || '')
    .replace(/Ã‚Â/g, ' ')
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, '-')
    .replace(/Â/g, ' ');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashUnit(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 10000) / 10000;
  h = Math.imul(h ^ 0x9e3779b9, 16777619);
  const b = ((h >>> 0) % 10000) / 10000;
  return { a, b };
}
