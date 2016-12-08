import 'rxjs';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { EPIC_END } from 'redux-observable/lib/EPIC_END';

const endAction = { type: EPIC_END };

export default function wrapRootEpic(rootEpic) {
  let actionsProxy = EmptyObservable.create();
  let lifecycle = EmptyObservable.create();
  let subscription;
  let start;
  function wrappedEpic(actions, ...rest) {
    const results = new Subject();
    start = () => {
      subscription = new Subscriber();
      actionsProxy = new Subject();
      // how can subject inherit from ActionsObservable
      actionsProxy.ofType = actions.ofType;
      lifecycle = new Subject();
      const actionsSubscription = actions.subscribe(actionsProxy);
      const epicsSubscription = rootEpic(actionsProxy, ...rest)
        .subscribe(
          action => results.next(action),
          err => { throw err; },
          () => lifecycle.complete()
        );

      subscription.add(epicsSubscription);
      subscription.add(actionsSubscription);
    };
    start();
    return results;
  }

  wrappedEpic.subscribe =
    (...args) => lifecycle.subscribe.apply(lifecycle, args);
  wrappedEpic.unsubscribe = () => subscription.unsubscribe();
  wrappedEpic.end = () => {
    actionsProxy.next(endAction);
    actionsProxy.complete();
  };
  wrappedEpic.restart = () => {
    wrappedEpic.unsubscribe();
    actionsProxy.unsubscribe();
    start();
  };

  return wrappedEpic;
}
