# This foler contains unit end-to-end and nuxt component tests

To run unit and Nuxt tests:
```bash
make test
```

## End-to-end tests

The e2e test needs to be ran by the user. It may stop and restart the stack, thus it cannot be ran while the productive system should be continuously served. 

Torun:

### 1) auth-session-login
```bash
TEST_AUTH_USERNAME='test-user' TEST_AUTH_PASSWORD='test-password' make test-auth-restart
```

It verifies that the logged-in profile still works after `make down` and
`make dev`. Named volumes are preserved.
