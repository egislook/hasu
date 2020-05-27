const { getSession }         = require('../../functions');

module.exports.handler = async (event, context) => {
  return getSession(event.queryStringParameters || {});
};
