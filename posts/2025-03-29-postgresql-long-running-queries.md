---
title: PostgreSQL slow and locked queries
description: Fetching slow and locked queries in PostgreSQL
date: 2025-03-29
permalink: /posts/2025-03-29/postgresql-long-and-locked/index.html
tags:
- PostgreSQL
layout: layouts/post.njk
---

Recently I've found myself needing to check long-running and locked queries in PostgreSQL. Despite a quick search that yields lots of examples, I couldn't quickly find a query that shows *both* long-running queries and blocked statements. Hence;

```sql
SELECT
	pid,
	trim(
		BOTH ' ' FROM
		CONCAT(
			CASE WHEN EXTRACT(hour FROM age(now(), query_start)) > 0
				THEN EXTRACT(hour FROM age(now(), query_start)) || 'h ' ELSE '' END,
			CASE WHEN EXTRACT(minute FROM age(now(), query_start)) > 0
				THEN EXTRACT(minute FROM age(now(), query_start)) || 'm ' ELSE '' END,
			ROUND(EXTRACT(second FROM age(now(), query_start)), 2) || 's'
		)
	) AS duration,
	CASE
        WHEN pg_blocking_pids(pid) = '{}'::int[] THEN NULL
        ELSE pg_blocking_pids(pid)
	END AS blocked_by_pids,
	datname AS database,
	state,
	wait_event_type,
	wait_event,
	query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY now() - pg_stat_activity.query_start DESC NULLS LAST;
```

Example output:

| pid   | duration | blocked_by_pids | database | state               | wait_event_type | wait_event     | query                                     |
|-------|----------|-----------------|----------|---------------------|-----------------|----------------|-------------------------------------------|
| 67534 | 4h 28m 4.11s | null            | pagila   | idle in transaction | Client          | ClientRead     | SHOW TRANSACTION ISOLATION LEVEL   |
| 67597 | 4h 27m 52.01s | {67534}         | pagila   | active              | Lock            | transactionid  | UPDATE test_table SET data = 'updated value' WHERE id = 1 |

