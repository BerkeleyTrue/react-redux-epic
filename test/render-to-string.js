/* eslint-disable react/no-multi-comp */
/* eslint-disable react/prop-types */
import test from 'ava';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { createEpicMiddleware, ofType } from 'redux-observable';
import {
  observable as $$observable,
  interval,
  empty,
  of
} from 'rxjs';
import { Component, createElement } from 'react';

import { renderToString, wrapRootEpic } from '../src';
import {
  catchError,
  tap,
  last,
  mapTo,
  takeUntil,
  switchMap,
  delay
} from 'rxjs/operators';

test('renderToString', t => {
  t.is(
    typeof renderToString,
    'function',
    'renderToString is a function'
  );
  t.pass('no tests yet');
});

test('renderToString(element, wrappedEpic) => Observable',
  t => {
    const element = createElement('div', null, 'hello world');
    const wrappedEpic = wrapRootEpic(actions => actions.ofType('FOO'));
    const renderer = renderToString(element, wrappedEpic);
    t.is(typeof renderer[$$observable], 'function');
  }
);

test('renderToString() => Observable[Error]',
  t => {
    return renderToString().pipe(
      catchError(
        err => {
          t.regex(
            err.message,
            /renderToString expects a valid react element/
          );
          return empty();
        }
      )
    );
  }
);

test(
  'renderToString(ReactElement) => Observable[Error]',
  t => {
    const element = createElement('div', null, 'hello world');
    return renderToString(element).pipe(
      catchError(err => {
        t.regex(
          err.message,
          /renderToString expects a wrapped root epic/
        );
        return empty();
      })
    );
  }
);

test(
  'renderToString(ReactElement, () => {}) => Observable[Error]',
  t => {
    const element = createElement('div', null, 'hello world');
    return renderToString(element, (actions) => actions.ofType('FOO')).pipe(
      catchError(err => {
        t.regex(
          err.message,
          /renderToString expects a wrapped root epic/
        );
        return empty();
      })
    );
  }
);

test('renderToString(element, wrappedEpic) completes',
  t => {
    const element = createElement('div', null, 'hello world');
    const wrappedEpic = wrapRootEpic(actions => interval(1000)
      .pipe(
        mapTo({ type: 'FOO' }),
        takeUntil(actions.pipe(last()))
      )
    );
    const epicMiddleware = createEpicMiddleware();
    createStore(
      x => x,
      applyMiddleware(epicMiddleware)
    );
    epicMiddleware.run(wrappedEpic);
    return renderToString(element, wrappedEpic).pipe(
      tap(({ markup }) => {
        t.is(typeof markup, 'string');
      }),
      last()
    );
  }
);

test(
  'renderToString(thrower: ReactElement, wrappedEpic) => Observable[Error]',
  t => {
    class Thrower extends Component {
      componentWillMount() {
        throw new Error('Thrower throws');
      }
      render() {
        return createElement('div', null, 'Hello World');
      }
    }
    const element = createElement(Thrower);
    const wrappedEpic = wrapRootEpic(
      actions => interval(1000).pipe(
        mapTo({ type: 'FOO' }),
        takeUntil(actions.pipe(last())),
      )
    );

    const epicMiddleware = createEpicMiddleware();

    createStore(
      x => x,
      applyMiddleware(epicMiddleware)
    );

    epicMiddleware.run(wrappedEpic);

    return renderToString(element, wrappedEpic)
      .pipe(
        catchError(err => {
          t.regex(
            err.message,
            /Thrower throws/
          );
          return empty();
        })
      );
  }
);

test('renderToString with fetch completes without error',
  t => {
    class Content extends Component {
      componentWillMount() {
        this.props.dispatch({ type: 'FETCH' });
      }
      render() {
        const { content } = this.props;
        return createElement(
          'div',
          null,
          content
        );
      }
    }
    const rootEpic = actions => actions.pipe(
      ofType('FETCH'),
      switchMap(() => of({
        type: 'FETCH_COMPLETE',
        payload: 'WASSUP!!!'
      })),
      delay(1000)
    );
    function reducer(state = { content: 'fail' }, action) {
      if (action.type === 'FETCH_COMPLETE') {
        return {
          content: action.payload
        };
      }
      return state;
    }
    const wrappedEpic = wrapRootEpic(rootEpic);
    const epicMiddleware = createEpicMiddleware();

    const store = createStore(
      reducer,
      applyMiddleware(epicMiddleware)
    );

    epicMiddleware.run(wrappedEpic);
    const element = createElement(
      Provider,
      { store },
      createElement(
        connect(state => state)(Content),
        null
      )
    );
    return renderToString(element, wrappedEpic)
      .pipe(
        tap(({ markup }) => {
          t.is(typeof markup, 'string');
          t.notRegex(markup, /fail/);
          t.regex(markup, /wassup/i);
          t.snapshot({ markup });
          t.snapshot(store.getState());
        })
      );
  }
);
