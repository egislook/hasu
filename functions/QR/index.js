const qr      = require('qr-image');

const { fail, svg} = require('../../utils/helpers');

module.exports = async (configs = {}) => {
  if(!configs)
    return fail("There is no configs to generatte QR.")

  const { type = 'svg' } = configs

  try{

    switch (type) {
      case 'svg':
        return svg(await toSvgQr({ ...configs }));
      case 'png':
        return svg(await toPngQr(configs));
      case 'pdf':
        return svg(await toPdfQr(configs));
      default:
        return svg(await toSvgQr({ ...configs }));
    }

  } catch(error){ return fail(error) }
}

function toSvgQr(data = 'clik') {
  data = typeof data === 'object' ? JSON.stringify(data) : data;

  return new Promise((resolve, reject) => {
    let string = '';
    const stream = qr.image(data, { type: 'svg' });
    stream.on('data', (buffer) => { string += buffer.toString() });
    stream.on('end', () => resolve('data:image/svg+xml;base64,' + Buffer.from(string).toString('base64')));
  });
}

function toPngQr(data = clik) {
  data = typeof data === 'object' ? JSON.stringify(data) : data;

  return new Promise((resolve, reject) => {
    const stream = qr.imageSync(data, { type: 'png', margin: 1, size: 20 });
    resolve('data:image/png;base64,' + Buffer.from(stream).toString('base64'))
  });
}

function toPdfQr(data = 'clik') {
  data = typeof data === 'object' ? JSON.stringify(data) : data;

  return new Promise((resolve, reject) => {
    let string = '';
    const stream = qr.image(data, { type: 'pdf' });
    stream.on('data', (buffer) => { string += buffer.toString() });
    stream.on('end', () => resolve('data:application/pdf;base64,' + Buffer.from(string).toString('base64')));
  });
}