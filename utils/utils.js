// const AWS         = require('aws-sdk');
// const busboy      = require('busboy');
// const FormData    = require('form-data');
// const ffmpeg      = require('fluent-ffmpeg')
// const uuidv4      = require('uuid/v4');
// const { fetch }   = require('fetchier');
// const { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync, rmdirSync } = require('fs');
module.exports.config           = config;
module.exports.success          = success;
module.exports.fail             = fail;
module.exports.result           = result;
// module.exports.keysToLowerCase  = keysToLowerCase;
// module.exports.keysToUpperCase  = keysToUpperCase;
// module.exports.parseBody        = parseBody;
// module.exports.download         = download;
// module.exports.imgsFromVid      = imgsFromVid;
// module.exports.uploadImgToS3    = uploadImgToS3;
// module.exports.submit           = submit;
// module.exports.resultJson       = resultJson;

// const dir = process.cwd() + '/temp/';

function config(requiredKeys){
  try {
    const configFile  = require(process.cwd() + '/config.js');
    let missingKeys = requiredKeys.filter( key => configFile[key] === undefined)
    const errMessage = missingKeys.join(' ,') + ' are missing.'
    if (missingKeys.length === 0)
      return configFile
    return { errMessage }
  } catch(err){
    return { errMessage: "Config file is missing in root path."}
  }
}

function result(code, body, error){

  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials' : true,
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      statusCode: code,
      version: 'v' + process.env && process.env.npm_package_version,
      message: typeof error === 'object' ? error.message : error,
      data: body
    })
  }
}


function success(body, error){
  return result(200, body, error);
}

function fail(error, body, code = 500){
  return result(code, body, error);
}