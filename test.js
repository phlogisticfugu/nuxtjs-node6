console.log(process.env, 'process.env');

const promise = new Promise();

async function asyncFunc() {
  console.log('foobar');
}

function* regenfunc() {
}
