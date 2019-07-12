const uuidv1  = require('uuid/v1');
const bcrypt  = require('bcrypt');
const { loginResult, getRequestAct} = require('../../utils/helpers')

module.exports = async ({ body = {} }) => {
  const { phone, pin, tables, condition } = body

  if (!!phone && !!pin)
    return login(phone, pin, tables, condition);

  return loginResult(422, { 'Message': 'Miss matched parameters' })
}

async function login(phone, loginPin, tables = {}, condition = '') {

  const table       = tables.credential && tables.credential || 'Credential'
  condition         = `phoneNumber:{ _eq: "${phone}"} ${condition && condition || ''}`

  const query = `
    query{
      ${table}(where: {${condition}}){
        id
        pin
      }
    }
  `

  const Credential = await getRequestAct('GQL', { query }).then( res => res[table])

  if (Credential && Credential.length > 0){
    const { pin, id } = Credential[0]

    const check       = bcrypt.compareSync(loginPin, pin);

    if (check){
      token = await getToken(id, tables)
      if(typeof token === 'string')
        return loginResult(200, {token})
    }
  }
  return loginResult(401, {Message: "Unauthorized"})
}

async function getToken(id, tables){
  let token        = uuidv1()
  const table = tables.session && tables.session || 'Session'
  const query = `
    mutation{
      insert_${table}(objects: {credentialId: "${id}", token: "${token}"}){
        returning{
          token
        }
      }
    }
  `;

  const returning = await getRequestAct('GQL', { query }).then(res => res[`insert_${table}`].returning)

  if(returning && returning.length > 0)
    return token

  return loginResult(500, 'Updated failed')
}
