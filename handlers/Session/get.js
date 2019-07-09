const { getSession }         = require('../../functions');

module.exports.handler = async (event, context) => {
  const { session } = event.queryStringParameters || {};
  return getSession({session});
};
