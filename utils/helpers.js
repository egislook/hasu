const AWS         = require('aws-sdk');
const busboy      = require('busboy');
const FormData    = require('form-data');
const ffmpeg      = require('fluent-ffmpeg')
const uuidv4      = require('uuid/v4');
const { fetch, GQL, GET, POST }   = require('fetchier');
const { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync, rmdirSync } = require('fs');

const functions      = require('../functions');
const {
  debug,
  BUCKET,
  REGION,
  ACCESSKEYID,
  SECRETACCESSKEY,
  HASURA_ENDPOINT,
  HASURA_ACCESSKEY,
  CLIK_VERIFY_TOKEN,
  QR_HOOK_ENDPOINT,
  MAP_KEY,
  PROVIDER,
  URL_PROVIDER,
} = require(process.cwd() + '/config.js') || {};

const S3config = {
  Bucket: BUCKET,
  region: REGION,
  accessKeyId: ACCESSKEYID,
  secretAccessKey: SECRETACCESSKEY,
  signatureVersion: 'v4',
}
// module.exports.config           = config;
module.exports.success                  = success;
module.exports.fail                     = fail;
module.exports.result                   = result;
module.exports.loginResult              = loginResult;
module.exports.svg                      = svg;
module.exports.generateQR               = generateQR;
module.exports.S3config                 = S3config;
module.exports.keysToLowerCase          = keysToLowerCase;
module.exports.keysToUpperCase          = keysToUpperCase;
module.exports.parseBody                = parseBody;
module.exports.download                 = download;
module.exports.imgsFromVid              = imgsFromVid;
module.exports.uploadImgToS3            = uploadImgToS3;
module.exports.submit                   = submit;
module.exports.getRequestAct            = getRequestAct;
module.exports.destructionResult        = destructionResult;
module.exports.compareObjects           = compareObjects;
module.exports.parseValuesUpsert        = parseValuesUpsert
module.exports.getUpdateColumns         = getUpdateColumns
module.exports.isEmptyObject            = isEmptyObject
module.exports.clik_verify_token        = CLIK_VERIFY_TOKEN;

// module.exports.resultJson       = resultJson;

const dir = process.cwd() + '/temp/';

// const config = (conf) => conf || require(process.cwd() + '/config.js');

function destructionResult(data, keys){
  let result = {}
  Object.keys(data).forEach( key => {
    if( keys.indexOf(key) > -1 && typeof data[key] === 'string' ){
      result[key] = data[key]
      keys = keys.filter( k => key !== k)
    }
    if(typeof data[key] === 'object')
      Object.assign(result, destructionResult(data[key].length === undefined ? data[key] : data[key][0], keys))
  })
  return result
}

function getRequestAct(actionName, request) {
  let { headers, url } = request || {};

  const defHeaders = {
    'content-type': 'application/json',
    'x-hasura-admin-secret': HASURA_ACCESSKEY
  }

  let req = {
    url:      url || HASURA_ENDPOINT,
    headers:  headers && headers || defHeaders,
    debug:    request.debug && request.debug || debug,
    ...(request)
  }

  switch(actionName){
    case 'GQL':
      return GQL(req)
    case 'POST':
      return POST(req)
    case 'GET':
      return GET(request)
  }

  return Promise.reject('Incorrect action ' + actionName);
}

function generateQR({ url, session, provider, hook}) {
  return functions.GenerateQR({ url: url || URL_PROVIDER, session: session || id, provider: provider || PROVIDER, hook: hook || QR_HOOK_ENDPOINT });
}

function result(code, body, error, extra = {}){

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
      message: typeof error === 'object' ? (error.message || error) : error,
      status: typeof error === 'object' ? (error.status || null) : null,
      data: body,
      ...extra
    })
  }
}

function loginResult(code, body){
  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials' : 'true',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  }
}


function success(body, message, extra){
  return result(200, body, message, extra);
}

function fail(error, body, code = 500){

  if(typeof error !== 'string'){
    code  = error.statusCode && error.statusCode || code
    body  = error.data
    error = error
  }

  return result(code, body, error);
}

function keysToLowerCase(item){
  return Object.keys(item).reduce( (obj, key) => {
    const newKey = key.charAt(0).toLowerCase() + key.slice(1);
    obj[newKey] = item[key];
    return obj;
  }, {})
}

function keysToUpperCase(item){
  if (typeof item === 'string')
    return item.charAt(0).toUpperCase() + item.slice(1);
  return Object.keys(item).reduce( (obj, key) => {
    const newKey = key.charAt(0).toUpperCase() + key.slice(1);
    obj[newKey] = item[key];
    return obj;
  }, {})
}

function download(url, ext = ''){
  const path = dir + new Date().getTime() + ext;

  !existsSync(dir) && mkdirSync(dir);

  return new Promise(resolve =>
    fetch(url).then(res => res.body.pipe(createWriteStream(path)).on('finish', () => resolve(path)))
  )
}

