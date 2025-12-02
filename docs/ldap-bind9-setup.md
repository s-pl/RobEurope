# LDAP setup

## Overview
This document provides instructions for setting up LDAP authentication server integration for the RobEurope platform using Docker containers.

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

### Container Logs
```bash
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

1. **LDAP Connection Issues**
   ```bash
   # Check if OpenLDAP is running
   docker-compose ps openldap

   # Check LDAP logs
   docker-compose logs openldap

   # Test LDAP connectivity
   telnet localhost 389
   ```

2. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -tlnp | grep :53
   netstat -tlnp | grep :389

   # Stop conflicting services
   sudo systemctl stop systemd-resolved  # If using port 53
   ```

### Log Locations
- **LDAP Logs**: `docker-compose logs openldap`
- **System Logs**: `docker logs <container_name>`

## Backup and Recovery


## Helpful

- [osixia/openldap Docker Image](https://github.com/osixia/docker-openldap)
- [LDAP Documentation](https://www.openldap.org/doc/)
