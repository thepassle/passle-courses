function addsEventListener(ts, node) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node?.expression?.name?.getText?.() === 'addEventListener' &&
    node?.arguments?.[0]?.text === 'fetch'
  ) { 
    return true;
  }
  return false;
}

function respondsWith(ts, node) {
  if (
    ts.isCallExpression(node) && 
    ts.isPropertyAccessExpression(node.expression) &&
    node?.expression?.name?.getText?.() === 'respondWith'
  ) {
    return true;
  }
  return false;
}

function respondsWithFetch(ts, node) {
  if(
    respondsWith(ts, node) &&
    node?.arguments?.[0]?.expression?.getText() === 'fetch' &&
    node?.arguments?.[0]?.arguments?.[0].name?.getText?.() === 'request'
  ) {
    return true;
  }
  return false;
}

export const validators = [
  {
    title: 'Adds a "fetch" event listener on self',
    validate: ({ ts, node, context }) => addsEventListener(ts, node)
  },
  {
    title: 'Uses event.respondWith',
    validate: ({ ts, node, context }) => respondsWith(ts, node)
  },
  {
    title: 'Correctly responds with a fetch request',
    validate: ({ ts, node, context }) => respondsWithFetch(ts, node)
  },
]

export const initial = `/**
* You can write your code for the exercises here,
* for example:
*/

function foo() {
  return 'bar';
}
`;
