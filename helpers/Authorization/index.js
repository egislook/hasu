const { auth } = require('../../functions');

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);

  let { authorization, Authorization, provider } = (event.httpMethod === 'POST' && body !== null && body.headers !== undefined )
    ? body.headers
    : event.headers;

  return auth({body: {authorization, Authorization, provider, token: body.token}, configFile: true});
};