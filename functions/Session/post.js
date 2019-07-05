const uuidv1  = require('uuid/v1');
// const { GQL } = require('fetchier');

const { create, update, setUserToken, getUserToken, setSessionToken, getSessionToken, getUserByPhoneNumber } = require('../../utils/qrQueries');
const { fail, success, getRequestAct } = require('../../utils/helpers');

// let headers = { 'Content-Type': 'application/json' };
// let { HASURA_ENDPOINT, HASURA_ACCESSKEY, errMessage, debug } = {}

module.exports = async ({ login, photoUrl, givenName, familyName, session }) => {
  try{
    // getConfigs(configFile, configs)

    // if(errMessage)
    //   return fail(errMessage)

    // headers['X-Hasura-Access-Key'] = HASURA_ACCESSKEY

    if(!session)
      return fail("Session is not provided")

    const checkSession = await getSession(session)

    if(checkSession){
      const { id, photo, name, credential } = await getUser(login);

      await updateUser({id, values: { photo: photo || photoUrl, name: name || givenName + ' ' + familyName }});
      await setSession({session, credential});

      return success({ login, photoUrl, givenName, familyName, session })
    }

    return fail(false)
  } catch(error){
    console.log(error);
    return fail(error)
  }
};

function getSession(session){
  const query = getSessionToken(session)

  return getRequestAct('GQL', { query })
    .then(({ Session }) => {
        if (Session.length > 0){
          return true
        }
        return false
      })
  // return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
  //   .then(({ Session }) => {
  //     if (Session.length > 0){
  //       return true
  //     }
  //     return false
  //   })
}

function updateUser({id, values}){
  const query = update('Users');

  return getRequestAct('GQL', { query, variables: { values, id } })
  // return GQL({ url: HASURA_ENDPOINT, query, headers, variables: { values, id }, debug })
    // .then(({ Users: [ user ] }) => user);
}

function getUser(login){
  const query = getUserByPhoneNumber(login);

  return getRequestAct('GQL', { query }).then(({ Users: [user] }) => user);
  // return GQL({ url: HASURA_ENDPOINT, query, headers, debug })
  //   .then(({ Users: [ user ] }) => user);
}

function setSession({session, credential}){
  const uuid = uuidv1();
  if(credential.length !== 1)
    return false

  const credentialId  = credential[0].id
  const token         = uuid
  const query         = setSessionToken;

  const variables = { id: session, token, credentialId };

  return getRequestAct('GQL', { query, variables })
    .then(({ update_Session: { returning: [ session ]} }) => session);
  // return GQL({ url: HASURA_ENDPOINT, query, headers, variables, debug })
  //   .then(({ update_Session: { returning: [ session ]} }) => session);
}

// const getConfigs = (configFile, configs) => {
//   configs = config(["HASURA_ENDPOINT", "HASURA_ACCESSKEY", "debug"], configFile, configs)

//   HASURA_ENDPOINT           = configs.HASURA_ENDPOINT
//   HASURA_ACCESSKEY          = configs.HASURA_ACCESSKEY
//   errMessage                = configs.errMessage
//   debug                     = configs.debug
// }
