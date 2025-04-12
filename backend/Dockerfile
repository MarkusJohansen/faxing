FROM node:18-alpine

LABEL project="faxing"
LABEL component="backend"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "start"] 