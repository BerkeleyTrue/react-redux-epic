import test from 'ava';
// import { $$observable } from 'rxjs/symbol/observable.js';
// import { createElement } from 'react';

import { render } from '../src';

test('import render', t => {
  t.is(
    typeof render,
    'function',
    'render is a function'
  );
  t.pass('no tests yet');
});

// test(
//   'render() => Observable',
//   t => {
//     const renderer = render();
//     t.is(typeof renderer[$$observable], 'function');
//   }
// );

// test(
//   'render(element, container) => Observable[rootInstance]',
//   t => {
//     const container = global.document.createElement('div');
//     const element = createElement('h1', null, 'hello world');
//     return render(element, container)
//       .map(inst => {
//         t.true(inst);
//       });
//   }
// );
