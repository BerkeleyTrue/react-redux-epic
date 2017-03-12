import { Observable } from 'rxjs/Observable';
import { last } from 'rxjs/operator/last';
import { map } from 'rxjs/operator/map';
import ReactDOM from 'react-dom/server';
import debug from 'debug';

const log = debug('react-redux-epic:render-to-string');

// renderToString(
//   Component: ReactComponent,
//   epicMiddleware: EpicMiddleware
// ) => Observable[String]

export default function renderToString(element, wrappedEpic) {
  try {
    log('initial render pass started');
    ReactDOM.renderToStaticMarkup(element);
    log('initial render pass completed');
  } catch (e) {
    return Observable.throw(e);
  }
  log('calling action$ onCompleted');
  wrappedEpic.end();
  return Observable.create(wrappedEpic.subscribe)
    ::last(null, null, null)
    ::map(() => {
      wrappedEpic.restart();
      const markup = ReactDOM.renderToString(element);
      return { markup };
    });
}
