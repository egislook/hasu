const { getQR }         = require('../../functions');

module.exports.handler = async (event, context) => {

  const { session } = event.queryStringParameters || {};

  return getQR({session, configFile: true});
};

