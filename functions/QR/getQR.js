const qr      = require('qr-image');
const { GQL } = require('fetchier');

const { create, getSessionToken, deleteSession } = require('../../utils/qrQueries');
const { fail, success , config} = require('../../utils/helpers');

let { QR_HOOK_ENDPOINT, HASURA_ENDPOINT, HASURA_ACCESSKEY, PROVIDER, URL_PROVIDER, errMessage, debug } = {}

let headers   = { 'Content-Type': 'application/json' };

module.exports = async ({session, configFile = false, configs = {}}) => {
  getConfigs(configFile, configs)

  if(errMessage)
    return fail(errMessage)

  headers['x-hasura-admin-secret'] = HASURA_ACCESSKEY

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

const getConfigs = (configFile, configs) => {
  configs = config(["QR_HOOK_ENDPOINT", "HASURA_ENDPOINT", "HASURA_ACCESSKEY", "PROVIDER", "URL_PROVIDER", "debug"], configFile, configs)

  QR_HOOK_ENDPOINT          = configs.QR_HOOK_ENDPOINT
  HASURA_ENDPOINT           = configs.HASURA_ENDPOINT
  HASURA_ACCESSKEY          = configs.HASURA_ACCESSKEY
  PROVIDER                  = configs.PROVIDER
  URL_PROVIDER              = configs.URL_PROVIDER
  errMessage                = configs.errMessage
  debug                     = configs.debug
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

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug, variables: { values: {} } })
    .then(({ insert_Session: { returning: [ session ]}}) => session);
}

function getSession(session) {
  const query = getSessionToken(session);

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
    .then(({ Session: [ session ]}) => {
      return session;
    });
}