# LDAP Bind9 Setup

## Overview
This document provides instructions for setting up LDAP authentication with Bind9 DNS server integration for the RobEurope platform using Docker containers.

## Prerequisites
- Docker and Docker Compose installed
- Basic knowledge of Docker, LDAP and DNS concepts
- Domain name (robeurope.samuelponce.es in this example)

## Docker Compose Setup

### Complete docker-compose.yml Configuration

```yaml
version: '3.8'

services:
  openldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    environment:
      LDAP_ORGANISATION: "RobEurope"
      LDAP_DOMAIN: "robeurope.samuelponce.es"
      LDAP_ADMIN_PASSWORD: "adminpassword"
      LDAP_CONFIG_PASSWORD: "configpassword"
      LDAP_TLS: "false"  # For simplicity, disable TLS
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - ldap_data:/var/lib/ldap
      - ldap_config:/etc/ldap/slapd.d
    networks:
      - robeurope_network

  bind9:
    image: sameersbn/bind:9.16.1-20200524
    container_name: bind9
    environment:
      WEBMIN_ENABLED: "false"
    ports:
      - "53:53/udp"
      - "53:53/tcp"
      - "10000:10000"  # Webmin if enabled
    volumes:
      - bind_data:/data
      - ./bind/named.conf:/data/named.conf
      - ./bind/db.robeurope.samuelponce.es:/data/db.robeurope.samuelponce.es
    networks:
      - robeurope_network

volumes:
  ldap_data:
  ldap_config:
  bind_data:

networks:
  robeurope_network:
    driver: bridge
```

## Bind9 Configuration

### named.conf Configuration

Create the file `bind/named.conf`:

```bash
options {
    directory "/data";
    listen-on port 53 { any; };
    listen-on-v6 port 53 { any; };
    allow-query { any; };
    recursion yes;
    forwarders {
        8.8.8.8;
        8.8.4.4;
    };
};

zone "robeurope.samuelponce.es" {
    type master;
    file "/data/db.robeurope.samuelponce.es";
};
```

### Zone File Configuration

Create the zone file `bind/db.robeurope.samuelponce.es`:

```bash
$TTL 86400
@   IN  SOA ns1.robeurope.samuelponce.es. admin.robeurope.samuelponce.es. (
        2025112901  ; Serial
        3600        ; Refresh
        1800        ; Retry
        604800      ; Expire
        86400       ; Minimum TTL
)

@       IN  NS  ns1.robeurope.samuelponce.es.
ns1     IN  A   46.101.255.106  ; Your server IP
@       IN  A   46.101.255.106
www     IN  CNAME @
api     IN  A   46.101.255.106
```

## Installation and Setup

### 1. Create Configuration Directory
```bash
mkdir -p bind
```

### 2. Create Configuration Files
Create the files as shown above in the `bind/` directory.

### 3. Update IP Addresses
Replace `46.101.255.106` with your actual server IP address in the zone file.

### 4. Start Services
```bash
docker-compose up -d
```

### 5. Verify Services
```bash
# Check if containers are running
docker-compose ps

# Test DNS resolution
nslookup robeurope.samuelponce.es 127.0.0.1

# Test LDAP connection
ldapsearch -x -H ldap://localhost -b dc=robeurope,dc=samuelponce,dc=es
```

## Bind9 Docker Image Details

### Image: sameersbn/bind:9.16.1-20200524
- **Base**: Ubuntu with Bind9 9.16.1
- **Features**:
  - Pre-configured Bind9 installation
  - Volume persistence for configuration
  - Webmin interface (optional)
  - Automatic configuration loading

### Volume Mounts
- `/data`: Main data directory for Bind9
- `named.conf`: Main configuration file
- Zone files: Domain-specific configurations

### Environment Variables
- `WEBMIN_ENABLED`: Enable/disable Webmin interface (default: false)

## DNS Records Explanation

### SOA Record
```
@   IN  SOA ns1.robeurope.samuelponce.es. admin.robeurope.samuelponce.es. (
        2025112901  ; Serial - increment when making changes
        3600        ; Refresh - how often secondary DNS servers check for updates
        1800        ; Retry - how often to retry failed zone transfers
        604800      ; Expire - when secondary servers should discard zone data
        86400       ; Minimum TTL - default TTL for records
)
```

### NS Record
```
@       IN  NS  ns1.robeurope.samuelponce.es.
```
Nameserver record pointing to the primary DNS server.

