import { render as _render, unmountComponentAtNode } from 'react-dom';
import { Observable } from 'rxjs/Observable';

// render(
//   element: ReactElement,
//   container: DOMElement,
// ) => Observable[RootInstance]

export default function render(element, container) {
  return Observable.create(observer => {
    try {
      _render(element, container, function() {
        observer.next(this);
      });
    } catch (e) {
      return observer.error(e);
    }

    return () => unmountComponentAtNode(container);
  });
}
