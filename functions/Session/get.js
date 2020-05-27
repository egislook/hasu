const { create, getSessionToken } = require('../../utils/qrQueries');
const { fail, success, generateQR, getRequestAct } = require('../../utils/helpers');

module.exports = async ({ session, table }) => {

  if(session){
    const { token } = await getSession(session, table);

    return success({ token });
  }

  try{
    const { id } = await setSession(table);

    const qr = await generateQR({ session: id }).then( res => res.body)

    return success({ qr, session: id });

  } catch(error){ return fail(error) }
}

function setSession(table = 'Sessions') {
  const query = create(table);
  const insert_table = `insert_${table}`

  return getRequestAct('GQL', { query, variables: { values: {} } })
    .then(({ [insert_table]: { returning: [ session ]}}) => session);
}

function getSession(session, table = 'Sessions') {
  const query = getSessionToken(session);

  return getRequestAct('GQL', { query })
    .then(({ [table]: [ session ]}) => {
      return session;
    });
}