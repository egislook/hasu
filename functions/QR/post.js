const { postQR } = require('../../helpers');

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const { user: { login, photoUrl, givenName, familyName }, session } = body;

  return postQR({ login, photoUrl, givenName, familyName, session });
};