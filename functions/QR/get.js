const { getQR } = require('../../helpers');

module.exports.handler = async (event, context) => {
  const { session } = event.queryStringParameters || {};
  return getQR(session);
};
