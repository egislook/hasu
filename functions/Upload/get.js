var AWS                               = require('aws-sdk')
const uuidv4                          = require('uuid/v4')
const { svg, fail, success, config }  = require('../../utils/helpers');
let { BUCKET, REGION, ACCESSKEYID, SECRETACCESSKEY, errMessage } = {}

module.exports = async ({configs = {}, bucket, configFile = false}) => {
  getConfigs(configFile, configs)

  if(errMessage)
    return fail(errMessage)

  const S3config = {
    Bucket: bucket || BUCKET,
    region: REGION,
    accessKeyId: ACCESSKEYID,
    secretAccessKey: SECRETACCESSKEY,
    signatureVersion: 'v4',
  }

  AWS.config.update(S3config);
  const s3         = new AWS.S3();

  try{
    const url = await getUploadURL(s3, S3config.Bucket);
    return success({ url })
  } catch(error){
    return fail(error)
  }
}

const getConfigs = (configFile, configs) => {
  configs = config(["BUCKET", "REGION", "ACCESSKEYID", "SECRETACCESSKEY"], configFile, configs)
  BUCKET          = configs.BUCKET
  REGION          = configs.REGION
  ACCESSKEYID     = configs.ACCESSKEYID
  SECRETACCESSKEY = configs.SECRETACCESSKEY
  errMessage      = configs.errMessage
}

const getUploadURL = (s3, Bucket) => new Promise((resolve, reject) => {
  const config      = { Bucket, Key: uuidv4(), ACL: 'public-read' };
  const uploadURL   = s3.getSignedUrl('putObject', config);
  resolve(uploadURL.split('?').shift());
})
