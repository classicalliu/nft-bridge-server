import { NftCellCollector } from "./runners/cell_collector";
import { Miner } from "./runners/miner";

async function main() {
  new NftCellCollector().startForever();
  new Miner().startForever();
}

main();
