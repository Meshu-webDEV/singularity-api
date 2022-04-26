const router = require('express').Router();

const { errorMessages } = require('../../lib/constants');
const { isAdminAuth } = require('../../middlewares');

// Controllers
const {
  getAdmin,
  createAdmin,
  getOrganizationsApplications,
  getUserById,
  getOrganizationByUniqueid,
  rejectOrganizationApplication,
  approveOrganizationApplication,
} = require('./admin.controller');

// GET ../api/v1/admin/
router.get('/', isAdminAuth, async (req, res, next) => {
  try {
    const KEY = req.headers['x-key'];
    const SECRET = req.headers['x-secret'];

    console.log('KEY: ', KEY);
    console.log('SECRET: ', SECRET);

    return res.status(200).json();
  } catch (error) {
    return next(error);
  }
});

// POST ../api/v1/admin/create
router.post('/create', async (req, res, next) => {
  try {
    const admin = await createAdmin(req.body);
    return res.status(201).json(admin);
  } catch (error) {
    return next(error);
  }
});

// GET ../v1/admin/organizations/applications
router.get(
  '/organizations/applications',
  isAdminAuth,
  async (req, res, next) => {
    //

    let { skip = 0, sort = 'asc', limit = 25 } = req.query;
    // Skip validation
    skip = Number(skip) ? Number(skip) : 0;
    skip = skip < 0 ? 0 : skip;
    // Limit validation
    limit = Number(limit) ? Number(limit) : 25;
    limit = limit < 0 ? 25 : limit;
    // Sort validation
    sort = sort !== 'asc' && sort !== 'desc' ? 'asc' : sort;

    try {
      const { applications, total = 0 } = await getOrganizationsApplications(
        skip,
        sort,
        limit
      );
      const remaining = total - (skip + limit) < 0 ? 0 : total - (skip + limit);
      const result = {
        pagination: {
          total: total,
          remaining,
          hasMore: remaining !== 0,
          resultCount: applications.length,
        },
        applications,
      };

      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }
);

// GET ../v1/admin/organizations/applications/reject/:uniqueid
router.patch(
  '/organizations/applications/reject/:uniqueid',
  isAdminAuth,
  async (req, res, next) => {
    //
    const { uniqueid } = req.params;
    const { owner } = req.query;
    const { reason } = req.body;

    if (!uniqueid) return next(new Error(errorMessages.MALFORMED_INFO));

    try {
      await rejectOrganizationApplication(uniqueid, reason, owner);

      return res.status(200).send();
    } catch (error) {
      return next(error);
    }
  }
);

// GET ../v1/admin/organizations/applications/approve/:uniqueid?userid=
router.patch(
  '/organizations/applications/approve/:uniqueid',
  isAdminAuth,
  async (req, res, next) => {
    //
    const { uniqueid } = req.params;
    const { userid } = req.query;
    const { reason } = req.body;

    console.log(userid);

    if (!uniqueid) return next(new Error(errorMessages.MALFORMED_INFO));

    try {
      await approveOrganizationApplication(uniqueid, userid);

      return res.status(200).send();
    } catch (error) {
      return next(error);
    }
  }
);

// GET ../v1/admin/users/:id
router.get('/users/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await getUserById(id);
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/organizations/by-uniqueid/:uniqueid
router.get('/organizations/by-uniqueid/:uniqueid', async (req, res, next) => {
  const { uniqueid } = req.params;
  if (!uniqueid) return next(new Error(errorMessages.MALFORMED_INFO));

  try {
    const organization = await getOrganizationByUniqueid(uniqueid);
    res.json(organization);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

module.exports = router;
