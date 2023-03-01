import { Knex } from "knex";

// u32: bigint(i64)
// u64: decimal(20, 0)
// u128: decimal(40, 0)
// u256: decimal(80, 0)
export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("nrc721_factory_scripts", (table: Knex.TableBuilder) => {
      table.bigIncrements("id");

      table.binary("out_point_tx_hash").notNullable();
      table.integer("out_point_index").notNullable();

      table.decimal("block_number", 20, 0).notNullable();

      table.unique([
        "out_point_tx_hash",
        "out_point_index",
      ])

      table.binary("code_hash").notNullable();
      table.tinyint("hash_type").notNullable();
      table.binary("args").notNullable();

      table.unique([
        "code_hash",
        "hash_type",
        "args",
      ])

      // token info
      table.string("name").notNullable();
      table.string("symbol").notNullable();
      table.string("base_uri").notNullable();
      table.string("extra_data").nullable();

      table.timestamp("created_at").notNullable();
      table.timestamp("updated_at").notNullable();
    })

  await knex.schema
  .createTable("nrc721_tokens", (table: Knex.TableBuilder) => {
    table.bigIncrements("id");

    table.binary("out_point_tx_hash").notNullable();
    table.integer("out_point_index").notNullable();

    table.decimal("block_number", 20, 0).notNullable();

    table.unique([
      "out_point_tx_hash",
      "out_point_index",
    ])

    table.binary("lock_script_code_hash").notNullable();
    table.tinyint("lock_script_hash_type").notNullable();
    table.binary("lock_script_args").notNullable();

    table.binary("type_script_code_hash").notNullable();
    table.tinyint("type_script_hash_type").notNullable();
    
    table.binary("layer1_token_id").notNullable();
    table.decimal("factory_id", 20, 0).notNullable();

    table.unique([
      "factory_id",
      "layer1_token_id"
    ])

    table.binary("output_data").notNullable();
    table.string("data").nullable();
    
    // bridge info
    table.boolean("layer2_has_mined").notNullable();
    // uint256
    table.decimal("layer2_token_id", 80, 0).notNullable().unique();
    table.binary("layer2_to_address").notNullable();

    table.timestamp("created_at").notNullable();
    table.timestamp("updated_at").notNullable();
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("nrc721_tokens")
  await knex.schema.dropTable("nrc721_factory_scripts")
}

