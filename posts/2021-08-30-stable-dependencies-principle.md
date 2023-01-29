---
title: Stable Dependencies Principle
description: Stable Dependencies Principle
date: 2021-08-30
permalink: /posts/2021-08-30/stable-dependency-rule/index.html
tags:
- Architecture
layout: layouts/post.njk
---

I recently advised someone on how to structure components effectively and I recommended reading up on the "Stable Dependencies Principle". I phrased it as:

> The stability of your module is limited by the stability of the modules it depends on.

A "module" in this context refers to a function, class, file, directory, or even a sub-tree of directories in a project.

Assign each module a score from 1-10, where 10 is the most stable (never changes) and 1 is the least stable. Take for example the following module dependency graph:

```
   ┌───┐
   │ 9 │
   └─┬─┘
  ┌──┴───┐
┌─┴─┐  ┌─┴─┐
│ 2 │  │ 4 │
└───┘  └─┬─┘
      ┌──┴───┐
    ┌─┴─┐  ┌─┴─┐
    │ 8 │  │ 5 │
    └───┘  └───┘
    
Modules on the bottom depend on modules above.
```

The Stable Dependencies Principle implies your module can't be more stable than the least stable module it depends on. This is because whenever a dependency changes any code using it must be retested as well.

In this example two modules on the bottom ("8" and "5") depend on an unstable module "4". Following the aforementioned rule the updated graph looks like:

```
   ┌───┐
   │ 9 │
   └─┬─┘
  ┌──┴───┐
┌─┴─┐  ┌─┴─┐
│ 2 │  │ 4 │
└───┘  └─┬─┘
      ┌──┴───┐
    ┌─┴─┐  ┌─┴─┐
    │ 4 │  │ 4 │
    └───┘  └───┘
```

The modules with ratings 8 and 5 have now been downgraded to 4. To enhance stability a refactor might look like:

```
    ┌───┐
    │ 9 │
    └─┬─┘
  ┌───┴────╷
  │   stable core
┌─┴─┐    ┬─┴─╷
│ 2 │    │ 8 │
└───┘    ┴─┬─╵
    ┬──────┼──────╷
 extract   │      │
  ┬─┴─╷  ┬─┴─╷  ┬─┴─╷
  │ 4 │  │ 8 │  │ 5 │
  ┴───╵  ┴───╵  ┴───╵
```

In this example the unstable parts from the upstream module were extracted to a separate module which neither "8" or "5" depend on. 

I acknowledge that this topic can be abstract and not always consciously considered in code design. However, considering dependencies and stability can improve the structure and maintainability of your codebase.
