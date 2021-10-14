FROM node:14-slim

# Define arguments for build
ARG SERVER_PORT

# Create the source directory
RUN mkdir /home/node/cube-server-source
WORKDIR /home/node/cube-server-source
# Create the dist directory
RUN mkdir /home/node/cube-server-dist

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

# Copy the compiled files into dist directory
RUN cp -R ./dist/* /home/node/cube-server-dist

# Remove the source directory and dev dependencies
RUN rm -R /home/node/cube-server
RUN npm uninstall typescript -g

# Set new working directory to dist directory
WORKDIR /home/node/cube-server-dist

# Copy dependencies into dist directory
# A wildcard is used to ensure both package.json AND package-lock.json are copied, when available
COPY ./package*.json .

# Install production dependencies
RUN npm install --production
# npm ci --only=production could also be used, but requires a package-lock.json

# Copy the static and template files
COPY ./public ./public
COPY ./templates ./templates
COPY .env .

EXPOSE ${SERVER_PORT}
ENV PORT ${SERVER_PORT}`~

CMD ["node", "./index.js"]