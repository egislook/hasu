const { postSession } = require('../../functions');

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);
  const { user: { login, photoUrl, givenName, familyName }, session, table } = body;

  return postSession({ login, photoUrl, givenName, familyName, session, table });
};
