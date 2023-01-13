import { HexString } from "@ckb-lumos/base";
import Knex, { Knex as KnexType } from "knex";
import { Config } from "../base/config";
import { fromHashType, hexToBuffer, Script, OutPoint } from "../types";
import { DBNRC721Token, tokenFromDB, tokenToDB, NRC721TokenWithFactoryScript, DBNRC721FactoryScript, factoryScriptFromDB, factoryScriptToDB } from "./types";

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
  private tokenTableName = "nrc721_tokens";
  private factoryScriptTableName = "nrc721_factory_scripts"

  constructor() {
    this.knex = GLOBAL_KNEX;
  }

  async *collectNonMinedTokens(): AsyncGenerator<NRC721TokenWithFactoryScript> {
    const tokensLimit = 100;
    const tokens = await this.knex<DBNRC721Token>(this.tokenTableName)
      .where({
        layer2_has_mined: false
      })
      .limit(tokensLimit);

    const factoryIds: string[] = tokens.map(t => t.factory_id!);

    const factories = await this.knex<DBNRC721FactoryScript>(this.factoryScriptTableName)
      .whereIn("id", factoryIds);

    const mapping = new Map<string, DBNRC721FactoryScript>();
    factories.forEach(f => {
      mapping.set(f.id!, f);
    })

    for (let i = 0; i < tokens.length; i++) {
      const factory = mapping.get(tokens[i].factory_id!)!;
      const factoryScript = factoryScriptFromDB(factory);
      const token = tokenFromDB(tokens[i], factoryScript.script);
      yield {
        token,
        factory_script: factoryScript,
      }
    }
  }

  async getOneByOutPoint(outPoint: OutPoint): Promise<NRC721TokenWithFactoryScript | undefined> {
    const token = await this.knex<DBNRC721Token>(this.tokenTableName) 
      .where({
        out_point_tx_hash: hexToBuffer(outPoint.tx_hash),
        out_point_index: +outPoint.index,
      })
      .first();
    if (token == null) {
      return undefined;
    }

    const factoryScript = await this.knex<DBNRC721FactoryScript>(this.factoryScriptTableName)
      .where({
        id: token.factory_id!.toString(),
      })
      .first();

    if (factoryScript == null) {
      throw new Error(`Factory script not found by token: ${token.id}`)
    }

    const f = factoryScriptFromDB(factoryScript)
    return {
      token: tokenFromDB(token, f.script),
      factory_script: f,
    }
  }

  async getOneByLayer1Token(
    factoryScript: Script,
    layer1TokenId: HexString
  ): Promise<NRC721TokenWithFactoryScript | undefined> {
    const factory = await this.knex<DBNRC721FactoryScript>(this.factoryScriptTableName)
      .where({
        code_hash: hexToBuffer(factoryScript.code_hash),
        hash_type: fromHashType(factoryScript.hash_type),
        args: hexToBuffer(factoryScript.args),
      })
      .first();

    if (factory == null) {
      return undefined;
    }

    const token = await this.knex<DBNRC721Token>(this.tokenTableName)
      .where({
        factory_id: factory.id!.toString(),
        layer1_token_id: hexToBuffer(layer1TokenId),
      })
      .first();

    if (token == null) {
      return undefined;
    }

    const f = factoryScriptFromDB(factory);
    return {
      token: tokenFromDB(token, f.script),
      factory_script: f,
    }
  }

  private async saveFactoryScriptIfNotExists(factoryScript: DBNRC721FactoryScript, now: Date): Promise<bigint> {
    const one = await this.knex<DBNRC721FactoryScript>(this.factoryScriptTableName)
      .where({
        code_hash: factoryScript.code_hash,
        hash_type: factoryScript.hash_type,
        args: factoryScript.args,
      })
      .select("id")
      .first();

    if (one != null) {
      return BigInt(one.id!)
    }

    factoryScript.created_at = now;
    factoryScript.updated_at = now;

    const result = await this.knex<DBNRC721FactoryScript>(this.factoryScriptTableName)
      .insert(factoryScript).returning("id");

    return BigInt(result[0].id!);
  }

  async saveToken(tokenWithFactoryScript: NRC721TokenWithFactoryScript) {
    const dbToken = tokenToDB(tokenWithFactoryScript.token);
    const dbFactoryScript = factoryScriptToDB(tokenWithFactoryScript.factory_script);

    const now = new Date();
    const id = await this.saveFactoryScriptIfNotExists(dbFactoryScript, now);

    dbToken.created_at = now;
    dbToken.updated_at = now;
    dbToken.factory_id = id.toString();

    return await this.knex<DBNRC721Token>(this.tokenTableName).insert(dbToken);
  }

  // If already exists, return false
  // If saved, return true
  async saveIfNotExists(tokenWithFactoryScript: NRC721TokenWithFactoryScript): Promise<boolean> {
    const one = await this.getOneByOutPoint(tokenWithFactoryScript.token.out_point);
    if (one != null) {
      return false;
    }
    await this.saveToken(tokenWithFactoryScript)
    return true
  }

  async updateToMined(layer2_token_id: bigint) {
    const now = new Date();
    await this.knex<DBNRC721Token>(this.tokenTableName).where({ layer2_token_id: layer2_token_id.toString() }).update({ layer2_has_mined: true, updated_at: now })
  }
}
