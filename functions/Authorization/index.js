const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');
const { fail, loginResult, config, destructionResult, getRequestAct, clik_verify_token } = require('../../utils/helpers');
const { authQuery } = require('../../utils/qrQueries');

module.exports = async ({body = {}, configs = {}, query = ''}) => {


  let { token, authorization, Authorization, provider, rules } = body

  authorization = authorization || Authorization;

  if ( provider === "clik-mobile" && !!authorization ){
    if(!clik_verify_token)
      return fail("CLIK_VERIFY_TOKEN is missing.")
    token         = authorization.replace(/bearer(\s{1,})?/i, '')

    const headers = {
                      'Content-Type': 'application/json',
                      'EkycSyncToken': 'UUhCOXV5RklGbkZxZVFJYmRlWlBXeWdPclU4UkFJaTB4aFJsaU5CYUM0OD0='
                    }

    const verifyResult = await getRequestAct('POST', { url: clik_verify_token, body: {token}, headers })

    if (verifyResult.code === 200 && verifyResult.data.isTokenValid)
      return loginResult(200, {
        'x-hasura-role': "admin",
        'x-hasura-user-token': authorization.replace(/bearer(\s{1,})?/i, '')
      })

    return loginResult(401, { 'x-hasura-role': 'undefined Token' })
  }

  if (!!authorization || !!token){
    token = token || authorization.replace(/bearer(\s{1,})?/i, '');
    return authorized(token, query, rules);
  }

  return loginResult(422, { 'Message': 'Miss matched parameters' })
};

async function authorized(token, query, rules){
  const uuid = uuidv1();

  try {
    const Session = await getRequestAct('GQL', { query: query || authQuery(token) })
      .then(res => res && res[Object.keys(res).shift()].shift() || {})

    const destructRules = rules || ['createdAt', 'role', 'id']

    let {createdAt, id, role, phoneNumber} = Session && destructionResult(Session, destructRules) || {}

    if(!role)
      return loginResult(401, { 'x-hasura-role': 'undefined Token' })

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
      'X-HASURA-USER-ID': id,
      'X-HASURA-CONSUMER-PHONE': phoneNumber,
    })
  } catch(errors) {
    console.log("errors", errors)
    return loginResult(401, { 'x-hasura-role': 'undefined Token' })
  }
}

function deleteExpiredToken(token, table='Sessions'){
  const query = `
    mutation{
      delete_${table}(where: {token: {_eq: "${token}"}}){
        affected_rows
      }
    }
  `
  getRequestAct('GQL', { query })
}
