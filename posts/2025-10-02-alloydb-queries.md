---
title: Useful AlloyDB Queries
description: SQL snippets for investigating and managing AlloyDB’s columnar engine
date: 2025-10-02
permalink: /posts/2025-10-02/alloydb-queries/index.html
tags:
- AlloyDB
- SQL
layout: layouts/post.njk
---

### Investigate current usage

```sql
-- List all tables enabled for the columnar engine
SELECT * FROM g_columnar_relations ORDER BY size DESC;

-- List all columns currently in the columnar engine
SELECT * FROM g_columnar_columns ORDER BY relation_name, column_name;
```

### Manage columnar engine recommendations

```sql
-- Trigger the recommender immediately
SELECT google_columnar_engine_recommend();

-- View recommended columns
SELECT * FROM g_columnar_recommended_columns;

-- Reset recommendations (and drop any auto-added columns)
SELECT google_columnar_engine_reset_recommendation(drop_columns => true);

-- Check the recommendation schedule
SELECT * FROM g_columnar_schedules;
```

### Manually manage the columnar engine

```sql
-- Add ALL columns of a table to the column store
SELECT google_columnar_engine_add(relation => 'public.your_table');

-- Add specific columns
SELECT google_columnar_engine_add(
    relation => 'public.your_table',
    columns  => ARRAY['column1', 'column2']
);

-- (Optional) force a refresh
SELECT google_columnar_engine_refresh(relation => 'public.your_table');

-- Remove ALL columns from the column store
SELECT google_columnar_engine_drop(relation => 'public.your_table');

-- Remove specific columns
SELECT google_columnar_engine_drop(
    relation => 'public.your_table',
    columns  => ARRAY['column1', 'column2']
);
```