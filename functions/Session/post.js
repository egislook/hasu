const uuidv1  = require('uuid/v1');

const { update, setSessionToken, getSessionToken, getUserByPhoneNumber } = require('../../utils/qrQueries');
const { fail, success, getRequestAct } = require('../../utils/helpers');

module.exports = async ({ login, photoUrl, givenName, familyName, session, table }) => {
  try{

    if(!session)
      return fail("Session is not provided")

    const checkSession = await getSession(session, table)

    if(checkSession){
      const { id, photo, name, credential } = await getUser(login);

      await updateUser({id, values: { photo: photo || photoUrl, name: name || givenName + ' ' + familyName }});
      await setSession({session, credential, table});

      return success({ user: {login, photoUrl, givenName, familyName}, session })
    }

    return fail(false)
  } catch(error){
    console.log(error);
    return fail(error)
  }
};

function getSession(session, table='Sessions'){
  const query = getSessionToken(session)

  return getRequestAct('GQL', { query })
    .then(response => {
        if (response[table].length > 0){
          return true
        }
        return false
      })
}

function updateUser({id, values}){
  const query = update('Users');

  return getRequestAct('GQL', { query, variables: { values, id } })
}

function getUser(login){
  const query = getUserByPhoneNumber(login);

  return getRequestAct('GQL', { query }).then(({ Users: [user] }) => user);
}

function setSession({session, credential, table='Sessions'}){
  const uuid = uuidv1();
  const update_table = `update_${table}`
  if(credential.length !== 1)
    return false

  const credentialId  = credential[0].id
  const token         = uuid
  const query         = setSessionToken;

  const variables = { id: session, token, credentialId };

  return getRequestAct('GQL', { query, variables })
    .then(({ [update_table]: { returning: [ session ]} }) => session);
}
