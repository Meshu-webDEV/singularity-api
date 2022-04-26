const router = require("express").Router();
const mail = require("../lib/mail");

// routes
const authenticate = require("./auth");
const user = require("./user/user.routes");
const event = require("./event/event.routes");
const team = require("./team/team.routes");
const webhook = require("./webhooks/webhook.routes");
const organization = require("./organization/organization.routes");
const templates = require("./template/template.routes");
const stats = require("./stats/stats.routes");
const sys = require("./sys/sys.routes");
const activate = require("./activate/activate.routes");
const admin = require("./admin/admin.routes");

// Middlewares
const { upload } = require("../lib/multer");
const { isAuth } = require("../middlewares");

// Root API endpoints ==

// POST ../v1/upload-files
// prettier-ignore
router.post('/upload-files', isAuth, upload.single('avatar'), (req, res, next) => {

  const {file} = req

  return res.status(201).json({key: file.key, location: file.location});
  
  });

// Sub-API routes ==
// router.use('/authentication', auth);
router.use("/authenticate", authenticate);
router.use("/events", event);
router.use("/stats", stats);
router.use("/user", user);
router.use("/admin", admin);
router.use("/activate", activate);
router.use("/webhooks", isAuth, webhook);
router.use("/organizations", organization);
router.use("/templates", templates);
router.use("/teams", isAuth, team);
router.use("/sys", isAuth, sys);

module.exports = router;
