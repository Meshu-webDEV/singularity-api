const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const p = require('path');
const { S3 } = require('./configs');
const { createUniqueId } = require('./utils');
const { normalize } = require('./utils');
const { validateImage } = require('./validation');

const DigitalOceanSpace = new aws.S3({
  endpoint: new aws.Endpoint(S3.ENDPOINT),
  credentials: {
    accessKeyId: S3.KEY,
    secretAccessKey: S3.SECRET,
  },
});

const upload = multer({
  fileFilter: async (req, file, done) => {
    try {
      console.log('=== upload, file:');
      console.log(file);
      await validateImage(file);
      console.log('=== Valid image');
      done(null, true);
      // done(null, false);
    } catch (error) {
      done(error);
    }
  },
  storage: multerS3({
    s3: DigitalOceanSpace,
    bucket: 'image-testing',
    acl: 'public-read',
    key: async function (req, file, done) {
      const uniqueid = await createUniqueId(8);
      done(
        null,
        `${req.user.username}-organization-logo-${uniqueid}${normalize(
          p.extname(file.originalname)
        )}`
      );
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: {
    fileSize: 50000000, // 5mb
    files: 1,
  },
});

module.exports = {
  upload,
};
