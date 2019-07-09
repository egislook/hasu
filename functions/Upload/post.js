let { fail, success, parseBody, uploadImgToS3, S3config }             = require('../../utils/helpers')

module.exports = async ({bucket, config, event}) => {
  try{
    S3config            = config && config || S3config;
    S3config['Bucket']  = bucket && bucket || S3config.Bucket;

    const fileData        = await parseBody(event)
    const path            = await uploadImgToS3(S3config, fileData)

    return success(path, "successfully uploaded!!!");
  } catch(error){
    return fail(error);
  }
};