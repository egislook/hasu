const { getUpload } = require('../../functions');

module.exports.handler = async (event, context) => {
  const { bucket, configs } = event.body && JSON.stringify(event.body) || {}

  return getUpload({bucket, configs})
}


