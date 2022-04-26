const router = require("express").Router();

const { errorMessages } = require("../../lib/constants");
const { userExist, isAuth } = require("../../middlewares");
// Controllers
const {
  newTemplate,
  exploreTemplates,
  getPublicTemplates,
  getTemplateById,
  deleteTemplateById,
  getMyTemplates,
} = require("./template.controller");
const isEmpty = require("lodash.isempty");
const { _isEmpty } = require("../../lib/validation");

// GET ../api/v1/templates/explore
router.post("/explore", async (req, res, next) => {
  if (isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  const meta = req.body;

  let { skip = 0, limit = 8 } = req.query;

  try {
    const result = await exploreTemplates(skip, limit, meta);

    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});
// GET ../api/v1/templates/my-templates
router.post("/my-templates", isAuth, userExist, async (req, res, next) => {
  if (isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  const meta = req.body;

  let { skip = 0, limit = 8 } = req.query;

  try {
    const result = await getMyTemplates(skip, limit, meta, req.user._id);

    return res.json(result);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/templates/public
router.get("/public", userExist, async (req, res, next) => {
  try {
    const templates = await getPublicTemplates();
    res.json(templates);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// GET ../api/v1/templates/:id
router.get("/:uniqueid", async (req, res, next) => {
  if (_isEmpty(req.params))
    return next(new Error(errorMessages.MALFORMED_INFO));

  try {
    const { uniqueid } = req.params;
    console.log(uniqueid);
    const template = await getTemplateById(uniqueid);

    res.json(template);
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// DELETE ../api/v1/templates/:id
router.delete("/:uniqueid", userExist, async (req, res, next) => {
  if (_isEmpty(req.params)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const { uniqueid } = req.params;

    await deleteTemplateById(req.user._id, uniqueid);

    res.status(204).send();
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

// POST ../api/v1/templates/new
router.post("/new", isAuth, userExist, async (req, res, next) => {
  if (_isEmpty(req.body)) return next(new Error(errorMessages.MISSING_BODY));

  try {
    const uniqueid = await newTemplate(req.user._id, req.body);

    res.json({ uniqueid });
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

module.exports = router;
