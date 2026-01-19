# Forward DNS Lookup
This document describes the **forward DNS lookup**

## Description

This document covers the **forward DNS lookup** configuration that keeps the public API endpoint reachable for the robotics platform. The lookup proves that `api.robeurope.samuelponce.es` resolves to the live edge IP `46.101.255.106`, which is the entry point for the backend when it is fronted by Vercel.

Sometimes the hostname advertises a **CNAME** to a Vercel edge. Even without that record, the lookup confirms traffic still reaches Vercel, keeping TLS, rate limits, and georouting consistent with the current IaC setup.


## How to Perform the Forward Lookup

You can verify the forward lookup using the following command:
```bash
nslookup api.robeurope.samuelponce.es
```

## Forward Lookup Evidence
![IMAGEN-LOOKUP](https://github.com/s-pl/RobEurope/blob/LXLLXVX-patch-2/img/lookup-back.png?raw=true)