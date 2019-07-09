const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');
const { loginResult, getRequestAct} = require('../../utils/helpers');

module.exports = async ({ body = {} }) => {
  const { phone, pin } = body

  if (!!phone && !!pin)
    return login(phone, pin);

  return loginResult(422, { 'Message': 'Miss matched parameters' })
};

async function login(phone, loginPin) {
  const query = `
    query{
      Users(where:{ credential:{ phoneNumber:{ _eq: "${phone}"}}}){
        name
        photo
        email
        credential{
          id
          pin
        }
      }
    }
  `

  const { Users } = await getRequestAct('GQL', { query })

  if (Users){

    const { name, photo, email, credential } = Users[0] || {}

    if (credential && credential.length > 0){
      const { pin, id } = credential[0]

      const check       = bcrypt.compareSync(loginPin, pin);

      if (check){
        token = await getToken(id)
        if(typeof token === 'string')
          return loginResult(200, {name, photo, email, token})
      }
    }
    return loginResult(401, "Unauthorized!!! Please Contact Clik Customer Support Service.")
  }
  return loginResult(401, {Message: "Unauthorized", Users})
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

  const { insert_Session } = await getRequestAct('GQL', { query })

  if(insert_Session && insert_Session.returning.length > 0)
    return token

  return loginResult(500, 'Updated failed')
}
