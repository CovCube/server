FROM node:14-slim

# Define arguments for build
ARG SERVER_PORT

# Create the source directory
RUN mkdir /home/node/cube-server
WORKDIR /home/node/cube-server

## Install typescript globally to compile source
RUN npm install typescript -g

# Copy dependencies into source directory
# A wildcard is used to ensure both package.json AND package-lock.json are copied, when available
COPY ./package*.json .

#Install dependencies including dev
RUN npm install
# npm ci could also be used, but requires a package-lock.json

# Copy the typescript source and compile it to ./dist
COPY ./src ./src
COPY ./tsconfig.json .
RUN tsc

# Remove dev dependencies
RUN npm prune --production
RUN npm uninstall typescript -g
# Remove source files
RUN rm -r ./src

# Copy the static and template files
COPY ./public ./dist/public
COPY ./templates ./dist/templates
COPY .env ./dist/

EXPOSE ${SERVER_PORT}

CMD ["node", "./dist/index.js"]