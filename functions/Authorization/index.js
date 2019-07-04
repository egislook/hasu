const fetch   = require('node-fetch');
const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');

const { fail, loginResult, config, destructionResult } = require('../../utils/helpers');
const { authQuery } = require('../../utils/qrQueries');

let { HASURA_ENDPOINT, HASURA_ACCESSKEY, CLIK_VERIFY_TOKEN, errMessage, debug } = {}
let headers   = { 'Content-Type': 'application/json' };

module.exports = async ({body = {}, configFile = false, configs = {}, query = ''}) => {
  getConfig(configFile, configs)

  if(errMessage){
    console.log("errMessage", errMessage);

    return fail(errMessage)
  }

  headers['X-Hasura-Access-key'] = HASURA_ACCESSKEY

  let { token, authorization, Authorization, provider } = body

  authorization = authorization || Authorization;

  if ( provider === "clik-mobile" && !!authorization ){
    if(!CLIK_VERIFY_TOKEN)
      return fail("CLIK_VERIFY_TOKEN is missing.")
    token         = authorization.replace(/bearer(\s{1,})?/i, '')
    const headers = {
                      'Content-Type': 'application/json',
                      'EkycSyncToken': 'UUhCOXV5RklGbkZxZVFJYmRlWlBXeWdPclU4UkFJaTB4aFJsaU5CYUM0OD0='
                    }

    const verifyResult = await fetch(CLIK_VERIFY_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers
    }).then(res => res.json());

    if (verifyResult.code === 200 && verifyResult.data.isTokenValid)
      return loginResult(200, {
        'x-hasura-role': "admin",
        'x-hasura-user-token': authorization.replace(/bearer(\s{1,})?/i, '')
      })

    return loginResult(401, { 'x-hasura-role': 'undefined Token' })
  }

  if (!!authorization || !!token){
    token = token || authorization.replace(/bearer(\s{1,})?/i, '');
    return authorized(token, query);
  }

  return loginResult(422, { 'Message': 'Miss matched parameters' })
};

const getConfig = (configFile, configs) => {
  configs = config(["HASURA_ENDPOINT", "HASURA_ACCESSKEY", "debug"], configFile, configs)

  HASURA_ENDPOINT           = configs.HASURA_ENDPOINT
  HASURA_ACCESSKEY          = configs.HASURA_ACCESSKEY
  CLIK_VERIFY_TOKEN         = configs.CLIK_VERIFY_TOKEN
  errMessage                = configs.errMessage
  debug                     = configs.debug
}

async function authorized(token, query){
  const uuid = uuidv1();

  try {

    var result = await checkToken(token, query)

    let  {createdAt, role, id } = result

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
    console.log("errors", errors)
    return loginResult(401, { 'x-hasura-role': 'undefined Token' })
  }
}

async function checkToken(token, query){
  query = query || authQuery(token)

  const { errors, data } = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: headers
  }).then(res => res.json());

  if(!data)
    throw 'The Token provided is invalided.'

  return destructionResult(data, ['createdAt', 'role', 'id'])
}

function deleteExpiredToken(token){
  const query = `
    mutation{
      delete_Session(where: {token: {_eq: "${token}"}}){
        affected_rows
      }
    }
  `

  fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: headers
  });
}
