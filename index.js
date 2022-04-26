require("dotenv").config();
console.clear();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const api = require("./api");
const { errorHandler, notFound, databaseStatus } = require("./middlewares");
const connect = require("./lib/database");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

// Configs
const { CLIENT, WEB_SERVER, SESSION, META, ADMIN } = require("./lib/configs");

const app = express();

//Database
connect()
  .then((client) => {
    console.log("Connected to mongodb");
    app.set("database", true);
    app.set("database-client", client);
  })
  .catch((err) => {
    console.log(`Error connecting to mongodb: ${err}`);
    app.set("database", false);
  });

// Middlewares
app.set("trust proxy", 1);
app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      `${
        WEB_SERVER.ENV === "production"
          ? CLIENT.URL_ORIGIN
          : "http://localhost:3000"
      }`,
      `${
        WEB_SERVER.ENV === "production"
          ? ADMIN.URL_ORIGIN
          : "http://localhost:3001"
      }`,
    ],
    credentials: true,
    allowedHeaders: "Content-Type,Authorization",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: SESSION.STORE_URL,
    }),
    secret: SESSION.STORE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: WEB_SERVER.ENV === "production" ? true : false,
      httpOnly: WEB_SERVER.ENV === "production" ? true : false,
      // sameSite: 'none', //on production
      maxAge: 1000 * 60 * 60 * 24 * 14, // Two Weeks
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport init
require("./lib/passport");

// RateLimiter init
require("./lib/ratelimiting");

app.get("/", (req, res) => {
  res.send("Hey");
});

// API route
app.use(`/${META.API_VERSION}`, databaseStatus, api);

app.listen(WEB_SERVER.PORT, () => {
  console.log(`Runnning on port: ${WEB_SERVER.PORT}`);
});

app.use(notFound);
app.use(errorHandler);
