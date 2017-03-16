import test from 'ava';
import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs';
import { $$observable } from 'rxjs/symbol/observable';
import { Component, createElement } from 'react';

import { renderToString, wrapRootEpic } from '../src';

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
    return renderToString()
      .catch(
        err => {
          t.regex(
            err.message,
            /renderToString expects a valid react element/
          );
          return Observable.empty();
        }
      );
  }
);

test(
  'renderToString(ReactElement) => Observable[Error]',
  t => {
    const element = createElement('div', null, 'hello world');
    return renderToString(element)
      .catch(err => {
        t.regex(
          err.message,
          /renderToString expects a wrapped root epic/
        );
        return Observable.empty();
      });
  }
);

test(
  'renderToString(ReactElement, () => {}) => Observable[Error]',
  t => {
    const element = createElement('div', null, 'hello world');
    return renderToString(element, (actions) => actions.ofType('FOO'))
      .catch(err => {
        t.regex(
          err.message,
          /renderToString expects a wrapped root epic/
        );
        return Observable.empty();
      });
  }
);

test('renderToString(element, wrappedEpic) completes',
  t => {
    const element = createElement('div', null, 'hello world');
    const wrappedEpic = wrapRootEpic(actions => Observable
      .interval(1000)
      .mapTo({ type: 'FOO' })
      .takeUntil(actions.last())
    );
    createStore(
      x => x,
      applyMiddleware(createEpicMiddleware(wrappedEpic))
    );
    return renderToString(element, wrappedEpic)
      .do(({ markup }) => {
        t.is(typeof markup, 'string');
      })
      .last();
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
    const wrappedEpic = wrapRootEpic(actions => Observable
      .interval(1000)
      .mapTo({ type: 'FOO' })
      .takeUntil(actions.last())
    );
    createStore(
      x => x,
      applyMiddleware(createEpicMiddleware(wrappedEpic))
    );
    return renderToString(element, wrappedEpic)
      .catch(err => {
        t.regex(
          err.message,
          /Thrower throws/
        );
        return Observable.empty();
      });
  }
);
