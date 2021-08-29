---
title: Managing z-index within css-in-js
description: Why redux isn't dead just yet
date: 2021-08-29
permalink: /posts/2021-08-29/zindex-with-css-in-js/index.html
tags:
- ReactJS
- CSS
- JavaScript
  layout: layouts/post.njk
---

Managing z-indexes can be tricky. You'll undoubtedly be familair with a codebase contain high arbitrary values like these:

```css
.header {
    position: sticky;
    z-index: 100; /* Keep sticky header above other content */
}

.popup {
    z-index: 99999; /* Must be the absolute top */
}
```

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

## Caveats

The main thing to watch out for are [stacking contexts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context).

A z-index is relative to other elements within their own "stacking context". The main root element (`<html />`) creates such a stacking context. However, there are various ways you can (usually unknowingly) create a new stacking context.

As a consequence, an element with a higher z-index can be rendered below an element with a lower z-index. This can be quite confusing.

I usually hit this problem when using `position` on some parent element and `z-index` on a child.

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
![Red on top of blue](/img/z-index-0.png)

Despite red having `z-index: 999` and other elements not overriding the default z-index of 0.
