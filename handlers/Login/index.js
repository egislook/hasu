const { login } = require('../../functions');

module.exports.handler = async (event, context) => {
  const body = JSON.parse(event.body);

  return login({body});
};
