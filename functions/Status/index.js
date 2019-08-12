const { success } = require('../../utils/helpers');

module.exports = async event => {
  return success({ info: 'Successfull hasu setup' });
}