### A Records
```
ns1     IN  A   46.101.255.106  ; Nameserver IP
@       IN  A   46.101.255.106  ; Domain apex IP
api     IN  A   46.101.255.106  ; API subdomain IP
```

### CNAME Record
```
www     IN  CNAME @  ; www.robeurope.samuelponce.es points to robeurope.samuelponce.es
```

## LDAP Integration

### LDAP Base DN
- **Domain**: robeurope.samuelponce.es
- **Base DN**: dc=robeurope,dc=samuelponce,dc=es
- **Admin DN**: cn=admin,dc=robeurope,dc=samuelponce,dc=es

### LDAP Configuration
- **Organization**: RobEurope
- **Admin Password**: adminpassword (change in production!)
- **Config Password**: configpassword (change in production!)
- **TLS**: Disabled for simplicity (enable in production)

## Testing and Verification

### DNS Testing
```bash
# Test domain resolution
dig @127.0.0.1 robeurope.samuelponce.es

# Test subdomain resolution
dig @127.0.0.1 www.robeurope.samuelponce.es
dig @127.0.0.1 api.robeurope.samuelponce.es

# Test nameserver
dig @127.0.0.1 ns1.robeurope.samuelponce.es
```

### LDAP Testing
```bash
# Test LDAP connection
ldapsearch -x -H ldap://localhost -b dc=robeurope,dc=samuelponce,dc=es

# Test admin login
ldapsearch -x -D cn=admin,dc=robeurope,dc=samuelponce,dc=es -w adminpassword -b dc=robeurope,dc=samuelponce,dc=es
```

### Container Logs
```bash
# View Bind9 logs
docker-compose logs bind9

# View LDAP logs
docker-compose logs openldap
```

## Production Considerations

### Security Improvements
1. **Enable TLS for LDAP**:
   ```yaml
   environment:
     LDAP_TLS: "true"
   ```

2. **Change Default Passwords**:
   ```yaml
   environment:
     LDAP_ADMIN_PASSWORD: "your_secure_password"
     LDAP_CONFIG_PASSWORD: "your_config_password"
   ```

3. **Restrict DNS Queries**:
   ```bash
   allow-query { trusted_networks; };
   ```

### Performance Tuning
- Increase container resources if needed
- Configure DNS caching
- Set up secondary DNS servers

### Monitoring
```bash
# Check container resource usage
docker stats

# Monitor DNS queries
docker-compose exec bind9 tail -f /var/log/named/query.log
```

## Troubleshooting

### Common Issues

1. **DNS Resolution Fails**
   ```bash
   # Check if Bind9 is running
   docker-compose ps bind9

   # Check Bind9 logs
   docker-compose logs bind9

   # Test configuration syntax
   docker-compose exec bind9 named-checkconf /data/named.conf
   docker-compose exec bind9 named-checkzone robeurope.samuelponce.es /data/db.robeurope.samuelponce.es
   ```

2. **LDAP Connection Issues**
   ```bash
   # Check if OpenLDAP is running
   docker-compose ps openldap

   # Check LDAP logs
   docker-compose logs openldap

   # Test LDAP connectivity
   telnet localhost 389
   ```

3. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -tlnp | grep :53
   netstat -tlnp | grep :389

   # Stop conflicting services
   sudo systemctl stop systemd-resolved  # If using port 53
   ```

### Log Locations
- **Bind9 Logs**: `docker-compose logs bind9`
- **LDAP Logs**: `docker-compose logs openldap`
- **System Logs**: `docker logs <container_name>`

## Backup and Recovery

### Backup Configuration
```bash
# Backup configuration files
tar -czf bind-backup.tar.gz bind/

# Backup Docker volumes
docker run --rm -v robeurope_bind_data:/data -v $(pwd):/backup alpine tar czf /backup/bind_data.tar.gz -C / data
```

### Restore Configuration
```bash
# Restore configuration files
tar -xzf bind-backup.tar.gz

# Restore Docker volumes
docker run --rm -v robeurope_bind_data:/data -v $(pwd):/backup alpine sh -c "cd / && tar xzf /backup/bind_data.tar.gz"
```

## Additional Resources

- [sameersbn/bind Docker Image](https://github.com/sameersbn/docker-bind)
- [osixia/openldap Docker Image](https://github.com/osixia/docker-openldap)
- [Bind9 Documentation](https://bind9.readthedocs.io/)
- [LDAP Documentation](https://www.openldap.org/doc/)
