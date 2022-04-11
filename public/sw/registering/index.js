function isServiceWorkerRegisterCall(ts, node) {
  if (ts.isCallExpression(node)) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      if (
        node?.expression?.expression?.expression?.getText?.() === 'navigator' && 
        node?.expression?.expression?.name?.getText?.() === 'serviceWorker') {
        if (node?.expression?.name?.getText?.() === 'register') {
          return true;
        }
      }
    }
  }
  return false;
}

export const validators = [
  {
    title: 'Register a service worker',
    validate: ({ ts, node, context }) => isServiceWorkerRegisterCall(ts, node)
  },
  {
    title: 'Register "./sw.js"',
    validate: ({ts, node}) => {
      if(isServiceWorkerRegisterCall(ts, node)) {
        if (node?.arguments?.[0]?.text === './sw.js') {
          return true;
        }
      }
      return false;
    }
  }
]

export const initial = `/**
* You can write your code for the exercises here,
* for example:
*/

function foo() {
  return 'bar';
}
`;

export const resources = [
  {
    title: 'MDN: Navigator.serviceWorker',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Navigator/serviceWorker'
  }
];