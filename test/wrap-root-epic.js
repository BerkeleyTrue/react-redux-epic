import { Observable, Subject } from 'rxjs';
import { $$observable } from 'rxjs/symbol/observable.js';
import { ActionsObservable } from 'redux-observable';

import wrapRootEpic from '../src/wrap-root-epic.js';

import test from 'ava';

import {
  $$getObservable,
  $$complete,
  $$unsubscribe
} from '../src/symbols.js';

test('wrapRootEpic', t => {
  t.is(
  typeof wrapRootEpic,
    'function',
    'import wrapRootEpic returns a function'
  );
});

test('wrapRootEpic() throws', t => {
  t.throws(
    () => wrapRootEpic(),
    /wrapRootEpic expects a function/
  );
});

test('wrapRootEpic(epic) should return an epic', t => {
  const epic = () => ActionsObservable.of({ type: 'FOO' });

  const wrappedEpic = wrapRootEpic(epic);
  t.is(
    typeof wrappedEpic,
    'function'
  );
});

test(
  'wrapRootEpic(epic) => (actions: ActionsObservable) => Obs[...actions]',
  t => {
    const epic = actions => actions;
    const wrappedEpic = wrapRootEpic(epic);
    const results = wrappedEpic(ActionsObservable.of({ type: 'FOO' }));
    t.is(
      typeof results[$$observable],
      'function',
      'wrappedEpic returns an observable'
    );
  }
);

test(
  'wrappedEpic(actions) => results will emit actions',
  t => {
    const wrappedEpic = wrapRootEpic(
      actions => actions.mapTo({ type: 'FOO' })
    );

    return wrappedEpic(ActionsObservable.of({ type: 'BAR' }).delay(1))
      .map(action => {
        t.is(action.type, 'FOO');
      });
  }
);

test(
  'wrappedEpic(actions: Observable[Error]) => Observable[Error]',
  t => {
    const wrappedEpic = wrapRootEpic(
      (actions) => actions.mapTo({ type: 'FOO' })
    );
    return wrappedEpic(Observable.throw(new Error('Peanuts are bad')))
      .catch(err => {
        t.regex(err.message, /Peanuts/);
        return Observable.empty();
      });
  }
);

test(
  'wrappedEpic(actions) => actions.ofType is a function',
  t => {
    const actions = ActionsObservable.of({ type: 'FOO' });
    const wrappedEpic = wrapRootEpic(
      (actions) => {
        t.is(typeof actions.ofType, 'function');
        t.is(actions.ofType, ActionsObservable.prototype.ofType);
        return actions.ofType('FOO');
      }
    );
    wrappedEpic(actions);
  }
);

test(
  'wrappedEpic[$$getObservable]() should return the lifecycle observable',
  t => {
    const wrappedEpic = wrapRootEpic(
      (actions) => actions.mapTo({ type: 'FOO' })
    );
    const lifecycle = wrappedEpic[$$getObservable]();
    t.is(typeof lifecycle[$$observable], 'function');
  }
);

test(
  'wrappedEpic[$$complete]() completes lifecycle observable',
  t => {
    const actionsProxy = new Subject();
    const wrappedEpic = wrapRootEpic(
      actions => actions.ofType('PING').mapTo({ type: 'PONG' })
    );
    const results = wrappedEpic(new ActionsObservable(actionsProxy));
    const lifecycle = wrappedEpic[$$getObservable]();

    return results.withLatestFrom(
      lifecycle.startWith(null),
      Observable.defer(() => {
        wrappedEpic[$$complete]();
        return Observable.of(null);
      })
    )
      .last(null, null, null)
      .do(() => { t.pass(); })
      .timeout(500);
  }
);

test(
  'wrappedEpic[$$unsubscribe]() closes lifecycle observable subscription',
  t => {
    const actionsProxy = new Subject();
    const wrappedEpic = wrapRootEpic(
      actions => actions.ofType('PING').mapTo({ type: 'PONG' })
    );
    wrappedEpic(new ActionsObservable(actionsProxy)).subscribe();
    const lifecycle = wrappedEpic[$$getObservable]();
    wrappedEpic[$$unsubscribe]();
    t.true(lifecycle.isStopped);
  }
);
