#!/bin/bash

set -o errexit

cd /nft-bridge-server/packages/bridge && yarn knex migrate:latest

cd /nft-bridge-server
yarn run start
