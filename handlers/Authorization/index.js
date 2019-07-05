const { auth } = require('../../functions');

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const token = body && body.token || ''

  let { authorization, Authorization, provider } = (event.httpMethod === 'POST' && body !== null && body.headers !== undefined )
    ? body.headers
    : event.headers;

  return auth({ body: {authorization, Authorization, provider, token: token } });
};