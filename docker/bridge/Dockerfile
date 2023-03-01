FROM node:18-bullseye

RUN apt-get update \
 && apt-get dist-upgrade -y \
 && apt-get install curl -y \
 && apt-get install jq -y \
 && apt-get clean \
 && echo "Finished installing dependencies"

# RUN npm install pm2 -g

COPY . /nft-bridge-server/.

WORKDIR /nft-bridge-server
RUN yarn install && yarn run build
