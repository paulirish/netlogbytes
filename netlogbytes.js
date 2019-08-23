'use strict';

var babar = require('./lib/babar');
// var Chart = require('cli-chart');

console.log('\n\n\n\n');

const trace = require('./trace_andent.json');

const netlogEvents = trace.traceEvents
  .filter(evt => evt.cat === 'netlog')
  .sort((a, b) => a.ts - b.ts);

// https://cs.chromium.org/chromium/src/third_party/catapult/netlog_viewer/netlog_viewer/timeline_view.js?l=209-212&rcl=88aae3b05111daa5754f6c098e071d7bf330beb4
const bytesReceivedEvts = netlogEvents.filter(
  e => e.name === 'SOCKET_BYTES_RECEIVED' || e.name === 'UDP_BYTES_RECEIVED'
);
// https://cs.chromium.org/chromium/src/third_party/catapult/netlog_viewer/netlog_viewer/timeline_view.js?l=198-201&rcl=88aae3b05111daa5754f6c098e071d7bf330beb4
const urlRequestsEvts = netlogEvents.filter(
  e => e.name === 'URL_REQUEST' || e.name === 'REQUEST_ALIVE'
);



// const events = urlRequestsEvts;
// console.log('events found: ', events.length);
// console.log(events[events.length - 4]);


// in baseline and put in ms
const timeBaseline = urlRequestsEvts[0].ts;
const normalizeTime = ts => (ts - timeBaseline) / 1000;

const kbytesPts = bytesReceivedEvts.map(evt => [normalizeTime(evt.ts), evt.args.params.byte_count / 1024]);


// requests
let requestCount = 0;
const requestsPts = urlRequestsEvts.map(evt => {
  if (evt.ph === 'b') requestCount++;
  else if (evt.ph === 'e') requestCount--;
  else throw new Error('unexpected phase');

  return [normalizeTime(evt.ts), requestCount];
});

const endTime = [...kbytesPts, ...requestsPts].reduce((max, val) => max = Math.max(max, val[0]), 0);

  // `ResourceReceivedData` is isntrumented in blink and up there the data is received in 65K chunks... very different from what netstack is reporting
  // so its not very useful.. the netlog data is far more precise.

//   // {"pid":82724,"tid":775,"ts":2501412236447,"ph":"I","cat":"devtools.timeline","name":"ResourceReceivedData","s":"t","tts":22381096,"args":{"data":{"requestId":"0CA79BD4942F7524FC5E1DACB0B2D86A","frame":"0EC9F7CAE4ACB0ADE0F324AAB406150B","encodedDataLength":65536.0}}},
// const receivedDataEvts = trace.traceEvents.filter(e => e.name === 'ResourceReceivedData');
// const cdtBytesPts = receivedDataEvts.map(evt => [normalizeTime(evt.ts), evt.args.data.encodedDataLength]);

// console.log(
//   babar(cdtBytesPts, {
//     caption: 'CDT Bytes Received',
//     bucketAgg: 'sum',
//     width: process.stdout.columns - 10,
//     height: 25,
//   })
//   );

const width = process.stdout.columns;
if (width === 0) throw new Error('ZERO COLUMNS WIDTH  WTF');

const opts = {
  width: process.stdout.columns,
  height: 25,
  minX: 0,
  maxX: Math.ceil(endTime / 100) * 100,
};

console.log(
  babar(kbytesPts, {
    color: 'green',
    caption: 'KBytes Received',
    bucketAgg: 'sum',
    ...opts
  })
);

  // plot requests
console.log(
    babar(requestsPts, {
    color: 'cyan',
    caption: 'Requests',
    bucketAgg: 'avg',
    ...opts
  })
);
