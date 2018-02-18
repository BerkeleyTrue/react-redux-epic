declare module 'react-redux-epic' {
  import { Observable } from 'rxjs/Observable';
  import { Epic } from 'redux-observable';

  type Action = {
    type: string;
  };

  export function wrapRootEpic<T extends Action, S, D = any>(
    epic: Epic<T, S, D>,
  ): typeof epic;

  export function renderToString<P, T extends Action, S, D = any>(
    element: React.ReactElement<P>,
    wrappedEpic: Epic<T, S, D>,
  ): Observable<{ markup: string }>;
}

declare module 'react-redux-epic/client' {
  import { Observable } from 'rxjs/Observable';
  export function render<P>(
    element: React.ReactElement<P>,
    container: Element,
  ): Observable<undefined>;
}
