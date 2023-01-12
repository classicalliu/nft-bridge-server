import { HexString } from "@ckb-lumos/base";
import Knex, { Knex as KnexType } from "knex";
import { Config } from "../config";
import { fromHashType, hexToBuffer, Script, OutPoint } from "../types";
import { DBNRC721Token, fromDB, NRC721Token, toDB } from "./types";

const poolMax = Config.pgPoolMax || 20;
const GLOBAL_KNEX = Knex({
  client: "postgresql",
  connection: {
    connectionString: Config.databaseUrl,
    keepAlive: true,
  },
  pool: { min: 2, max: +poolMax },
});

export class NRC721Query {
  private knex: KnexType;
  private tableName = "nrc721_tokens";

  constructor() {
    this.knex = GLOBAL_KNEX;
  }

  async *collectNonMinedTokens(): AsyncGenerator<NRC721Token> {
    const tokensLimit = 100;
    const tokens = await this.knex<DBNRC721Token>(this.tableName)
      .where({
        layer2_has_mined: false
      }).limit(tokensLimit);

    for (let i = 0; i < tokens.length; i++) {
      const token = fromDB(tokens[i]);
      yield token
    }
  }

  async getOneByOutPoint(outPoint: OutPoint): Promise<NRC721Token | undefined> {
    const token = await this.knex<DBNRC721Token>(this.tableName) 
      .where({
        out_point_tx_hash: hexToBuffer(outPoint.tx_hash),
        out_point_index: +outPoint.index,
      })
      .first();
    if (token == null) {
      return undefined;
    }

    return fromDB(token)
  }

  async getOneByLayer1Token(
    factoryScript: Script,
    layer1TokenId: HexString
  ): Promise<NRC721Token | undefined> {
    const token = await this.knex(this.tableName)
      .where({
        factory_script_code_hash: hexToBuffer(factoryScript.code_hash),
        hash_type: fromHashType(factoryScript.hash_type),
        args: hexToBuffer(factoryScript.args),
        layer1_token_id: hexToBuffer(layer1TokenId),
      })
      .first();

    if (token == null) {
      return undefined;
    }

    return fromDB(token);
  }

  async save(token: NRC721Token) {
    const dbToken = toDB(token);
    const now = new Date();
    dbToken.created_at = now;
    dbToken.updated_at = now;

    return await this.knex<DBNRC721Token>(this.tableName).insert(dbToken);
  }

  async saveIfNotExists(token: NRC721Token) {
    const one = await this.getOneByOutPoint(token.out_point);
    if (one != null) {
      return one;
    }
    return await this.save(token)
  }

  async updateToMined(layer2_token_id: bigint) {
    await this.knex<DBNRC721Token>(this.tableName).where({ layer2_token_id: layer2_token_id.toString() }).update({ layer2_has_mined: true })
  }
}
