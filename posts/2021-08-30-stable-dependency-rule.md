---
title: Stable Dependency Rule
description: Stable Dependency Rule
date: 2021-08-30
permalink: /posts/2021-08-30/stable-dependency-rule/index.html
tags:
- Architecture
layout: layouts/post.njk
---

I recently advised someone on how to structure components effectively and I recommended what I called the "Stable Dependency Rule":

> Depend on stable modules and avoid unstable ones.

A "module" in this context refers to a function, class, file, directory, or even a sub-tree of directories in a project.

Assign each module a score from 1-10, where 10 is the most stable (never changes) and 1 is the least stable. Take the following module dependency graph:

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

The Dependency Stability Rule is your module can't be more stable than the least stable module it depends on. In practice this is because when a dependency changes any  code using it must be retested as well.

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

The modules with ratings 8 and 5 have now been downgraded to 4, leading to decreased stability in your app. To enhance stability, consider restructuring your code to depend on more stable modules.

One example of a restructure:

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

In this example the unstable parts from the center module are extracted to it's own module.

I acknowledge that this topic can be abstract and not always consciously considered in code design. However, considering dependencies and stability ratings can improve the structure and maintainability of your codebase. 

For instance, it's acceptable for a `<LoginForm />` to depend on an `<Input />` widely used in the app, but not on a changing `<SearchForm />`. Instability and non-reusability are normal, but it's important to structure them effectively.
