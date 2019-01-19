---
title: Multitenant System Learnings
description: Multitenant System Learnings
date: 2014-01-18
tags:
  - Multitenant
layout: layouts/post.njk
---

Having worked on a couple of multi-tenant projects I thought I'd share my experiences with them.

A multitenant system services multiple clients (tenants) at the same time from a single production. This type of system avoids setting up and maintaining a different production environment for each new client. Multi-tenancy promises better economies of scale and simplify deployment at the expense of additional development complexity.

The trade-off is development complexity. Here is a list of challenges you might face when implementing multi-tenancy:

- **Database design**: characteristic of multitenant systems are their database designs. There are roughly four different approaches, each with its pros and cons:

  - _Separate databases_: use physically separated databases for different tenants. Connections are made to the different databases based on the tenant identifier. This configuration maximimizes data security, is fairly easy to setup but is also the most expensive solution for obvious reasons.

  - _Separate schemas_: the database has one schema for each tenant on a single database instance. Per tenant different connections are made with -usually- different credentials. Data is secured separately from other tenants and only a single DB instance has to be maintained. Some notable cons are: database schema changes become a hassle (you'll need to upgrade multiple schemas) and for each tenant a new schema must be provisioned (some databases advice against scaling out by creating more schemas because this tends to introduce a lot of overhead).

  - _Separate tables within a single schema_: this option simplifies your database connection management -only one set of credentials required- and separates data within that schema fordifferent tenants. This option provides little in the way of data security and database management becomes more of a burden when many tenants are active at the same time. Partitioning or sharding the data will be important and a clean table/collection naming convention is required to keep data management overhead in check. If the system is not able to provision it's own new tables or collections for each new tenant some additional configuration is required within the database for each tenant.

  - _Single table_: stores all tenant data within a single table and separates this with an additional tenant discriminator field. This setup is the least secure of all four (a program error could easily cause access to data of other tenants!) but also requires the least amount of configuration for each new tenant. Some databases support data hiding on a row level (for example, PostgreSQL) allowing you to hide data based on the tenant discriminator. The database will automatically append to each query `WHERE <discriminator_column> = '<tenant_discriminator_value>'` where the discriminator column is one of the columns in the target table. This hides other tenant's data from your current session. When you're using an ORM look if that ORM supports "Row Level Security (RLS)" or "Virtual Private Database (VPD)", it can make your life a lot easier.

- **Security**: security is tricky at the best of times but multi-tenancy takes it to the next level. A mature multi-tenant system ensures no state of any tenant is accessible to any other tenant. This involves not only your database but also memory, caches, sessions, queuing and any other statefull resource or communication mechanism your application may have. Consider something as simple as triggering an event in an eventing system; you only want to notify subscribers of the same tenant rather than all subscribers of all tenants. To deal with these problems try to create a tenant context (or "tenant-sandbox") in the codebase that is difficult to break out of; meaning all resources accessible to the developer are guaranteed to be filtered to the current tenant context as opposed to requiring the developer to filter the resource manually. You can achieve this by wrapping the resource in your own framework and forbidding/preventing further direct access.

- **Deployment**: upgrading a mission critical production platform becomes a whole lot more difficult if it involves a multi-tenant system. True, the deployment team only has to do the upgrade once for all tenants. However, the difficulty lies not in the technical details but with those affected by the upgrade; your customers. The upgrade will affect all tenants, whether they wanted the upgrade or not. This can be a difficult sell, particulary if backwards incompatibilities are introduced. In addition a multi-tenant deployment is likely to receive a whole lot more traffic than a single-tenant system; coordinating downtime between tenants (assuming you can't do a live upgrade) is painful and, depending on the nature of the system, might even be impossible. You'll need a good deployment strategy to cover this.

- **Versioning**: apart from the security and database complexity you should also assume you can't do backwards incompatible changes and have to support old versions for very long, growing the codebase over time. If you don't organize this growth properly, regardless of the nice initial architecture design, it will end up as a big ball of mud. Version your code either in namespaces or directories to keep different versions of the code separated.

- **Logging**: easily overlooked, but consider adding multi-tenancy to your log files either by writing log output to different files for each tenant or adding tenant identifiers to your log entries. If you're writing logs to a database add an additional tenant identifier in there as well. This makes troubleshooting customer-specific issues on a production platform a whole lot easier.

- **Testing**: testing a multitenant system is significantly more complex. The security complexities require testing to cover a lot more scenarios than usual. Try to create automated tests than can be configured to run for different tenants, preferably at the same time and in parallel to reproduce a real-world scenario. Because resources (particulary caches) cannot always be shared in a multi-tenant environment for security reasons they may fill up a lot sooner than you'd expect.

Before starting a multitenant system do consider the development complexities involved. Multitenant systems make sense when buying expensive licenses for your application servers and databases, but they can add significant complexity to your design.
