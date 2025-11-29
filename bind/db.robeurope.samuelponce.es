$TTL 86400
@   IN  SOA ns1.robeurope.samuelponce.es. admin.robeurope.samuelponce.es. (
        2025112901  ; Serial
        3600        ; Refresh
        1800        ; Retry
        604800      ; Expire
        86400       ; Minimum TTL
)

@       IN  NS  ns1.robeurope.samuelponce.es.
ns1     IN  A   46.101.255.106  ; Assuming your server IP
@       IN  A   46.101.255.106
www     IN  CNAME @
api     IN  A   46.101.255.106