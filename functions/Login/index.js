const fetch   = require('node-fetch');
const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');
const { fail, loginResult, config} = require('../../utils/helpers');

let { HASURA_ENDPOINT, HASURA_ACCESSKEY, errMessage, debug } = {}
let headers   = { 'Content-Type': 'application/json' };

module.exports = async ({body = {}, configFile = false, configs = {}}) => {
  getConfig(configFile, configs)

  if(errMessage)
    return fail(errMessage)

  headers['X-Hasura-Access-key'] = HASURA_ACCESSKEY

  const { phone, pin } = body

  if (!!phone && !!pin)
    return login(phone, pin);

  return loginResult(422, { 'Message': 'Miss matched parameters' })
};


const getConfig = (configFile, configs) => {
  configs = config(["HASURA_ENDPOINT", "HASURA_ACCESSKEY", "debug"], configFile, configs)

  HASURA_ENDPOINT           = configs.HASURA_ENDPOINT
  HASURA_ACCESSKEY          = configs.HASURA_ACCESSKEY
  errMessage                = configs.errMessage
  debug                     = configs.debug
}

async function login(phone, loginPin) {
  const query = `
    query{
      Credential(where:{ phoneNumber:{ _eq: "${phone}"}}){
        id
        pin
      }
    }
  `

  const { data , errors } = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers
  }).then(res => res.json())

  if (data && data.Credential && data.Credential.length > 0){
    const { pin, id } = data.Credential[0]

    const check       = bcrypt.compareSync(loginPin, pin);

    if (check){
      token = await getToken(id)
      if(typeof token === 'string')
        return loginResult(200, {token})
    }
  }
  return loginResult(401, "Unauthorized!!! Please Contact Clik Customer Support Service.")
}

async function getToken(id){
  let token        = uuidv1()

  const query = `
    mutation{
      insert_Session(objects: {credentialId: "${id}", token: "${token}"}){
        returning{
          token
        }
      }
    }
  `;

  const { data, errors} = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers
  }).then(res => res.json());

  if(data && data.insert_Session.returning.length > 0)
    return token

  return loginResult(500, 'Updated failed')
}
