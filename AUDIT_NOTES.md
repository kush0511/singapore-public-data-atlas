# Classification Audit Notes

The first audit pass found several useful improvements, and the quick wins below have been folded into the current build script.

## Applied

- Replaced broad substring matching with token/phrase matching so terms like `rent` no longer match `current`, and `Intellectual Property` no longer classifies as housing/land.
- Added CSV `columnMetadata` parsing, not just GeoJSON properties.
- Added detected join keys such as `town`, `planning_area`, `subzone`, `station`, `year`, `month`, `quarter`, `date`, `postal_code`, `flat_type`, `age`, `sex_gender`, `religion`, and `language`.
- Reworked `combo` and `joinability` scoring around shared grains and complementary schemas.
- Split `project`, `computed`, and `editor` scores in the generated data so editorial picks do not fully overwrite computed discovery.
- Made freshness and coverage calculations reproducible by using the catalog fetch timestamp as the reference date.
- Added lightweight mojibake cleanup for descriptions.

## Next Research Threads

- Replace the topic-center canvas layout with a TF-IDF or embedding layout, then draw topic labels as overlays.
- Collapse huge repeated families, such as census tables and historical weather by year, into expandable clusters.
- Fetch sample rows for promising time-series datasets and generate trend cards for acceleration, reversal, seasonality, and area gaps.
- Generate project cards from detected join keys instead of relying mostly on curated `projectSeeds`.
- Add ethics badges for sensitive datasets such as abuse, inmates, religion, language, health, suicide, and disability.
- Build a small reviewed benchmark set of 100 datasets to regression-test the classifier.
