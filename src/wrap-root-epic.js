import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { EPIC_END } from 'redux-observable/lib/EPIC_END';

const endAction = { type: EPIC_END };

export default function wrapRootEpic(rootEpic) {
  let _actions = EmptyObservable.create();
  let lifecycle = EmptyObservable.create();
  let subscription;
  let start;
  function wrappedEpic(actions, ...rest) {
    const results = new Subject();
    start = () => {
      subscription = new Subscriber();
      _actions = new Subject(actions);
      lifecycle = new Subject();
      const _subscription = rootEpic(_actions, ...rest)
        .subscribe(
          action => results.next(action),
          err => { throw err; },
          () => lifecycle.complete()
        );

      subscription.add(_subscription);
    };
    start();
    return results;
  }

  wrappedEpic.subscribe =
    (...args) => lifecycle.subscribe.apply(lifecycle, args);
  wrappedEpic.unsubscribe = () => subscription.unsubscribe();
  wrappedEpic.end = () => {
    _actions.next(endAction);
    _actions.complete();
  };
  wrappedEpic.restart = () => {
    wrappedEpic.unsubscribe();
    _actions.unsubscribe();
    start();
  };

  return wrappedEpic;
}
