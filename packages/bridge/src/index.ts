import { NFTCellCollector } from "./runners/cell_collector";
import { Miner } from "./runners/miner";

async function main() {
  new NFTCellCollector().startForever();
  new Miner().startForever();
}

main();
