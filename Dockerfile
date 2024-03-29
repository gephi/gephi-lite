FROM node

RUN mkdir -p /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./
COPY --chown=node:node . .

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 5173

# CMD [ "node", "app.js" ]
CMD [ "npm", "start", "--", "--host" ]

