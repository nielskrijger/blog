---
title: How to structure code like a pro?
description: How to structure code like a pro?
date: 2021-08-30
permalink: /posts/2021-08-30/how-to-structure-code-like-a-pro/index.html
tags:
- ReactJS
- Architecture
layout: layouts/post.njk
---

Originally I posted this in [reddit.com/r/reactjs](https://www.reddit.com/r/reactjs) replying in a thread with the question **["Where can I learn to structure my code like a pro and use components wisely?"](https://www.reddit.com/r/reactjs/comments/pecpou/where_can_i_learn_to_structure_my_code_like_a_pro/hawrecu/?context=3)**

One particular sentence in the question description stood out to me: *"I still don't know how to reuse components"*.

I remember myself striving for reusability in my first years of programming (and embrace any framework that prominently featured "reusability" in its marketing speak).

My reply consisted of a bunch of tips which went as follows:

## 1. Don't get blindsided by reusability

Most of the code you write in your career is not reusable. Avoid making code reusable that really shouldn't be reusable in the first place. Trying to generalize code prematurely is often very difficult and a waste of effort.

It's perfectly fine if the majority of the code you write is not intended for any sort of reuse.

## 2. But... organizing code is essential

Not making components reusable doesn't mean you shouldn't organize your code, these are two different things.

Organizing code is essential for readability. Plenty of senior devs with loads of experience still struggle to organize code, including me. It's an ongoing effort.

A human brain can only process so many things, and in practice that is quite limited. For example, try to remember the following number: 1984319879. Very few humans are able to recall that number without some tricks and/or significant effort.

Hence thoughtful naming of variables and functions, filenames, directories, and splitting things up helps in navigating your code.

Reusability in software is often not that important as claimed; but organizing your code is.

## 3. Atomic Design

I would recommend reading up on "[Atomic Web Design](https://bradfrost.com/blog/post/atomic-web-design/)". It structures code from high-level to fine-grained with the terms "Atoms => Molecules => Organisms => Templates => Pages" (from small to big components).

"Atomic Design" makes a good foundation on how to structure components.

However, I would avoid naming everything in your codebase "Atom, Molecule, Organism, Template" which quickly becomes confusing; an explicit classification of your components by their type might cause unnecessary discussion (is it a Molecule or an Organism?). Just think of Atomic Web Design as a guideline, not a set design patterns that must be followed rigorously.

## 4. Keep it small & simple

Keeping function/class/file complexity low is tricky. Often code grows and deadlines are short.

A good JavaScript plugin that helps with this is [eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs) (particularly [cognitive complexity](https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/docs/rules/cognitive-complexity.md)). Having an ESLint error yell at you is usually a good trigger to start refactoring. Other languages tend to have similar linters available (at least for Java and Golang I've used them).
 
Even if cognitive complexity of your functions is low; huge files with lots of code are complex and daunthing no matter what you do. As a rough rule of thumb I try to keep files below 300 Lines of Code (LoC), and start to consider restructuring if they grow > 150 LoC. (For Golang that might be a bit higher though ¯\_(ツ)_/¯ )

## 5. Add stable dependencies, avoid unstable dependencies

Try to add dependencies on stable modules, but avoid dependencies on unstable modules. This might be a bit confusing so I'll elaborate a little.

I'm going to define a "module" very broadly here; it can be a function, class, file, a directory of files or even a subtree of directories in a larger project.

Now assign each of these modules a score from 1 to 10, where 10 is the most stable (it never changes), and 1 is the least stable. Let's assume you come up with something like this (the modules with 2 + 4 have a dependency on 9, and 8 + 5 both share a dependency on 4).

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
```

Now the rule is your module can't be more stable than the least stable module it depends on. Think about it; if your dependency changes you should retest whatever code uses that dependency. So by that logic you'd have to update your graph as follows:

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

Notice how the modules that had 8 & 5 are now rated only a 4. The overall stability of your app is weaker given this logic.

Often -not always- there are ways to restructure your code in such a way that you only depend on more stable pieces of code. E.g. you might end up with something like this:

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

Now I'll freely admit this is all very abstract, I'm not consciously assigning "Stability" ratings to my code and figure out how to structure things. I can argue against some of the above logic as well... But I've always found this a good way to think about dependencies (be it internal modules or third-party libs).

For example: is it ok for a `<LoginForm />` to depend on an `<Input />` that is used everywhere in the rest of the app? Yes definitely.

Is it ok for a `<LoginForm />` to depend on a `<SearchForm />` because they share some code? No, probably not since `<SearchForm />` will change for different reasons than `<LoginForm />` would. Instead you'd want to identify and extract the commonalities (but; not prematurely ofcourse ;-) ).

Instability and non-reusable code are perfectly fine; in fact it's probably a big chunck of your codebase. You just need to structure it -which isn't easy-.

Hope this helps!
