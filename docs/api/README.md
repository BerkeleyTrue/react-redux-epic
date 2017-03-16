# API

This document uses [rtype](https://github.com/ericelliott/rtype) for type signatures.

## wrapRootEpic
Wraps your rootEpic in a function that allows `renderToString` to inspect the observables within the epicMiddleware.

### Type

```js
interface WrappedEpic { ...Epic };
```
### usage

```js
import { createEpicMiddleware } from 'redux-observable';
import { wrapRootEpic } from 'react-redux-epic';
import { fetchDataCompleteActionCreator } from './action-creators.js';

const rootEpic = actions => actions.ofType('FETCH').switchMap(() => Observale
  .ajax('/api/data')
  .map(fetchDataCompleteActionCreator);
);

const wrappedEpic = wrapRootEpic(rootEpic);
const epicMiddleware = createEpicMiddleware(wrappedEpic);
```

## renderToString
renderToString takes your wrappedEpic and your react app and will trigger a render, wait for all of your epics to complete, then trigger a final render to 

```js
// typings
renderToString(
  element: ReactElement,
  wrappedEpic: WrappedEpic
) => Observable[{ markup: String }];

// usage

renderToString(<App />, wrappedEpic)
	.subscribe(({ markup }) => {
	  // if using Express
	  res.render('index', { markup });
	});
```

## render


Optional: Wraps `react-dom`'s [render](https://facebook.github.io/react/docs/react-dom.html#render) method in an observable. Calls `next` when the render is complete.

```js
render(element: ReactElement, container: DOMElement) => Observable;
```
### usage
```js
render(<App />, document.getElementById('app-div'))
  .subscribe(() => console.log('rendered!'));
```
