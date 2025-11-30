import ldap from 'ldapjs';
import dotenv from 'dotenv';
dotenv.config();

const client = ldap.createClient({
  url: process.env.LDAP_URL,
});

const userDN = process.env.LDAP_USER_DN;

client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
  if (err) {
    console.error('Bind Error:', err);
    process.exit(1);
  }
  console.log('Bind Successful');

  const opts = {
    filter: '(objectClass=person)',
    scope: 'sub',
    attributes: ['cn', 'sn', 'mail', 'uid']
  };

  client.search(userDN, opts, (err, res) => {
    if (err) {
      console.error('Search Error:', err);
      process.exit(1);
    }

    res.on('searchEntry', (entry) => {
      console.log('--- Entry Found ---');
      console.log('Keys:', Object.keys(entry));
      console.log('entry.object:', entry.object);
      console.log('entry.pojo:', entry.pojo);
      console.log('entry.attributes:', JSON.stringify(entry.attributes, null, 2));
      console.log('Full entry:', JSON.stringify(entry, null, 2));
    });

    res.on('error', (err) => {
      console.error('Search Entry Error:', err);
    });

    res.on('end', (result) => {
      console.log('Search finished');
      client.unbind();
    });
  });
});
