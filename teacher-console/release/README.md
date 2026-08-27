# Teacher Console update signing

The Console verifies a selected local manifest and package; it never downloads or executes an update automatically.

For production releases, create an Ed25519 key pair on a protected release machine. Keep the private key outside this repository and install only the public key as `release/update-public-key.pem` before packaging the Console.

Example owner workflow:

```bash
openssl genpkey -algorithm Ed25519 -out /secure/location/openclasscraft-update-private.pem
openssl pkey -in /secure/location/openclasscraft-update-private.pem -pubout -out release/update-public-key.pem
node release/create-update-manifest.cjs dist/OpenClassCraft-Teacher-Console-0.2.0-linux-x86_64.AppImage 0.2.0 /secure/location/openclasscraft-update-private.pem
```

Publish the package and its `.manifest.json` together. Do not commit the private key. A build without `update-public-key.pem` still verifies SHA-256 integrity but clearly reports that owner-signature verification is not configured.
