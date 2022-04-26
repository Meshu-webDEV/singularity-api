const router = require('express').Router();
const FormData = require('form-data');
const {
  errorMessages,
  USER_ORGANIZATION_STATUS,
} = require('../../lib/constants');
const { _isEmpty } = require('../../lib/validation');
const multer = require('multer');
const axios = require('axios').default;
const { WEB_SERVER, META } = require('../../lib/configs');
// Controllers
const {
  newOrganization,
  getOrganizationById,
  resetOrganizationRejection,
  getOrganizationByUniqueid,
  getOrganizationByOwnerId,
  editOrganizationBio,
} = require('./organization.controller');
const { updateUserOrganizationStatus } = require('../user/user.controller');
const {
  validateOrganizationUniqueidForm,
  isAuth,
} = require('../../middlewares');

// GET ../api/v1/organizations/
router.get('/', async (req, res, next) => {
  // if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    // console.log(req.body);
    console.log(req.headers['cookie']);
    res.send('ed');
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/organizations/my-organization
router.get('/my-organization', isAuth, async (req, res, next) => {
  try {
    // console.log(req.body);
    const organization = await getOrganizationByOwnerId(req.user._id);
    console.log('=== ORGANIZATION');
    console.log(organization);
    res.json(organization);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/organizations/by-uniqueid
router.get(
  '/by-uniqueid/:uniqueid',
  validateOrganizationUniqueidForm,
  async (req, res, next) => {
    if (_isEmpty(req.params?.uniqueid))
      return next(new Error(errorMessages.MALFORMED_INFO));

    try {
      const { uniqueid } = req.params;
      console.log(uniqueid);
      const organization = await getOrganizationByUniqueid(uniqueid);
      return res.json(organization);
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
);

// GET ../api/v1/organizations/by-id
router.get('/by-id/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new Error(errorMessages.MALFORMED_INFO));

  try {
    const organization = await getOrganizationById(id);
    res.json(organization);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// POST ../v1/organizations/new
router.post('/new', multer().single('avatar'), async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { file, headers, body } = req;

    // Initiate & populate a new form-data with the file
    const form = new FormData();

    form.append('avatar', file.buffer, file.originalname);

    // await uploading the avatar
    const {
      data: { key, location },
    } = await axios.post(
      `${WEB_SERVER.ORIGIN}/${META.API_VERSION}/upload-files`,
      form,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
          'cookie': headers['cookie'],
        },
      }
    );

    // Create org.
    const { id } = await newOrganization(req.user._id, {
      ...body,
      avatar: location,
    });

    // Indicate the user in DB he has applied for an org profile
    await updateUserOrganizationStatus(
      req.user._id,
      USER_ORGANIZATION_STATUS.PENDING,
      id
    );

    res.status(201).send();
  } catch (error) {
    return next(error);
  }
});

// patch ../v1/organizations/edit-bio/:id
router.patch('/edit-bio/:id', async (req, res, next) => {
  if (_isEmpty(req.params?.id))
    return next(new Error(errorMessages.MALFORMED_INFO));

  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { id } = req.params;
    const { bio } = req.body;

    console.log(id, bio);

    // Update bio
    await editOrganizationBio(req.user._id, id, bio);
    // respond
    res.status(201).send();
  } catch (error) {
    return next(error);
  }
});

// POST ../api/v1/organizations/reset-rejection
router.patch('/reset-rejection', async (req, res, next) => {
  try {
    await resetOrganizationRejection(req.user._id);
    res.status(200).send();
  } catch (error) {
    // console.log(error);
    return next(error);
  }
});

module.exports = router;
