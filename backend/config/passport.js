import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import LdapStrategy from 'passport-ldapauth';
import db from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

const User = db.User;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const handleSocialLogin = async (req, accessToken, refreshToken, profile, done, providerField) => {
  try {
  
    let user = await User.findOne({ where: { [providerField]: profile.id } });

    if (user) {
      return done(null, user);
    }


    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    if (email) {
      user = await User.findOne({ where: { email } });
      if (user) {
    
        user[providerField] = profile.id;
        await user.save();
        return done(null, user);
      }
    }

  
    let username = profile.username || (email ? email.split('@')[0] : `user_${uuidv4().substring(0, 8)}`);
    
 
    let existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        username = `${username}_${uuidv4().substring(0, 4)}`;
    }

    const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
    const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'Name';

    user = await User.create({
      first_name: firstName,
      last_name: lastName,
      username: username,
      email: email || `noemail_${uuidv4()}@example.com`, 
      [providerField]: profile.id,
      password_hash: null, 
    });

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
};


if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Registering Google Strategy');
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://api.robeurope.samuelponce.es/api/auth/google/callback",
        passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
        handleSocialLogin(req, accessToken, refreshToken, profile, done, 'google_id');
    }
    ));
} else {
    console.log('Google Client ID or Secret missing');
}


if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    console.log('Registering GitHub Strategy');
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://api.robeurope.samuelponce.es/api/auth/github/callback",
        passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
        handleSocialLogin(req, accessToken, refreshToken, profile, done, 'github_id');
    }
    ));
} else {
    console.log('GitHub Client ID or Secret missing');
}



export default passport;

// LDAP Strategy (optional; registers only if env vars are provided)
try {
  const {
    LDAP_URL,
    LDAP_BIND_DN,
    LDAP_BIND_PASSWORD,
    LDAP_SEARCH_BASE,
    LDAP_SEARCH_FILTER
  } = process.env;

  if (LDAP_URL && LDAP_SEARCH_BASE && (LDAP_SEARCH_FILTER || true)) {
    const OPTS = {
      server: {
        url: LDAP_URL,
        bindDN: LDAP_BIND_DN,
        bindCredentials: LDAP_BIND_PASSWORD,
        searchBase: LDAP_SEARCH_BASE,
        // Default filter uses mail or uid
        searchFilter: LDAP_SEARCH_FILTER || '(|(mail={{username}})(uid={{username}}))',
        // Return raw attributes we care about
        searchAttributes: ['dn', 'cn', 'sn', 'givenName', 'mail', 'uid']
      },
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    };

    passport.use('ldapauth', new LdapStrategy(OPTS, async (req, user, done) => {
      try {
        // user contains LDAP attributes per searchAttributes
        const email = user.mail || null;
        const uid = user.uid || null;
        const firstName = user.givenName || 'User';
        const lastName = user.sn || 'LDAP';
        const usernameBase = uid || (email ? String(email).split('@')[0] : `ldap_${Date.now()}`);

        // 1) Try to find existing by email
        let local = email ? await User.findOne({ where: { email } }) : null;
        // 2) Else by username
        if (!local) local = await User.findOne({ where: { username: usernameBase } });

        if (!local) {
          // Create a local user record linked via username/email; no password hash stored
          let uniqueUsername = usernameBase;
          const exists = await User.findOne({ where: { username: uniqueUsername } });
          if (exists) uniqueUsername = `${uniqueUsername}_${uuidv4().slice(0,4)}`;

          local = await User.create({
            first_name: firstName,
            last_name: lastName,
            username: uniqueUsername,
            email: email || null,
            password_hash: null
          });
        }

        // Success: create session
        return done(null, local);
      } catch (err) {
        return done(err);
      }
    }));
    console.log('Registering LDAP Strategy');
  } else {
    console.log('LDAP env vars not set; skipping LDAP strategy');
  }
} catch (e) {
  console.log('LDAP strategy init failed:', e.message);
}
