# API

This document uses [rtype](https://github.com/ericelliott/rtype) for type signatures.

## wrapRootEpic
Wraps your rootEpic in a function that allows `renderToString` to inspect the observables within the epicMiddleware.

### Type Signature

```js
import interface { Epic } from 'redux-observable';

interface WrappedEpic { ...Epic };
```
### Usage

```js
import { createEpicMiddleware } from 'redux-observable';
import { wrapRootEpic } from 'react-redux-epic';
import { createStore  } from 'redux';
import { fetchDataCompleteActionCreator } from './action-creators.js';

const rootEpic = actions => actions.ofType('FETCH').switchMap(() => Observable
  .ajax('/api/data')
  .map(fetchDataCompleteActionCreator);
);

const wrappedEpic = wrapRootEpic(rootEpic);

// Create the epic middleware. 
// See https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware.html for more details
const epicMiddleware = createEpicMiddleware();

// Create the redux store as usual
const store = createStore(...);

// Attach the wrapped epic to the middleware
epicMiddleware.run(wrappedEpic);
```

## renderToString
renderToString takes your wrappedEpic and your react app and will trigger a render, wait for all of your epics to complete, then trigger a final render.

### Type Signature

```js
renderToString(
  element: ReactElement,
  wrappedEpic: WrappedEpic
) => Observable[{ markup: String }];
```

### Usage

```js
import { renderToString } from 'react-redux-epic';

renderToString(<App />, wrappedEpic)
  .subscribe(({ markup }) => {
    // if using Express
    res.render('index', { markup });
  });
```

## render


Optional: Wraps `react-dom`'s [render](https://facebook.github.io/react/docs/react-dom.html#render) method in an observable. Calls `next` when the render is complete.

### Type Signature

```js
render(
  element: ReactElement,
  container: DOMElement
) => Observable;
```
### Usage

```js
import { render } from 'react-redux-epic/client';

render(<App />, document.getElementById('app-div'))
  .subscribe(() => console.log('rendered!'));
```


