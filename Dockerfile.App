FROM node:14-alpine
RUN apk add build-base make python3 python3-dev py3-pip
COPY ./ /app
WORKDIR /app
RUN python3 -m venv python-venv && \
    source python-venv/bin/activate && \
    pip install -r py-requirements.txt
RUN mkdir /usr/local/sbin && ln -s /usr/local/bin/node /usr/local/sbin/node && npm install --production
RUN npm run build:prod && npm run copy:python