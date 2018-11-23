import { isValidElement } from 'react';
import ReactDOM from 'react-dom/server';
import invariant from 'invariant';
import debug from 'debug';

import { defer, throwError } from 'rxjs';
import { delay, last, map } from 'rxjs/operators';


import {
  $$complete,
  $$getObservable,
  $$isWrapped,
  $$unsubscribe
} from './symbols.js';


const log = debug('react-redux-epic:render-to-string');

// renderToString(
//   Component: ReactComponent,
//   epicMiddleware: EpicMiddleware
// ) => Observable[String]
export default function renderToString(element, wrappedEpic) {
  function initialRender() {
    invariant(
      isValidElement(element),
      `renderToString expects a valid react element bot got %s.
      Make sure you are passing in an element and not a component.
      Happy Coding.`
    );
    invariant(
      wrappedEpic && wrappedEpic[$$isWrapped],
      `renderToString expects a wrapped root epic but got %s.
      Make sure you wrap your root epic
      'const wrappedEpic = wrapRootEpic(rootEpic);'
      and use this wrapped epic in your createEpicMiddleware call
      'const epicMiddleware = createEpicMiddleware();'
      'epicMiddleware.run(wrappedEpic);'
      Happy Coding.`
    );
    try {
      log('first app render');
      ReactDOM.renderToStaticMarkup(element);
    } catch (e) {
      return throwError(e);
    }
    wrappedEpic[$$complete]();
    return wrappedEpic[$$getObservable]();
  }
  return defer(initialRender).pipe(
    // allow wrappedEpic[$$complete](); to complete before calling unsubscribe
    // otherwise this could
    delay(0),
    last(null, null, null),
    map(() => {
      wrappedEpic[$$unsubscribe]();
      log('final app render');
      const markup = ReactDOM.renderToString(element);
      return { markup };
    })
  );
}
