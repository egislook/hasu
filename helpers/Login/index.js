const fetch   = require('node-fetch');
const uuidv1  = require('uuid/v1');

const { HASURA_ENDPOINT, HASURA_ACCESSKEY, CLIK_VERIFY_TOKEN } = require('../config');

const authorizedHeader = {
  'Content-Type': 'application/json',
  'X-Hasura-Access-key': HASURA_ACCESSKEY
}

module.exports.handler = async (event, context) => {

  const body = JSON.parse(event.body);

  const { phone, pin, token, query } = body || {};

  let { authorization, Authorization, provider } = (event.httpMethod === 'POST' && body !== null && body.headers !== undefined )
    ? body.headers
    : event.headers;

  authorization = authorization || Authorization;

  if ( provider === "clik-mobile" && !!authorization ){
    const Token = authorization.replace(/bearer(\s{1,})?/i, '')
    const headers = {
                      'Content-Type': 'application/json',
                      'EkycSyncToken': 'UUhCOXV5RklGbkZxZVFJYmRlWlBXeWdPclU4UkFJaTB4aFJsaU5CYUM0OD0='
                    }

    const verifyResult = await fetch(CLIK_VERIFY_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ Token }),
      headers
    }).then(res => res.json());

    if (verifyResult.code === 200 && verifyResult.data.isTokenValid)
      return result(200, {
        'x-hasura-role': "admin",
        'x-hasura-user-token': authorization.replace(/bearer(\s{1,})?/i, '')
      })
  }

  const notify  = event.headers.notify === undefined
    ? 'true'
    : event.headers.notify;

  if (!!authorization || !!token){
    const token_key = token || authorization.replace(/bearer(\s{1,})?/i, '');
    const tokenData = ~token_key.indexOf('::') && token_key.split('::');
    const userRole  = tokenData && tokenData[1];
    const realToken = tokenData[0] || token_key;

    return authorized(realToken, userRole, notify);
  }

  if (!!phone && !!pin)
    return login(phone, pin);

  return result(422, { 'Message': 'Miss matched parameters' })
};

function result(code, body){
  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials' : 'true',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  }
}

async function login(phone, pin){
  const variables = { phone, pin };

  const query = `
    query($phone: String!, $pin: String!){
      Users(where: {phoneNumber: {_eq: $phone}, pin: {_eq: $pin}} ){
        name
        token
      }
    }
  `;

  const queryResult = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: authorizedHeader
  });

  const { errors, data } = await queryResult.json();

  if(errors)
    return result(401, { 'x-hasura-role': 'Unknown', Message: 'Errors Login' });

  if(!data.Users.length)
    return result(401, { Message: 'Unauthorize' })

  return result(200, data.Users.shift());
};

async function authorized(token, userRole, notify){
  const uuid = uuidv1();
  const authorizedQuery = `
    query{
      Users(where: {token: { _eq: "${token}"}}){
        id
        role
      }
    }
  `;

  const user = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query: authorizedQuery }),
    headers: authorizedHeader
  });

  const { errors, data } = await user.json();

  try {
    const {role, id } = data.Users.shift()

    return result(200, {
      'x-hasura-role': userRole === 'user' ? userRole : role,
      'x-hasura-credential': uuid,
      'X-HASURA-USER-TOKEN': token,
      'x-hasura-user-id': id,
      'X-HASURA-Notification': notify
    })
  } catch(errors) {
    return result(401, { 'x-hasura-role': 'undefined Token' })
  }
}
