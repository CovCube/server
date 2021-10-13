
# Documentation

## Server config

Environment variables can be specified in a .env file in the src directory.
These are parsed when the server is started and used to configure or customize the server. Below the default values are provided for each variable.

### Environment config

The environment of the node deployment (production or development) can be set with:

```text
NODE_ENV = 'development' # Can also be 'production'
```

See the [express documentation](http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)

### Express config

The express package can be customized with the following variables:

```text
PORT = '3000'
```

The secret for express-session can also provided, which is used to sign the
session cookies. See the [express-session documentation](https://github.com/expressjs/session#readme)

```text
SESSION_SECRET = 'secret'
```

### Database config

The node-postgres package connects to the database through these variables:

```text
PGHOST = 'localhost'
PGUSER = process.env.USER
PGPASSWORD = null
PGDATABASE = process.env.USER
PGPORT = 5432
```

See the [postgresql documentation](https://www.postgresql.org/docs/9.1/libpq-envars.html)

### MQTT config

Connection to the MQTT server is established though these variables:

```text
MQTTURL = 'mqtt://test.mosquitto.org'
MQTTPORT = 1883
```
