FROM node:24.20-alpine
WORKDIR /cooktale-app

COPY package*.json .
RUN npm install

COPY . .

EXPOSE 3000
COPY ./start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]


# CMD ["npm", "run", "dev"]
