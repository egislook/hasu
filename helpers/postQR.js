const uuidv1  = require('uuid/v1');
const { GQL } = require('fetchier');

const { create, update, setUserToken, getUserToken, setSessionToken, getSessionToken, getUserByPhoneNumber } = require('../utils/qrQueries');
const { fail, success, config } = require('../utils/utils');
const { QR_HOOK_ENDPOINT, HASURA_ENDPOINT, HASURA_ACCESSKEY, debug, errMessage  } = config(["QR_HOOK_ENDPOINT", "HASURA_ENDPOINT", "HASURA_ACCESSKEY", "debug"])

const headers = { 'Content-Type': 'application/json', 'X-Hasura-Access-Key': HASURA_ACCESSKEY };

module.exports = async ({ login, photoUrl, givenName, familyName, session }) => {
  try{
    if(errMessage)
      return fail(errMessage)

    if(!session)
      return fail("Session is not provided")

    const checkSession = await getSession(session)

    if(checkSession){
      const { id, photo, name, credential } = await getUser(login);

      await updateUser(id, { photo: photo || photoUrl, name: name || givenName + ' ' + familyName });
      await setSession(session, credential);

      return success({ login, photoUrl, givenName, familyName, session })
    }

    return fail(false)
  } catch(error){
    console.log(error);
    return fail(error)
  }
};

function getSession(id){
  const query = getSessionToken(id)

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
    .then(({ Session }) => {
      if (Session.length > 0){
        return true
      }
      return false
    })
}

function updateUser(id, values){
  const query = update('Users');

  return GQL({ url: HASURA_ENDPOINT, query, headers, variables: { values, id }, debug })
    // .then(({ Users: [ user ] }) => user);
}

function getUser(phoneNumber){
  const query = getUserByPhoneNumber(phoneNumber);

  return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
    .then(({ Users: [ user ] }) => user);
}

function setSession(id, credential){
  const uuid = uuidv1();
  if(credential.length !== 1)
    return false

  const credentialId  = credential[0].id
  const token         = uuid
  const query         = setSessionToken;

  const variables = { id, token, credentialId };

  return GQL({ url: HASURA_ENDPOINT, query, headers, variables, debug })
    .then(({ update_Session: { returning: [ session ]} }) => session);
}
