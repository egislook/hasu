const {
  success,
  fail,
  result,
  loginResult,
  keysToLowerCase,
  keysToUpperCase,
  uploadImgToS3,
  download,
  imgsFromVid,
  submit
}                                 = require('../utils/helpers');



module.exports.GenerateQR         = require('./QR');

module.exports.getSession         = require('./Session/get');
module.exports.postSession        = require('./Session/post');

module.exports.getUpload          = require('./Upload/get');
module.exports.postUpload         = require('./Upload/post');

module.exports.login              = require('./Login');
module.exports.auth               = require('./Authorization');

module.exports.success            = success
module.exports.fail               = fail
module.exports.result             = result
module.exports.loginResult        = loginResult
module.exports.keysToLowerCase    = keysToLowerCase
module.exports.keysToUpperCase    = keysToUpperCase
module.exports.uploadImgToS3      = uploadImgToS3
module.exports.download           = download
module.exports.imgsFromVid        = imgsFromVid
module.exports.submit             = submit

