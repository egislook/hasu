const { postUpload } = require('../../functions');

// const { result, parseBody, uploadImgToS3 }             = require('../utils');
// const { BUCKET, REGION, ACCESSKEYID, SECRETACCESSKEY } = require('../config')

module.exports.handler = async (event, context) => {
  const { bucket, configs } = event.body && JSON.stringify(event.body) || {}

  return postUpload({bucket, configs, event})

  // try{
  //   const { bucket }  = event.body && JSON.stringify(event.body) || {}
  //   // console.log({body: event.body });
  //   const S3config = {
  //     Bucket: bucket || BUCKET,
  //     region: REGION,
  //     accessKeyId: ACCESSKEYID,
  //     secretAccessKey: SECRETACCESSKEY,
  //     signatureVersion: 'v4',
  //   }
  //   const fileData        = await parseBody(event)
  //   const path            = await uploadImgToS3(S3config, fileData)
  //   return result(200, path, "successfully uploaded!!!");
  // } catch(error){
  //   return result(500, null, error);
  // }
};
