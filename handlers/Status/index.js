const { status } = require('../../functions');

module.exports.handler = async (event, context) => {
  return status();
}
