FROM node:20-bookworm-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3005

CMD ["node", "index.js"]FROM node:18

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3006

CMD ["npm", "start"]
