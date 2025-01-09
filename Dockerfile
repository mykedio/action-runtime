FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN npm prune --production 
CMD ["node", "index"]