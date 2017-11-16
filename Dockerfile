FROM node:8-slim

ADD ./ /usr/src/entu-auth
RUN cd /usr/src/entu-auth && npm --silent --production install

CMD ["node", "/usr/src/entu-auth/worker.js"]
