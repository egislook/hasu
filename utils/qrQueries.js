module.exports = {

  authQuery: (token) => `
    query{
      Session(where: { token: { _eq: "${token}"} }){
        createdAt
        credential{
          user{
            id
            role
          }
        }
      }
    }
  `,

  create: (table) => `
    mutation($values: ${table}_insert_input!) {
      insert_${table}(objects: [$values]){
        returning{ id }
      }
    }
  `,

  update: (table) => `
    mutation($values: ${table}_set_input, $id: uuid) {
      update_${table}( _set: $values, where: { id: { _eq: $id } } ){
        returning { id }
      }
    }
  `,

  getUserToken: phoneNumber => `
    query{
      Users(where: { phoneNumber: {_eq: "${phoneNumber}"} }){
        name
        token
        id
      }
    }
  `,

  getUserByPhoneNumber: phoneNumber => `
    query{
      Users(where:{ credential:{ phoneNumber:{ _eq: "${phoneNumber}"}}}){
        name
        id
        photo
        credential{
          id
          pin
        }
      }
    }
  `,

  getSessionToken: id => `
    query{
      Session(where: { id: {_eq: "${id}"} }){
        id
        token
      }
    }
  `,

  setSessionToken: `
  mutation($id: uuid, $token: uuid, $credentialId: uuid){
    update_Session(_set: { token: $token, credentialId: $credentialId }, where: { id: {_eq: $id} } ){
      returning{ id token createdAt }
    }
  }
  `,

  deleteSession: id => `
    mutation {
      delete_Session(where: {id: {_eq: "${id}"}}) {
        affected_rows
      }
    }
  `

}