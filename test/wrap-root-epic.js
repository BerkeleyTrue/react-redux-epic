import {
  Subject,
  observable as $$observable,
  throwError,
  defer,
  of,
  empty
} from 'rxjs';
import { ActionsObservable, ofType } from 'redux-observable';

import wrapRootEpic from '../src/wrap-root-epic.js';

import test from 'ava';

import {
  $$getObservable,
  $$complete,
  $$unsubscribe
} from '../src/symbols.js';
import {
  delay,
  map,
  catchError,
  mapTo,
  startWith,
  tap,
  last,
  timeout,
  withLatestFrom
} from 'rxjs/operators';

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
      actions => actions.pipe(map(() => ({ type: 'FOO' })))
    );

    return wrappedEpic(ActionsObservable.of({ type: 'BAR' }).pipe(delay(1)))
      .pipe(
        map(action => {
          t.is(action.type, 'FOO');
        })
      );
  }
);

test(
  'wrappedEpic(actions: Observable[Error]) => Observable[Error]',
  t => {
    const wrappedEpic = wrapRootEpic(
      (actions) => actions.pipe(mapTo({ type: 'FOO' }))
    );
    return wrappedEpic(throwError(new Error('Peanuts are bad')))
      .pipe(
        catchError(err => {
          t.regex(err.message, /Peanuts/);
          return empty();
        })
      );
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
      (actions) => actions.pipe(mapTo({ type: 'FOO' }))
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
      actions => actions.ofType('PING').pipe(mapTo({ type: 'PONG' }))
    );
    const results = wrappedEpic(new ActionsObservable(actionsProxy));
    const lifecycle = wrappedEpic[$$getObservable]();

    return results.pipe(
      withLatestFrom(
        lifecycle.pipe(startWith(null)),
        defer(() => {
          wrappedEpic[$$complete]();
          return of(null);
        })
      )
    ).pipe(
      last(null, null, null),
      tap(() => { t.pass(); }),
      timeout(500)
    );
  }
);

test(
  'wrappedEpic[$$unsubscribe]() closes lifecycle observable subscription',
  t => {
    const actionsProxy = new Subject();
    const wrappedEpic = wrapRootEpic(
      actions => actions.pipe(ofType('PING'), mapTo(() => ({ type: 'PONG' })))
    );
    wrappedEpic(new ActionsObservable(actionsProxy)).subscribe();
    const lifecycle = wrappedEpic[$$getObservable]();
    wrappedEpic[$$unsubscribe]();
    t.true(lifecycle.isStopped);
  }
);
