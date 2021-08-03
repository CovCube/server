
# Documentation

## Server config

Environment variables can be specified in a .env file in the src directory.
These are parsed when the server is started.

### Database config

node-postgres connects to the database through environment variables, which should
be specified in the .env file:

```text
PGHOST = 'localhost'
PGUSER = process.env.USER
PGPASSWORD = null
PGDATABASE = process.env.USER
PGPORT = 5432
```

### MQTT config

These are the variables used to connect to the mqtt-server.

These are the default used values, if no environment variables are provided:

```text
MQTTURL = 'mqtt://test.mosquitto.org'
MQTTPORT = 1883
```
