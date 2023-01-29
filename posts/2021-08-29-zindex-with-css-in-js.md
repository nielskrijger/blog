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

Managing z-index can be challenging, as demonstrated in these common scenarios:

```css
.header {
    position: sticky;
    z-index: 100; /* Keep sticky header above other content */
}

.popup {
    z-index: 99999; /* Must be the absolute top */
}
```

In a well-established codebase, the z-index values may be disorganized, such as `[-1, 1, 2, 3, 4, 5, 10, 11, 19, 100, 200, 299, ..., 99999]`, posing challenges in choosing the next value or inserting one in between.

Organizing z-index values in an array is a neat approach when using CSS-in-JS libraries (e.g. [styled-components](https://styled-components.com/), [Linaria](https://github.com/callstack/linaria), [JSS](https://github.com/cssinjs/jss), etc.).

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

The array can be used in components as follows:

```jsx
import styled from 'styled-components';
import zIndexes from '../style/zIndexes';

const MyHeader = styled.header`
  z-index: ${zIndexes.header};
`;
```

The advantage of this is approach is that adding a new z-index is simple:

```js
const zIndexOrder = [
  'body',
  'aside', // New
  'header',
  'popup',
];
```

This keeps z-index values automatically updated.

## TypeScript variant

With TypeScript, you can use the following approach:

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

While it may seem complex, it ensures type safety in components:

```jsx
import styled from 'styled-components';
import zIndexes from '../style/zIndexes';

// The following gives an error:
// TS2551: Property 'headr' does not exist on type 'ZIndexRecord'. Did you mean 'header'?
const MyHeader = styled.header`
  z-index: ${zIndexes.headr};
`;
```

## Mind your stacking contexts

A z-index is relative to other elements in a "stacking context," which the main root element (`<html />`) automatically creates. New stacking contexts can be created intentionally and unintentionally through various means [listed on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

Consequently, an element with a high z-index may appear behind an element with a low z-index, which can be confusing.

The most frequent cause of this is using `position` on a parent element while attempting to set a z-index on a child element.

Example:

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
  position: absolute; /* this creates a new stacking context */
  border: 2px dashed DarkRed;
}

.red-child {
  padding: 2rem;
  background-color: IndianRed;
  z-index: 999; /* despite having a high value, red appears behind blue. */
}

.blue-parent {
  position: absolute; /* this creates a new stacking context */
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

Despite the `.red-child { z-index: 999 }`, blue still appears above red because `.red-parent { position: absolute }` creates a new stacking context for `.red-parent`'s children.

A new stacking context affects only the children of an element, not the element itself. Therefore, blue appears above red as both `.blue-parent` and `.red-parent` have a z-index of 0 in the same root stacking context, and the last HTML element drawn is on top.

A common solution is to move the z-index to the positioned element, such as:

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

When using a single `zIndexes`-array, it corresponds to the root stacking context, but unexpected results may occur if multiple stacking contexts exist. To avoid this, limit z-indexes to main positioned elements and use a single array for the whole app. If a separate stacking context is needed, define a separate array for that context, rather than trying to manage all z-indexes in one array.

## SASS

The same approach can be applied using SASS, as shown in [Handling z-index with SASS](https://short.is/writing/handling-z-index-with-sass).

