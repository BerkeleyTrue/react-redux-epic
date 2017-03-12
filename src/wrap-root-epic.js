import 'rxjs';
import invariant from 'invariant';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { Subject } from 'rxjs/Subject';
import { Subscriber } from 'rxjs/Subscriber';
import { EPIC_END } from 'redux-observable/lib/EPIC_END';
import debug from 'debug';

import {
  $$getObservable,
  $$end,
  $$restart,
  $$isWrapped
} from './symbols.js';

const endAction = { type: EPIC_END };
const log = debug('react-redux-epic:wrapped-epic');

export default function wrapRootEpic(userEpic) {
  invariant(
    typeof userEpic === 'function',
    'wrapRootEpic expects a function but got %. Happy Coding.',
    userEpic
  );
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

  // private methods/properties
  // used internally by render-to-string
  observableEpic[$$isWrapped] = true;
  observableEpic[$$getObservable] = () => lifecycle;
  observableEpic[$$end] = () => {
    log(`ending ${name} actions proxy stream`);
    actionsProxy.next(endAction);
    actionsProxy.complete();
  };
  observableEpic[$$restart] = () => {
    log(`restarting ${name}`);
    observableEpic.unsubscribe();
    actionsProxy.unsubscribe();
    start();
  };

  // user land unsubscribe
  observableEpic.unsubscribe = () => subscription.unsubscribe();
  return observableEpic;
}
