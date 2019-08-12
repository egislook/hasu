var AWS                               = require('aws-sdk')
const uuidv4                          = require('uuid/v4')
let { fail, success, S3config }       = require('../../utils/helpers');

module.exports = async ({bucket, config, filename }) => {
  S3config            = config && config || S3config;
  S3config['Bucket']  = bucket && bucket || S3config.Bucket;

  AWS.config.update(S3config);
  const s3         = new AWS.S3();

  try{
    const url = await getUploadURL(s3, S3config.Bucket, filename);
    return success({ url })
  } catch(error){
    return fail(error)
  }
}

const getUploadURL = (s3, Bucket, filename) => new Promise((resolve, reject) => {
  const config      = { Bucket, Key: filename || uuidv4(), ACL: 'public-read' };
  const uploadURL   = s3.getSignedUrl('putObject', config);
  resolve(uploadURL.split('?').shift());
})
