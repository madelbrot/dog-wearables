import { Buffer } from 'buffer';
declare global { var Buffer: any; }
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
}
