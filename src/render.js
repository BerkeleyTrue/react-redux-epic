import { render as _render, unmountComponentAtNode } from 'react-dom';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

// render(
//   Component: ReactComponent,
//   DomContainer: DOMNode
// ) => Observable[RootInstance]

export default function render(Component, DOMContainer) {
  return Observable.create(observer => {
    try {
      _render(Component, DOMContainer, function() {
        observer.next(this);
      });
    } catch (e) {
      return observer.error(e);
    }

    return new Subscription(() => {
      return unmountComponentAtNode(DOMContainer);
    });
  });
}
