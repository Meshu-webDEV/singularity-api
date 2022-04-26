const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitchStrategy = require('passport-twitch-new').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { errorMessages } = require('./constants');

const { OAUTH } = require('./configs');
const { findUser } = require('../api/user/user.controller');
const {
  findOrCreateUser: gFindOrCreate,
} = require('../api/auth/Google/google.controller');
const {
  findOrCreateUser: tFindOrCreate,
} = require('../api/auth/Twitch/twitch.controller');
const { signinUser } = require('../api/auth/Local/local.controller');
const {
  isActivationRecordValid,
} = require('../api/activate/activate.controller');

passport.serializeUser(function (user, done) {
  /*
    From the user take just the id (to minimize the cookie size) and just pass the id of the user
    to the done callback
    PS: You dont have to do it like this its just usually done like this
    */
  return done(null, {
    id: user._id,
    username: user.username,
    displayName: user.displayName,
  });
});

passport.deserializeUser(async ({ id }, done) => {
  //
  try {
    const user = await findUser(id);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

// Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: OAUTH.GOOGLE_CLIENT,
      clientSecret: OAUTH.GOOGLE_SECRET,
      callbackURL: '/v1/authenticate/google/callback',
    },
    async (_, __, profile, done) => {
      try {
        const user = await gFindOrCreate(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Twitch strategy
passport.use(
  new TwitchStrategy(
    {
      clientID: OAUTH.TWITCH_CLIENT,
      clientSecret: OAUTH.TWITCH_SECRET,
      callbackURL: '/v1/authenticate/twitch/callback',
      scope: 'user_read',
    },
    async (_, __, profile, done) => {
      try {
        const user = await tFindOrCreate(profile);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Local strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (username, password, done) => {
      try {
        const { error, user } = await signinUser({
          email: username,
          password,
        });

        console.log('=== After signinUser');
        console.log(error, user);

        if (!error) return done({ status: 'success', user: user });

        return done({ status: 'inactive', user: user });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
