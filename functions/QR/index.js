const qr      = require('qr-image');

const { fail, config, svg} = require('../../utils/helpers');

module.exports = async (configs = {}) => {

  if(!configs)
    return fail("There is no configs to generatte QR.")

  try{

    return svg(await toQr({ ...configs }));

  } catch(error){ return fail(error) }
}

function toQr(data = 'clik') {
  data = typeof data === 'object' ? JSON.stringify(data) : data;

  return new Promise((resolve, reject) => {
    let string = '';
    const stream = qr.image(data, { type: 'svg' });
    stream.on('data', (buffer) => { string += buffer.toString() });
    stream.on('end', () => resolve('data:image/svg+xml;base64,' + Buffer.from(string).toString('base64')));
  });
}