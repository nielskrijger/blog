FROM node:6.10-alpine
MAINTAINER nielskrijger

# Install package json
WORKDIR /app
COPY /package.json /app
RUN npm install && npm cache clear

# Bundle Node.js app
COPY . /app
EXPOSE 8080

CMD ["npm", "start"]
