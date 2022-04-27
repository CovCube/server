
# Documentation

## Server config

Environment variables can be specified in the .env-file in the src directory.
These are parsed when the server is started and used to configure or customize the server. Below the default values are provided for each variable.

### Environment config

The environment of the node deployment (production or development) can be set with:

```text
NODE_ENV = 'development' # Can also be 'production'
```

See the [express documentation](http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)

If the node environment is set to *production* the send content security policy header forces all http requests from
the server frontend to be upgraded to https. If it is set *development* this is not done.

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
PGUSER = postgres
PGPASSWORD = pw
PGDATABASE = postgres
PGPORT = 5432
```

See the [postgresql documentation](https://www.postgresql.org/docs/9.1/libpq-envars.html)

### MQTT config

Connection to the MQTT server is established though these variables:

```text
MQTTURL = 'test.mosquitto.org'
MQTTPORT = 1883
MQTT_PUBLIC = 'localhost'
MQTT_PUBLICPORT = '1884'
```

The MQTTPUBLIC and MQTT_PUBLICPORT variables can be used to point to the public
address of the mqtt server. If these are not provided, MQTTURL and MQTTPORT are used.
The values of these variables are send to the cubes, so they can connect to the mqtt server.
This is useful, if the cubekit & mqtt servers run inside of containers and are connected internally.
Or if the cubes should use a different port than the cubekit server to connect to the mqtt server.

## Docker

### Dockerfile

The Dockerfile creates an image of the server which exposes a port, given through
build-arg.
The server can be modified with the servers .env-file. See the documentation above at [server config](#server-config).

```text
docker build --build-arg SERVER_PORT=8080 -t imagename:tag .
```

### docker-compose

The docker-compose file creates containers for the server, postgresql and eclipse-mosquitto and links them up.

```text
docker compose up -d
```

Make sure the following directory is created on the host: /var/lib/postgres/data  
This is where the database files for postgresql are saved to.

These environmental variables are overwritten by docker-compose, because they define connections inside the docker network. So they do not need to be provided in their .env-files:

```text
# .env variables
PGHOST: "postgres_db"
PGPORT: "5432"
MQTTURL: "mosquitto_broker"
MQTTPORT: "1883"

# postgres.env variables
PGDATA: "/var/lib/postgres/data/pgdata"
```

#### Cubekit-Server & PostgreSQL containers

Environment variables for the images can be set with the .env-file for the node server
and postgres.env for the database. These have to be located in the root of this repository.

For the .env-file see the documentation above at [server config](#server-config).  
For postgres.env see the documentation at [postgres config](https://github.com/docker-library/docs/blob/master/postgres/README.md#environment-variables).

The variables PGHOST, PGPORT, MQTTURL and MQTTPORT are set directly in the docker-compose file and
override the variables in the .env-file. This is done to ensure connection to
the PostgreSQL and Mosquitto containers.

Don't forget to set the variables PGUSER, PGPASSWORD and PGDATABASE in the .env-file.

The variables MQTT_PUBLIC and MQTT_PUBLICPORT should be set in the .env file, to make
sure cubes can connect to Mosquitto from outside the docker network.

When changing the .env-files, make sure to rebuild the containers.

```text
docker compose up -d --build
```

#### Mosquitto container
The Mosquitto server can be customized with the mosquitto.conf file.

The configuration provided with this repository has a listener on port 1883,
which does not need authentication. This port is exposed to the other containers
through docker-compose, so that the node-server can communicate with the mosquitto server.

It also has a listener on port 1884 with username/password authentication.
This port is exposed to the host system through docker-compose, so that other applications
(e.g. cubes, cube-apps) can access the server. Users and passwords can be
preconfigured in a passwords (no file type) file.
The file has to be located in the mosquitto directory.

```text
./mosquitto/passwords
--------------------------------------------------------------------------------

user:password
user2:password2
...

```
