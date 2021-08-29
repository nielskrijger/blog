---
title: useContext + useReducer re-renders
description: Why redux isn't dead just yet
date: 2021-02-16
permalink: /posts/2021-02-16/use-reducer-and-use-context/index.html
tags:
- ReactJS
- JavaScript
layout: layouts/post.njk
---

When `useContext` and `useReducer` were [introduced](https://reactjs.org/docs/hooks-intro.html) in 2019 many of us thought Redux' days were numbered.

A basic implementation would look like this.

```jsx
const reducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

const MyContext = createContext();

const MyContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  const contextValue = { state, dispatch };
  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};
```

Usually there is nothing wrong with this setup, but in one case last year I had a form with hundreds of select fields each with a long list of options. All those selects subscribed to the same context state.

It barely worked. Every time changing one of the select fields would make the page unresponsive for a short time.

From that I learned `useContext` is fairly dumb, it simply re-renders all subscribed components. For example: 

<iframe width="100%" height="250" src="//jsfiddle.net/nielskrijger/L8o26q05/embedded/result" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Notice that by pressing "+1" or "-1" the re-render count of both buttons increases. Let's look at the code of one of those buttons:

```jsx
let buttonIncreaseRenders = 0;

const ButtonIncrease = () => {
  buttonIncreaseRenders += 1;
  const { dispatch } = useContext(MyContext);
  
  const handleClick = () => dispatch({ type: 'increment' });
  
  return (
    <div className="block">
      <button type="input" onClick={handleClick}>+ 1</button>
      This button rendered {buttonIncreaseRenders} times
    </div>
  );
}
```

The button uses the `dispatch` function from `MyContext`. This `dispatch` function never changes, so there should be no need for the button to re-render when it's clicked.

The root of the issue lies with how the context value is defined:

```jsx
const contextValue = { state, dispatch };
```

It includes both `state` and `dispatch`. The `dispatch` never changes, but `state` does which in turn causes all components to re-render.

This issue has [been](https://kentcdodds.com/blog/how-to-use-react-context-effectively) [discussed](https://www.telerik.com/blogs/how-to-use-context-api-with-hooks-efficiently-while-avoiding-performance-bottlenecks) [many](https://markoskon.com/usereducer-and-usecontext-a-performance-problem/) [times](https://hswolff.com/blog/how-to-usecontext-with-usereducer/).

## How to fix?

Generally you shouldn't worry about it too much, a bunch of extra re-renders is not a big deal.

But if like me you do get noticeable performance issues, some solutions are:

1. Split Dispatch and State context.
2. Memoize Context Values
3. Switch to Redux (or similar)

### 1. Split Dispatch and State Context

By splitting `dispatch` and `state` in separate contexts you can avoid unnecessary re-renders for components that only use `dispatch`:

```jsx
const StateContext = createContext();
const DispatchContext = createContext();

const MyContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
};

const ButtonIncrease = () => {
  const dispatch = useContext(DispatchContext);
  
  // ...
}

const StateCount = () => {
  const state = useContext(StateContext);
  
  //...
};
```

<iframe width="100%" height="250" src="//jsfiddle.net/nielskrijger/5oxyhg1n/embedded/result" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

This seems the approach taken by most people and has been [recommended](https://github.com/facebook/react/issues/15156#issuecomment-474590693) by Dan Abramov.

Some limitations however:

- Components depending on a subset of the state still re-render if other parts of the state changes. You can split `state` in even more contexts to address that.
- Splitting contexts makes the API more complex. A `useReducer(...)` returns both `state` and `dispatch`, but when used in context like this you'd have to grab them independently. This can be mitigated by wrapping the API in a set of hooks (e.g. `useChangeCount()` and `useGetCount()`).

### 2. Memoize Context Values

This solution doesn't stop the re-render but limits its impact.

Basically there are two ways to do this. One is to have a parent component pass down context values and prevent the child from re-rendering using `memo`. For example:

```jsx
const ButtonParent = () => {
  const { dispatch } = useContext(MyContext);

  const handleClick = useCallback(() => {
    dispatch({ type: 'increment' });
  }, [dispatch]);

  return (
    <ButtonIncrease onClick={handleClick} />
  );
}

let buttonIncreaseRenders = 0;

const ButtonIncrease = memo(({ onClick }) => {
  buttonIncreaseRenders += 1;

  return (
    <div className="block">
      <button type="input" onClick={onClick}>+ 1</button>
      This button rendered {buttonIncreaseRenders} times
    </div>
  );
});
```

If you already have a parent component passing down props this may be an easy fix.

Often with contexts I find myself using the context values directly within that component. This makes sense as Context is meant to share state between components rather than passing them down. But it does mean hoisting state to a parent component just to prevent re-renders doesn't always make sense.

Alternatively you can cram it into a single component:

```jsx
let buttonDecreaseRenders = 0;

const ButtonDecrease = () => {
  const { dispatch } = useContext(MyContext);
  
  const handleClick = useCallback(() => {
    dispatch({ type: 'decrement' });
  }, [dispatch]);
  
  return useMemo(() => {
    buttonDecreaseRenders += 1;
    return (
      <div className="block">
        <button type="input" onClick={handleClick}>- 1</button>
        This button rendered {buttonDecreaseRenders} times
      </div>
    );
  }, [handleButtonClick]);
}
```

<iframe width="100%" height="250" src="//jsfiddle.net/nielskrijger/7mxndyzj/embedded/result" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Memoizing context values is more flexible than splitting contexts, but comes at the cost of extra complexity throughout your app.

All-in-all this is not a structural solution but a very flexible and powerful fix.

### 3. Switch to Redux (or similar)

Redux `useSelector` has the following properties:

> When an action is dispatched, useSelector() will do a reference comparison of the previous selector result value and the current result value. If they are different, the component will be forced to re-render. If they are the same, the component will not re-render.
>
> [...]
> 
> useSelector() uses strict === reference equality checks by default
> 
> [...]
> 
> The optional comparison function also enables using something like Lodash's _.isEqual() or Immutable.js's comparison capabilities.
> 
> https://react-redux.js.org/api/hooks#useselector

Redux is much more sensible when it comes to re-rendering. If your component uses just 1 property of the state, it will re-render only when that property changes. It's hard to mess up even for developers completely new to ReactJS or hooks.

This, combined with the advanced dev tooling ensures Redux isn't dead just yet.

Alternatively, lots of other state libraries exist for ReactJS with similar properties.

## Final Remarks

This is a problem you might not need to solve but if you do it can cause awkward architectural changes.

Hooks are fairly magical -a language in itself almost- so it's not weird to attribute magical properties to it when it comes to making re-render decisions. In this case however React hooks don't do magic, it's dumb. That's a good thing.

But ReactJS doesn't provide a great elegant solution to solve this problem out-of-the-box.

While this topic is discussed a lot, I imagine it will keep catching people off guard since combining `useContext` and `useReducer` like this is such a natural thing to do.
