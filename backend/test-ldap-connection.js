import ldap from 'ldapjs';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- LDAP Configuration Check ---');
console.log('LDAP_URL:', process.env.LDAP_URL);
console.log('LDAP_BIND_DN:', process.env.LDAP_BIND_DN);
console.log('LDAP_BASE_DN:', process.env.LDAP_BASE_DN);
console.log('LDAP_USER_DN:', process.env.LDAP_USER_DN);
console.log('LDAP_BIND_PASSWORD length:', process.env.LDAP_BIND_PASSWORD ? process.env.LDAP_BIND_PASSWORD.length : 0);

const client = ldap.createClient({
  url: process.env.LDAP_URL,
});

client.on('error', (err) => {
    console.error('Client error:', err);
});

console.log('Attempting to bind...');
client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
  if (err) {
    console.error('Bind Error:', err);
    process.exit(1);
  }
  console.log('Bind Successful!');
  
  const opts = {
    filter: '(objectClass=*)',
    scope: 'base',
    attributes: ['dn', 'cn']
  };

  client.search(process.env.LDAP_BASE_DN, opts, (err, res) => {
      if (err) {
          console.error('Search Error:', err);
          process.exit(1);
      }
      
      res.on('searchEntry', (entry) => {
          console.log('Found entry:', entry.objectName);
      });
      
      res.on('error', (err) => {
          console.error('Search Entry Error:', err);
      });
      
      res.on('end', (result) => {
          console.log('Search finished status:', result.status);
          client.unbind();
          process.exit(0);
      });
  });
});
