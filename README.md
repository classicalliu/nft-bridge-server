# Godwoken NFT Bridge Server

## Development

### Config database

```bash
$ cat > ./packages/bridge/.env <<EOF
DATABASE_URL=<database url>
CKB_RPC=<ckb rpc>
CKB_INDEXER_RPC=<ckb indexer rpc>
GODWOKEN_RPC=<godwoken rpc>
MINER_LAYER1_ADDRESS=<miner layer1 address>
NFT_CONTRACT_ADDRESS=<Godwoken ERC721 contract address>
MINER_PRIVATE_KEY=<Godwoken ERC721 miner private key>
EOF

$ yarn

$ yarn knex migrate:latest
