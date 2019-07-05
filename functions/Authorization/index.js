// const fetch   = require('node-fetch');
const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');

const { fail, loginResult, getRequestAct} = require('../../utils/helpers');

// let { HASURA_ENDPOINT, HASURA_ACCESSKEY, CLIK_VERIFY_TOKEN, errMessage, debug } = {}
// let headers   = { 'Content-Type': 'application/json' };

module.exports = async ({ body = {} }) => {
  // getConfig(configFile, configs)

  // if(errMessage)
  //   return fail(errMessage)

  // headers['X-Hasura-Access-key'] = HASURA_ACCESSKEY

  let { token, authorization, Authorization, provider } = body

  authorization = authorization || Authorization;

  if ( provider === "clik-mobile" && !!authorization ){
    const Token = authorization.replace(/bearer(\s{1,})?/i, '')
    const headers = {
                      'Content-Type': 'application/json',
                      'EkycSyncToken': 'UUhCOXV5RklGbkZxZVFJYmRlWlBXeWdPclU4UkFJaTB4aFJsaU5CYUM0OD0='
                    }

    const verifyResult = await getRequestAct('POST', { url: CLIK_VERIFY_TOKEN, Token, headers })
      .then(res => res.json());
    // const verifyResult = await fetch(CLIK_VERIFY_TOKEN, {
    //   method: 'POST',
    //   body: JSON.stringify({ Token }),
    //   headers
    // }).then(res => res.json());

    if (verifyResult.code === 200 && verifyResult.data.isTokenValid)
      return loginResult(200, {
        'x-hasura-role': "admin",
        'x-hasura-user-token': authorization.replace(/bearer(\s{1,})?/i, '')
      })
  }

  if (!!authorization || !!token){
    const token_key = token || authorization.replace(/bearer(\s{1,})?/i, '');
    return authorized(token_key);
  }

  return loginResult(422, { 'Message': 'Miss matched parameters' })
};

// const getConfig = (configFile, configs) => {
//   configs = config(["HASURA_ENDPOINT", "HASURA_ACCESSKEY", "CLIK_VERIFY_TOKEN", "debug"], configFile, configs)

//   HASURA_ENDPOINT           = configs.HASURA_ENDPOINT
//   HASURA_ACCESSKEY          = configs.HASURA_ACCESSKEY
//   CLIK_VERIFY_TOKEN          = configs.CLIK_VERIFY_TOKEN
//   errMessage                = configs.errMessage
//   debug                     = configs.debug
// }

async function authorized(token){
  const uuid = uuidv1();

  const authorizedQuery = `
    query{
      Session(where: { token: { _eq: "${token}"}}){
        createdAt
        credential{
          user{
            id
            role
          }
        }
      }
    }
  `;

  const { errors, data } = await getRequestAct('POST', { query: authorizedQuery })
    .then(res => res.json());
  // const { errors, data } = await fetch(HASURA_ENDPOINT, {
  //   method: 'POST',
  //   body: JSON.stringify({ query: authorizedQuery }),
  //   headers: headers
  // }).then(res => res.json());

  try {
    let {createdAt, credential: { user: { role, id }}} = data.Session.shift()

    const expireDate = 30
    createdAt   = new Date(createdAt).getTime()
    currentDate = new Date().getTime() - (expireDate * 24 * 60 * 60 * 1000)

    if ( createdAt < currentDate ){
      deleteExpiredToken(token)
      return loginResult(401, "Your Token is expired!!! Please re-login.")
    }

    return loginResult(200, {
      'x-hasura-role': role,
      'x-hasura-credential': uuid,
      'X-HASURA-USER-TOKEN': token,
      'X-HASURA-USER-ID': id
    })
  } catch(errors) {

    return loginResult(401, { 'x-hasura-role': 'undefined Token' })
  }
}

function deleteExpiredToken(token){
  const query = `
    mutation{
      delete_Session(where: {token: {_eq: "${token}"}}){
        affected_rows
      }
    }
  `
  getRequestAct('POST', { query })
  // fetch(HASURA_ENDPOINT, {
  //   method: 'POST',
  //   body: JSON.stringify({ query }),
  //   headers: headers
  // });
}
