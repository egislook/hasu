const qr      = require('qr-image');
const { GQL } = require('fetchier');

// const { QR_HOOK_ENDPOINT, HASURA_ENDPOINT, HASURA_ACCESSKEY, PROVIDER, URL_PROVIDER, debug } = require(process.cwd() + '/config.js');
const { create, getSessionToken, deleteSession } = require('../utils/qrQueries');
const { svg, fail, success, config } = require('../utils/utils');
const { QR_HOOK_ENDPOINT, HASURA_ENDPOINT, HASURA_ACCESSKEY, PROVIDER, URL_PROVIDER, debug, errMessage  } = config(["QR_HOOK_ENDPOINT", "HASURA_ENDPOINT", "HASURA_ACCESSKEY", "PROVIDER", "URL_PROVIDER", "debug"])


module.exports = async (session) => {
  if(errMessage)
    return fail(errMessage)

  if(session){
    const { token } = await getSession(session);
    return success({ token });
  }

  try{
    const { id } = await setSession();

    const qr = await toQr({
      url: URL_PROVIDER,
      session: id,
      provider: PROVIDER,
      hook: QR_HOOK_ENDPOINT
    });

    return success({ qr, session: id });

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

function setSession() {
  const query = create('Session');
  const headers = { 'Content-Type': 'application/json', 'x-hasura-admin-secret': HASURA_ACCESSKEY };

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug, variables: { values: {} } })
    .then(({ insert_Session: { returning: [ session ]}}) => session);
}

function getSession(id) {
  const query = getSessionToken(id);
  const headers = { 'Content-Type': 'application/json', 'x-hasura-admin-secret': HASURA_ACCESSKEY };

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
    .then(({ Session: [ session ]}) => {
      return session;
    });
}