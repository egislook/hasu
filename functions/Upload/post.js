const { fail, success, parseBody, uploadImgToS3, config }             = require('../../utils/helpers');
let { BUCKET, REGION, ACCESSKEYID, SECRETACCESSKEY, errMessage} = {}

module.exports = async ({configs = {}, bucket, configFile = false, event}) => {
  try{
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

    const fileData        = await parseBody(event)
    const path            = await uploadImgToS3(S3config, fileData)

    return success(path, "successfully uploaded!!!");
  } catch(error){
    return fail(error);
  }
};

const getConfigs = (configFile, configs) => {
  configs = config(["BUCKET", "REGION", "ACCESSKEYID", "SECRETACCESSKEY"], configFile, configs)
  BUCKET          = configs.BUCKET
  REGION          = configs.REGION
  ACCESSKEYID     = configs.ACCESSKEYID
  SECRETACCESSKEY = configs.SECRETACCESSKEY
  errMessage      = configs.errMessage
}

