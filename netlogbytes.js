'use strict';

var babar = require('babar');
// var Chart = require('cli-chart');

console.log('\n\n\n\n');

const trace = require('./trace_Mon_Jul_29_2019_5.40.30_PM.json');

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

const bytesPts = bytesReceivedEvts.map(evt => [normalizeTime(evt.ts), evt.args.params.byte_count]);

let requestCount = 0;
const requestsPts = urlRequestsEvts.map(evt => {
  if (evt.ph === 'b') requestCount++;
  else if (evt.ph === 'e') requestCount--;
  else throw new Error('unexpected phase');

  return [normalizeTime(evt.ts), requestCount];
});

// plot bytes
          // var chart = new Chart({
          //   width: process.stdout.columns - 10,
          //   height: 25,
          //   directon: 'y',
          //   xlabel: 'time (ms)',
          //   ylabel: 'bytes',
          //   // xmax: 3,
          // });

          // const bytesData = bytesPts.map(arr => arr[1]);
          // console.log({bytesData});
          // // chart.bucketize(bytesData);
          // // chart.draw();

console.log(
  babar(bytesPts, {
    color: 'green',
    caption: 'Bytes Received',
    width: process.stdout.columns - 10,
    height: 25,
  })
);

// plot requests
console.log(
  babar(requestsPts, {
    color: 'green',
    caption: 'Requests',
    width: process.stdout.columns - 10,
    height: 25,
  })
);
