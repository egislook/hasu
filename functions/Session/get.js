// const { GQL }           = require('fetchier');

const { create, getSessionToken, deleteSession } = require('../../utils/qrQueries');
const { fail, success, generateQR, getRequestAct } = require('../../utils/helpers');

module.exports = async ({ session }) => {

  if(session){
    const { token } = await getSession(session);
    return success({ token });
  }

  try{
    const { id } = await setSession();

    const qr = await generateQR({ session: id }).then( res => res.body)

    return success({ qr, session: id });

  } catch(error){ return fail(error) }
}

function setSession() {
  const query = create('Session');
  return getRequestAct('GQL', { query, variables: { values: {} } })
    .then(({ insert_Session: { returning: [ session ]}}) => session);
  // return GQL({ url: HASURA_ENDPOINT, query, headers, debug, variables: { values: {} } })
  //   .then(({ insert_Session: { returning: [ session ]}}) => session);
}

function getSession(session) {
  const query = getSessionToken(session);

  return getRequestAct('GQL', { query, debug })
    .then(({ Session: [ session ]}) => {
      return session;
    });
  // return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
  //   .then(({ Session: [ session ]}) => {
  //     return session;
  //   });
}