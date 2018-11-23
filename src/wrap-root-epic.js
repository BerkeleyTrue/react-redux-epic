
import invariant from 'invariant';
import { Subscriber, Subject } from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import debug from 'debug';

import {
  $$complete,
  $$getObservable,
  $$isWrapped,
  $$unsubscribe
} from './symbols.js';

const endAction = { type: 'EPIC_END' };
const log = debug('react-redux-epic:wrapped-epic');

export default function wrapRootEpic(userEpic) {
  invariant(
    typeof userEpic === 'function',
    'wrapRootEpic expects a function but got %. Happy Coding.',
    userEpic
  );
  let actionsProxy = new Subject();
  let lifecycle = new Subject();
  let subscription;
  function observableEpic(_actions, ...rest) {
    actionsProxy = new Subject();
    subscription = new Subscriber();
    lifecycle = new Subject();

    const results = new Subject();
    const actions = new ActionsObservable(actionsProxy);
    const actionsSubscription = _actions.subscribe(actionsProxy);
    const epicsSubscription = userEpic(...[actions, ...rest])
      .subscribe(
        action => results.next(action),
        err => results.error(err),
        () => {
          log('epics completed');
          lifecycle.complete();
          results.complete();
        }
      );

    subscription.add(epicsSubscription);
    subscription.add(actionsSubscription);
    return results;
  }

  // private methods/properties
  // used internally by render-to-string
  observableEpic[$$isWrapped] = true;
  observableEpic[$$getObservable] = () => lifecycle;
  observableEpic[$$complete] = () => {
    log('completing actions stream');
    actionsProxy.next(endAction);
    actionsProxy.complete();
  };
  observableEpic[$$unsubscribe] = () => {
    log('unsubscribing actions and epic');
    lifecycle.unsubscribe();
    subscription.unsubscribe();
    actionsProxy.unsubscribe();
  };

  return observableEpic;
}
