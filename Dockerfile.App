FROM node:14-alpine
RUN apk add build-base make python3
COPY ./ /app
WORKDIR /app
RUN mkdir /usr/local/sbin && ln -s /usr/local/bin/node /usr/local/sbin/node && npm install --production