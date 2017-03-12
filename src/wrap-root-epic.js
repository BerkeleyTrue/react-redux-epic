import 'rxjs';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { EPIC_END } from 'redux-observable/lib/EPIC_END';
import debug from 'debug';

const endAction = { type: EPIC_END };
const log = debug('react-redux-epic:wrapped-epic');

export default function wrapRootEpic(userEpic) {
  let actionsProxy = EmptyObservable.create();
  let lifecycle = EmptyObservable.create();
  let subscription;
  let start;
  let name = `observable(${userEpic.name || 'rootEpic'})`;
  function observableEpic(actions, ...rest) {
    const results = new Subject();
    start = () => {
      subscription = new Subscriber();
      actionsProxy = new Subject();
      // how can we make Subject inherit from the ActionsObservable?
      actionsProxy.ofType = actions.ofType;
      lifecycle = new Subject();
      const actionsSubscription = actions.subscribe(actionsProxy);
      const epicsSubscription = userEpic(actionsProxy, ...rest)
        .subscribe(
          action => results.next(action),
          err => results.error(err),
          () => {
            lifecycle.complete();
            results.complete();
          }
        );

      subscription.add(epicsSubscription);
      subscription.add(actionsSubscription);
    };
    log(`starting ${name}`);
    start();
    return results;
  }

  observableEpic.displayName = name;

  observableEpic.subscribe =
    (...args) => lifecycle.subscribe(...args);
  observableEpic.unsubscribe = () => subscription.unsubscribe();
  observableEpic.end = () => {
    actionsProxy.next(endAction);
    actionsProxy.complete();
  };
  observableEpic.restart = () => {
    log(`restarting ${name}`);
    observableEpic.unsubscribe();
    actionsProxy.unsubscribe();
    start();
  };

  return observableEpic;
}
