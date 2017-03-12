import ReactDOM from 'react-dom/server';
import debug from 'debug';
import { Observable } from 'rxjs/Observable';
import { defer } from 'rxjs/observable/defer';
import { last } from 'rxjs/operator/last';
import { map } from 'rxjs/operator/map';

const log = debug('react-redux-epic:render-to-string');

// renderToString(
//   Component: ReactComponent,
//   epicMiddleware: EpicMiddleware
// ) => Observable[String]
export default function renderToString(element, wrappedEpic) {
  const observableEpic = Observable.create(wrappedEpic.subscribe);
  function initialRender() {
    try {
      log('first app render');
      ReactDOM.renderToStaticMarkup(element);
    } catch (e) {
      return Observable.throw(e);
    }
    wrappedEpic.end();
    return observableEpic;
  }
  return defer(initialRender)
    ::last(null, null, null)
    ::map(() => {
      wrappedEpic.restart();
      log('final app render');
      const markup = ReactDOM.renderToString(element);
      return { markup };
    });
}
