import ldap from 'ldapjs';
import dotenv from 'dotenv';
dotenv.config();

const client = ldap.createClient({
  url: process.env.LDAP_URL,
});

const baseDN = process.env.LDAP_SEARCH_BASE; // dc=robeurope,dc=samuelponce,dc=es
const usersOU = `ou=users,${baseDN}`;

client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
  if (err) {
    console.error('Bind error:', err);
    process.exit(1);
  }

  // Add ou=users if not exists
  const ouEntry = {
    objectClass: ['top', 'organizationalUnit'],
    ou: 'users'
  };

  client.add(usersOU, ouEntry, (err) => {
    if (err && err.code !== 68) { // 68 is already exists
      console.error('Add ou error:', err);
    } else {
      console.log('OU users added or already exists');
    }
    client.unbind();
  });
});