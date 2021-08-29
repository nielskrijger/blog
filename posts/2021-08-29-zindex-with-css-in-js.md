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

While it works, it's not particularly elegant. Searching through your codebase for all `z-index` values could easily yield something like `[-1, 1, 2, 3, 5, 10, 11, 19, 100, 200, 299, ..., 99999]`. Have fun choosing the next number in that sequence (or worse, adding something between `2` and `3`).

If your CSS is generated using a CSS-in-JS library (e.g. [styled-components](https://styled-components.com/), [Linaria](https://github.com/callstack/linaria), [JSS](https://github.com/cssinjs/jss)...) a fairly neat way to organize your z-indexes is by defining them in an array:

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

The z-index numbers automatically update.

A TypeScript version would look as follows:

```ts
const zIndexOrder = [
  'body',
  'header',
  'popup',
] as const;

type OrderValues = typeof zIndexOrder[number];
type ZIndexes = Record<OrderValues, number>;

const zIndexes = zIndexOrder.reduce(
  (acc: ZIndexes, current: OrderValues, index: number) => {
    acc[current] = index;
    return acc;
  },
  {} as ZIndexes
);

export default zIndexes;
```

It's a bit convoluted but does guarantee type-safety in your component:

```jsx
import styled from 'styled-components';
import zIndexes from '../style/zIndexes';

// The ollowing gives an error:
// TS2551: Property 'headr' does not exist on type 'ZIndexes'. Did you mean 'header'?
const MyHeader = styled.header`
  z-index: ${zIndexes.headr};
`;
```

## Beware your stacking contexts

The main thing to watch out for is managing your [stacking contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

A z-index is relative to other elements within what's called a "stacking context". The main root element (`<html />`) creates such a stacking context. However, there are various ways you can (usually unknowingly) create a new stacking context. MDN [lists all possible causes](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

As a consequence, an element with a higher z-index can be rendered below an element with a lower z-index. This can be quite confusing.

The most common cause for this problem I've seen is when using `position` on some parent element and `z-index` on a child.

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

A new stacking context only affects the element's children; the `z-index` of the positioned element itself is still part of the original stacking context.

That is why blue appears on top of red; both `.blue-parent` and `.red-parent` have the default `z-index: 0`. Because they have the same z-index value within the same root stacking context the last element in HTML is drawn on top (see [Stacking without the z-index property](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/Stacking_without_z-index)).

Often I fix this issue by moving the z-index to the positioned elements. I.e:

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

So how does this affect the `zIndexes`-array approach?

Having only one `zIndexes`-array would logically correspond to one stacking context: the root stacking context.

In most layouts I find z-indexes can be limited to the main positioned element and one `zIndexes`-array is all I need.

If I really do need a separate stacking context, I'll define a second `zIndexes`-array for that specific stacking context as part of that high-level component (e.g. `zMenuIndexes` in `Menu.js`). My reasoning for this is its pretty rare to require explicit z-indexes within a non-root stacking context, so it is fine -and arguably preferable- to make that explicit rather than trying to manage all `zIndexes` in a single array.

## SASS

You can do something similar with SASS as well, check here some examples here: [Handling z-index with SASS](https://short.is/writing/handling-z-index-with-sass).

