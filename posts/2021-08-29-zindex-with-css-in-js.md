---
title: Managing z-indexes within CSS-in-JS
description: One way to tame your z-indexes
date: 2021-08-29
permalink: /posts/2021-08-29/zindex-with-css-in-js/index.html
tags:
- ReactJS
- CSS
- JavaScript
layout: layouts/post.njk
---

Managing z-indexes can be tricky. You'll undoubtedly be familiar with examples like these:

```css
.header {
    position: sticky;
    z-index: 100; /* Keep sticky header above other content */
}

.popup {
    z-index: 99999; /* Must be the absolute top */
}
```

While it works, it's not particularly elegant. Searching through your codebase for all `z-index` values could easily yield something like `[-1, 1, 2, 3, 4, 5, 10, 11, 19, 100, 200, 299, ..., 99999]`. Have fun choosing the next number in that sequence (or worse, adding something between `2` and `3`).

If your CSS is generated using a CSS-in-JS library (e.g. [styled-components](https://styled-components.com/), [Linaria](https://github.com/callstack/linaria), [JSS](https://github.com/cssinjs/jss)...) a fairly clean way to organize your z-indexes is by defining them in an array:

```js
const zIndexOrder = [
  'body',
  'header',
  'popup',
];

const zIndexes = zIndexOrder.reduce(
  (acc, current, index) => {
    acc[current] = index;
    return acc;
  },
  {}
);

export default zIndexes;
```

Then use it in your component as follows:

```jsx
import styled from 'styled-components';
import zIndexes from '../style/zIndexes';

const MyHeader = styled.header`
  z-index: ${zIndexes.header};
`;
```

The neat thing about this is adding an additional z-index becomes trivial:

```js
const zIndexOrder = [
  'body',
  'aside', // New
  'header',
  'popup',
];
```

The z-index number values automatically update.

## TypeScript variant

In TypeScript you could do the following:

```ts
const zIndexOrder = [
  'body',
  'header',
  'popup',
] as const;

type ZIndexValues = typeof zIndexOrder[number];
type ZIndexRecord = Record<ZIndexValues, number>;

const zIndexes = zIndexOrder.reduce(
  (acc: ZIndexRecord, current: ZIndexValues, index: number) => {
    acc[current] = index;
    return acc;
  },
  {} as ZIndexRecord
);

export default zIndexes;
```

It's a bit convoluted but does guarantee type-safety in your component:

```jsx
import styled from 'styled-components';
import zIndexes from '../style/zIndexes';

// The ollowing gives an error:
// TS2551: Property 'headr' does not exist on type 'ZIndexRecord'. Did you mean 'header'?
const MyHeader = styled.header`
  z-index: ${zIndexes.headr};
`;
```

## Beware your stacking contexts

A z-index is relative to other elements within what's called a "stacking context". The main root element (`<html />`) creates such a stacking context. However, there are various ways you can (usually unknowingly) create a new stacking context. MDN [lists all possible causes](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

As a consequence, an element with a high z-index can be rendered beneath an element with a low z-index. This can be counter-intuitive and confusing at first.

The most common cause for this problem I've seen is when using `position` on some parent element while trying to set a `z-index` on a child element.

For example:

```html
<div class="red-parent">
  <div class="red-child">
    Red
  </div>
</div>

<div class="blue-parent">
  <div class="blue-child">
    Blue
  </div>
</div>
```

```css
.red-parent {
  position: absolute; /* this causes a new stacking context */
  border: 2px dashed DarkRed;
}

.red-child {
  padding: 2rem;
  background-color: IndianRed;
  z-index: 999; /* despite this high value, red still appears below blue */
}

.blue-parent {
  position: absolute; /* this causes a new stacking context */
  top: 4rem;
  left: 3rem;
  border: 2px dashed DarkBlue;
}

.blue-child {
  padding: 2rem;
  background-color: CornflowerBlue;
}
```
![Blue on top of red](/img/z-index-0.png)

Despite `.red-child { z-index: 999 }` the blue block appears on top. This is caused by `.red-parent { position: absolute }` which creates a new stacking context for all of `.red-parent`'s children.

**A new stacking context only affects the element's _children_**; the `z-index` of the positioned element itself is still part of the original stacking context.

That is why blue appears on top of red; both `.blue-parent` and `.red-parent` have the default `z-index: 0`. Because they have the same z-index value within the same root stacking context the last element in HTML is drawn on top (see [Stacking without the z-index property](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/Stacking_without_z-index)).

Usually I fix this issue by moving the z-index to the positioned element. I.e:

```css
.red-parent {
  position: absolute;
  border: 2px dashed DarkRed;
  z-index: 999; /* move z-index to the positioned element */
}

.red-child {
  padding: 2rem;
  background-color: IndianRed;
  /* remove z-index from child */
}
```
![Red on top of blue](/img/z-index-1.png)

## Why does this matter for the `zIndexes`-array approach?

Having only one `zIndexes`-array would logically correspond to one stacking context: the root stacking context.

But; since it's often unclear when a new stacking context is created you could easily end up having one `zIndexes`-array that (tries) to manage multiple stacking contexts. This could lead to unexpected results.

In most layouts I find z-indexes can be limited to the main positioned element and one `zIndexes`-array is all I need for the whole app.

If I really do need a separate stacking context, I'll define a second `zIndexes`-array for that secondary stacking context (e.g. `zMenuIndexes` in `Menu.js`).

My reasoning for this is it is pretty rare to require z-indexes in a non-root stacking context; so it is fine -and arguably preferable- to make that explicit rather than trying to manage all `zIndexes` in a single array.

## SASS

You can do something similar with SASS as well: [Handling z-index with SASS](https://short.is/writing/handling-z-index-with-sass).