function imgsFromVid(url, count = 5, id){
  const folder = dir + `${id || new Date().getTime()}_dir`;

  return new Promise((resolve, reject) => {
    download(url)
      .catch(reject)
      .then( path => {
        ffmpeg(path)
          .screenshots({
            count,
            filename: '%i',
            size: '300x?',
            folder
          })
          .on('end', function() {
            console.log('Screenshots taken');
            unlinkSync(path)
            const files = [...Array(count)].map((v, i) => folder + `/${i + 1}.png`)
            resolve({ folder, files});
          })
      })
    }
  )
}

function uploadImgToS3(S3config, file){

  AWS.config.update(S3config);
  const s3        = new AWS.S3();
  const filePath  = `${uuidv4()}-${Date.now()}`;
  const Body      = typeof file === 'string' ? createReadStream(file) : file

  var params = {
    Bucket: S3config.Bucket,
    Key: filePath,
    Body,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function (err, data) {
      if (err)
        return reject(err);

      const path = data.Location && data.Location || 'Ask Ekyc admin to check URLs'
      resolve(path)
    })
  })
}

function submit(url, fields = {}, folder){

  const form = new FormData();

  return new Promise( (resolve, reject) => {

    fields.forEach(({ name, value, type = 'files' }) => {
      value = type === 'file' ?  createReadStream(value) : value;
      form.append(name, value);
    });

    form.submit(url, (err, res) => {

      fields.forEach(({ value, type, keep }) => !keep && type === 'file' && unlinkSync(value));
      folder && rmdirSync(folder);

      if(err)
        return reject(err);

      let body = '';
      res.on('data', chunk => { body += chunk });
      res.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch(error){ reject(body) }
      });
    });
  });
}

function parseBody(e){
  return new Promise((resolve, reject) => {

    const contentType = e.headers['Content-Type'] || e.headers['content-type'];
    const bb = new busboy({ headers: { 'content-type': contentType } });

    bb.on('file', (fieldname, file, filename, encoding, mimetype) => {

      let chunks;
      file
        .on('data', (data) => { chunks = data })
        .on('end', () => {
          const base64Image = new Buffer(chunks.toString(), 'binary').toString('base64');
          const fileData    = new Buffer(base64Image, 'base64');
          // console.log({base64Image, fileData})
          resolve(fileData);
        })
        .on('httpUploadProgress', (evt) => console.log('progress'));
    });

    bb.end(e.body);

  })
}

function svg(body){
  return {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Access-Control-Allow-Credentials' : true,
      'Access-Control-Allow-Origin': '*'
    },
    body
  }
}

function compareObjects({newValues, oldValues, name = []}){
  let changeObj = {}

  const oldKeys = Object.keys(oldValues)
  const newKeys = Object.keys(newValues)

  oldKeys.map( key => {

    if( typeof newValues[key] === 'object' && !isEmptyObject(newValues[key]) && !Array.isArray(newValues[key]) && ~name.indexOf(key) === 0 && !isEmptyObject(oldValues[key])){

      const res = compareObjects({newValues: newValues[key], oldValues: oldValues[key], name})

      if(Object.keys(res).length)
        changeObj[key] = res
    }else if( key === 'id' )
      changeObj[key] = newValues[key] === undefined ? oldValues[key] : newValues[key]
    else if(~name.indexOf(key) !== 0)
      changeObj[key] = newValues[key]
    else if (newValues[key] !== oldValues[key] && newValues[key] !== undefined && !isEmptyObject(newValues[key]))
      changeObj[key] = newValues[key]
  })

  newKeys.map( key => {
    if (~oldKeys.indexOf(key) === 0 && newValues[key] !== null)
      changeObj[key] = newValues[key]
  })

  return changeObj
}

function parseValuesUpsert({data, notTable = [], removePlural = false, addPlural = false}) {
  const keys = Object.keys(data)

  keys.filter(key => {
    if (typeof data[key] === 'object' && data[key] !== null && ~notTable.indexOf(key) === 0 ) {
      const tableName = addPlural ? pluralize(key)  : key

      data[tableName] = {
        data: data[key],
        on_conflict: {
          constraint: `${keysToUpperCase( removePlural ? tableName.replace(/s?$/gi, '') : tableName)}_pkey`,
          update_columns: getUpdateColumns(data[key])
        }
      }
      addPlural && delete data[key]
    } else {
      data[key] = typeof data[key] === 'number' ? data[key].toString() : data[key]
    }
  })

  return data
}

function pluralize(text){
  
  switch (text.slice(-1)) {
    case "s":
      return text + "es"
    case "y":
      return text.replace(/y$/i, "ies")
    default:
      return text + "s"
  }
}

function getUpdateColumns(data, notTable = []) {
  data = (data[0] && data[0]) || data
  const keys = Object.keys(data)
  return keys.filter(key => (data[key] === null || typeof data[key] !== 'object' ||  ~notTable.indexOf(key) !== 0 ))
}

function isEmptyObject(obj) {
  if ( obj === null ) return true
  if ( Object.keys(obj).length === 0 ) return true
  return false
}