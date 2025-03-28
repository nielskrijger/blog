---
title: PostgreSQL table sizes
description: How to fetch the size of tables in PostgreSQL
date: 2025-02-08
permalink: /posts/2025-02-08/postgresql-table-sizes/index.html
tags:
- PostgreSQL
layout: layouts/post.njk
---

# PostgreSQL Table Sizes

I often forget how to check the size of a table in Postgres, as well as the differences between `pg_table_size`, `pg_relation_size`, and `pg_total_relation_size`. The best explanation I’ve found is in this [Stack Overflow thread](https://stackoverflow.com/questions/41991380/whats-the-difference-between-pg-table-size-pg-relation-size-pg-total-relatio).

Here’s a query to list the size of all tables in a database:

```sql
-- total_relation_size = relation_size + toast_size + index_size
-- relation_size = size of the table’s main data (heap)
-- toast_size = storage for oversized column data stored off-page
-- index_size = disk space used by its indexes.
WITH table_sizes AS (
    SELECT
        ns.nspname AS schema_name,
        c.relname,
        pg_total_relation_size(c.oid) AS total_relation_size,
        pg_relation_size(c.oid) AS relation_size,
        pg_indexes_size(c.oid) AS index_size,
        pg_table_size(c.oid) AS table_size,
        pg_table_size(c.oid) - pg_relation_size(c.oid) AS toast_size
    FROM pg_class c
             JOIN pg_namespace ns ON c.relnamespace = ns.oid
    WHERE ns.nspname NOT LIKE 'pg_%'
      AND ns.nspname != 'information_schema'
      AND c.relkind = 'r' -- only select regular tables
)
SELECT
    schema_name AS schema,
    relname AS table_name,
    pg_size_pretty(total_relation_size) AS total_size,
    pg_size_pretty(relation_size) AS relation_size,
    pg_size_pretty(toast_size) AS toast_size,
    pg_size_pretty(index_size) AS index_size
FROM  table_sizes
ORDER BY
    total_relation_size DESC,
    relation_size DESC,
    toast_size DESC,
    index_size DESC
;
```

Example output:

| schema | table_name  | total_size | relation_size | toast_size | index_size |
|--------|-------------|------------|---------------|------------|------------|
| pagila | customers   | 420 MB     | 350 MB        | 40 MB      | 30 MB      |
| pagila | orders      | 300 MB     | 250 MB        | 30 MB      | 20 MB      |
| pagila | order_items | 800 MB     | 700 MB        | 50 MB      | 50 MB      |
| pagila | products    | 150 MB     | 120 MB        | 10 MB      | 20 MB      |
| pagila | categories  | 75 MB      | 60 MB         | 5 MB       | 10 MB      |
| pagila | suppliers   | 100 MB     | 80 MB         | 5 MB       | 15 MB      |
| pagila | payments    | 60 MB      | 50 MB         | 3 MB       | 7 MB       |