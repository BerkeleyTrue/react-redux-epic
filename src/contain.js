import { createElement, PureComponent } from 'react';

import debug from 'debug';
import invariant from 'invariant';

// // Using rtype signatures
// interface Action {
//   type: String,
//   payload?: Any,
//   ...meta?: Object
// }
//
// ActionCreator(...args?) => Action
//
// interface Options {
//   fetchAction?: ActionCreator,
//   getActionArgs?(props: Object, context: Object) => [],
//   isPrimed?(props: Object, context: Object) => Boolean,
//   shouldRefetch?(
//     props: Object,
//     nextProps: Object,
//     context: Object,
//     nextContext: Object
//   ) => Boolean,
// }
//
// interface contain {
//   (options?: Options, Component: ReactComponent) => ReactComponent
//   (options?: Object) => (Component: ReactComponent) => ReactComponent
// }


const log = debug('redux-epic:contain');

const isFunction = x => typeof x === 'function';

export default function contain(options = {}) {
  return Component => {
    const name = Component.displayName || 'Anon Component';
    let action;
    let isActionable = false;
    let hasRefetcher = isFunction(options.shouldRefetch);
    const getActionArgs = isFunction(options.getActionArgs) ?
      options.getActionArgs :
      (() => []);

    const isPrimed = isFunction(options.isPrimed) ?
      options.isPrimed :
      (() => false);

    function runAction(props, context, action) {
      const actionArgs = getActionArgs(props, context);
      invariant(
        Array.isArray(actionArgs),
        `
          ${name} getActionArgs should always return an array
          but got ${actionArgs}. check the render method of ${name}
        `
      );
      return action.apply(null, actionArgs);
    }


    class Container extends PureComponent {

      componentWillMount() {
        const { props, context } = this;
        const fetchAction = options.fetchAction;
        if (!options.fetchAction) {
          log(`Container(${name}) has no fetch action defined`);
          return;
        }
        if (isPrimed(this.props, this.context)) {
          log(`contain(${name}) is primed`);
          return;
        }

        action = props[options.fetchAction];
        isActionable = typeof action === 'function';

        invariant(
          isActionable,
          `
            ${fetchAction} should be a function on Container(${name})'s props
            but found ${action}. Check the fetch options for ${name}.
          `
        );

        runAction(
          props,
          context,
          action
        );
      }

      componentWillReceiveProps(nextProps, nextContext) {
        if (
          !isActionable ||
          !hasRefetcher ||
          !options.shouldRefetch(
            this.props,
            nextProps,
            this.context,
            nextContext
          )
        ) {
          return;
        }

        runAction(
          nextProps,
          nextContext,
          action
        );
      }

      render() {
        return createElement(
          Component,
          this.props
        );
      }
    }

    Container.displayName = `Container(${name})`;
    return Container;
  };
}
