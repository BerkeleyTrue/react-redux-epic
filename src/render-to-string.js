import 'rxjs';
import { isValidElement } from 'react';
import ReactDOM from 'react-dom/server';
import invariant from 'invariant';
import debug from 'debug';
import { Observable } from 'rxjs/Observable';

import {
  $$getObservable,
  $$end,
  $$restart,
  $$isWrapped
} from './symbols.js';

const log = debug('react-redux-epic:render-to-string');

// renderToString(
//   Component: ReactComponent,
//   epicMiddleware: EpicMiddleware
// ) => Observable[String]
export default function renderToString(element, wrappedEpic) {
  invariant(
    isValidElement(element),
    `renderToString expects a valid react element bot got %s.
    Make sure you are passing in an element and not a component.
    Happy Coding.
  `);
  invariant(
    wrappedEpic && wrappedEpic[$$isWrapped],
    `renderToString expects a wrapped root epic but got %s.
    Make sure you wrap your root epic
    'const wrappedEpic = wrapRootEpic(rootEpic);'
    and use this wrapped epic in your createEpicMiddleware call
    'const epicMiddleware = createEpicMiddleware(wrappedEpic);'
    Happy Coding.
  `);
  function initialRender() {
    try {
      log('first app render');
      ReactDOM.renderToStaticMarkup(element);
    } catch (e) {
      return Observable.throw(e);
    }
    wrappedEpic[$$end]();
    return wrappedEpic[$$getObservable]();
  }
  return Observable.defer(initialRender)
    .last(null, null, null)
    .map(() => {
      wrappedEpic[$$restart]();
      log('final app render');
      const markup = ReactDOM.renderToString(element);
      return { markup };
    });
}
