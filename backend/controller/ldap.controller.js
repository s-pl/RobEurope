import ldap from 'ldapjs';
import dotenv from 'dotenv';
dotenv.config();

const client = ldap.createClient({
  url: process.env.LDAP_URL,
});


client.on('error', (err) => {
  console.error('LDAP Client Error:', err.message);
});

// Align with .env used by passport-ldapauth and init-ldap
const baseDN = process.env.LDAP_SEARCH_BASE; // e.g., dc=robeurope,dc=samuelponce,dc=es
const userDN = `ou=users,${baseDN}`;

const bindClient = () => {
  return new Promise((resolve, reject) => {
    client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};


export const listLdapUsers = async (req, res) => {
  try {
    await bindClient();
    const opts = {
      filter: '(objectClass=person)',
      scope: 'sub',
      attributes: ['cn', 'sn', 'mail', 'uid']
    };
  console.log(`Searching LDAP users in ${userDN} with filter ${opts.filter}`);
    client.search(userDN, opts, (err, search) => {
      if (err) {
        console.error('LDAP Search Error:', err);
        return res.status(500).json({ error: err.message });
      }
      const users = [];
      search.on('searchEntry', (entry) => {
        let userObj = entry.object;
        
        if (!userObj) {
           
            userObj = {};
            const attributes = entry.attributes || (entry.pojo && entry.pojo.attributes) || [];
            attributes.forEach(attr => {
                // attr.type is the key (e.g. 'uid'), attr.values is the value array
                if (attr.type && attr.values) {
                    userObj[attr.type] = attr.values;
                }
            });
           
            if (entry.objectName) userObj.dn = entry.objectName;
        }
        
        console.log('Processed User Object:', userObj);
        users.push(userObj);
      });
      search.on('end', (result) => {
        console.log('LDAP Search finished. Users found:', users.length);
        res.render('admin/ldap-users', { users, title: req.__('ldap.metaTitle'), pageKey: 'ldap' });
      });
      search.on('error', (err) => {
        console.error('LDAP Search Stream Error:', err);
        res.status(500).json({ error: err.message });
      });
    });
  } catch (error) {
    console.error('LDAP Controller Error:', error);
    res.status(500).json({ error: error.message });
  }
};


export const renderAddLdapUser = (req, res) => {
  res.render('admin/ldap-user-form', { user: null, action: 'add', title: req.__('ldap.form.addTitle'), pageKey: 'ldap' });
};


export const addLdapUser = async (req, res) => {
  const { uid, cn, sn, mail, password } = req.body;
  const dn = `uid=${uid},${userDN}`;
  const entry = {
    uid,
    cn,
    sn,
    mail,
    objectClass: ['person', 'organizationalPerson', 'inetOrgPerson'],
    userPassword: password // In production, hash this
  };
  console.log(`Adding LDAP user: ${dn}`, entry);
  try {
    await bindClient();
    client.add(dn, entry, (err) => {
      if (err) {
        console.error('LDAP Add Error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('LDAP User added successfully');
      // DELAY TO ENSURE THE USER IS WEELL PROCESSED BEFORE REDIRECT
      setTimeout(() => {
        res.redirect('/admin/ldap-users');
      }, 500);
    });
  } catch (error) {
    console.error('LDAP Add Controller Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const renderEditLdapUser = async (req, res) => {
  const uid = req.params.uid;
  const dn = `uid=${uid},${userDN}`;
  try {
    await bindClient();
    client.search(dn, { scope: 'base' }, (err, search) => {
      if (err) return res.status(500).json({ error: err.message });
      search.on('searchEntry', (entry) => {
        res.render('admin/ldap-user-form', { user: entry.object, action: 'edit', title: req.__('ldap.form.editTitle'), pageKey: 'ldap' });
      });
      search.on('error', (err) => {
        res.status(500).json({ error: err.message });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateLdapUser = async (req, res) => {
  const uid = req.params.uid;
  const { cn, sn, mail, password } = req.body;
  const dn = `uid=${uid},${userDN}`;
  const changes = [];
  if (cn) changes.push(new ldap.Change({ operation: 'replace', modification: { cn } }));
  if (sn) changes.push(new ldap.Change({ operation: 'replace', modification: { sn } }));
  if (mail) changes.push(new ldap.Change({ operation: 'replace', modification: { mail } }));
  if (password) changes.push(new ldap.Change({ operation: 'replace', modification: { userPassword: password } }));
  try {
    await bindClient();
    client.modify(dn, changes, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.redirect('/admin/ldap-users');
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteLdapUser = async (req, res) => {
  const uid = req.params.uid;
  const dn = `uid=${uid},${userDN}`;
  try {
    await bindClient();
    client.del(dn, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.redirect('/admin/ldap-users');
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};