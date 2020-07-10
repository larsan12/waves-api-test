const { Pool } = require('pg')
const knex = require('knex')({client: 'pg'})
const randomstring = require('randomstring');

const TIMES_TO_DUPLICATE = 20
const PARTITION = 10000

const txs = [4, 5, 6, 8, 9, 10, 13, 14, 15, 102, 103, 106, 107, 111, 112, 113, 114]

class Storage {
  constructor (config) {
    this.dbPool = new Pool(config)
  }

  async query (sql, params) {
    const res = await this.dbPool.query(sql, params)
    return res.rows
  }
}

const target = new Storage({
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'main-load',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  max: 15, // https://node-postgres.com/api/pool
  min: 4
});

(async () => {
  try {
    let [{
      height: maxHeight,
      max: maxTime,
      min: minTime
    }] = await target.query('SELECT MAX(height) as height, MAX(time_stamp), MIN(time_stamp) from txs')

    maxTime = new Date(maxTime)
    minTime = new Date(minTime)

    const timeDiff = maxTime.getTime() - minTime.getTime()
    console.log('start')

    // BLOCKS
    const blocks = await target.query('SELECT * from blocks')
    for (let i = 1; i <= TIMES_TO_DUPLICATE; i ++ ) {
      const newBlocks = blocks.map(block => getNewBlock(block, i, maxHeight, timeDiff))
      const sql = knex('blocks').insert(newBlocks).toString()
      await target.query(sql)
      console.log('Blocks iteration done: ' + i)
    }

    // TRANSACTIONS
    for (let i = 0; i < txs.length; i++) {
      await fillTx(`txs_${txs[i]}`, maxHeight, timeDiff)
    }

    await fill11(maxHeight, timeDiff)
    await fill12(maxHeight, timeDiff)
    await fill104(maxHeight, timeDiff)

  } catch (err) {
    console.log(err)
  }
})();

function getNewBlock(block, i, maxHeight, timeDiff) {
  return {
    ...block,
    height: block.height + maxHeight * i,
    time_stamp: new Date((new Date(block.time_stamp)).getTime() + timeDiff * i)
  }
}

function getNewTx(tx, i, maxHeight, timeDiff) {
  return {
    ...tx,
    height: tx.height + maxHeight * i,
    time_stamp: new Date((new Date(tx.time_stamp)).getTime() + timeDiff * i),
    id: randomstring.generate(64)
  }
}

async function fillTx(table, maxHeight, timeDiff) {
  const txs = await target.query(`SELECT * from ${table}`)
  if (txs.length) {
    for (let i = 1; i <= TIMES_TO_DUPLICATE; i++) {
      const newTxs = txs.map(tx => getNewTx(tx, i, maxHeight, timeDiff))
      const sql = knex(table).insert(newTxs).toString()
      await target.query(sql)
      console.log(`Table ${table} iteration ${i} done`)
    }
  }
}

async function fill104(maxHeight, timeDiff) {
  let iteration = 0
  while (true) {
    const txs = await target.query(`
      WITH txs as (
        SELECT tx.*
          FROM txs_104 as tx
          WHERE height < ${maxHeight}
          ORDER by height ASC
          LIMIT ${PARTITION} OFFSET ${iteration * PARTITION}
      )
      SELECT *, p.position_in_tx as pp, r.position_in_tx as rr
        FROM txs
        LEFT JOIN txs_104_params as p ON txs.id = p.tx_id
        LEFT JOIN txs_104_results as r ON txs.id = r.tx_id
    `);
    if (txs.length) {
      for (let i = 1; i <= TIMES_TO_DUPLICATE; i++) {
        const newTxs = {}
        const txsResults = {}
        const txsParams = {}
        txs.forEach(t => {
          const {
            tx_id,
            param_key,
            param_type,
            param_value_integer,
            param_value_boolean,
            param_value_binary,
            param_value_string,
            result_key,
            result_type,
            result_value_integer,
            result_value_boolean,
            result_value_binary,
            result_value_string,
            position_in_tx,
            pp,
            rr,
            ...tx
          } = t
          const trx = getNewTx(tx, i, maxHeight, timeDiff)
          if (param_key) {
            txsParams[trx.id + pp] = {
              tx_id: trx.id,
              param_key,
              param_type,
              param_value_integer,
              param_value_boolean,
              param_value_binary,
              param_value_string,
              position_in_tx: pp
            }
          }
          if (result_key) {
            txsResults[trx.id + rr] = {
              tx_id: trx.id,
              result_key,
              result_type,
              result_value_integer,
              result_value_boolean,
              result_value_binary,
              result_value_string,
              position_in_tx: rr
            }
          }
          newTxs[trx.id] = trx
        })
        const arrayTx = Object.keys(newTxs).map(key => newTxs[key]);
        const arrayP = Object.keys(txsParams).map(key => txsParams[key]);
        const arrayR = Object.keys(txsResults).map(key => txsResults[key]);
        await target.query(knex('txs_104').insert(arrayTx).toString())
        await target.query(knex('txs_104_params').insert(arrayP).toString())
        await target.query(knex('txs_104_results').insert(arrayR).toString())
        console.log(`Table txs_104 iteration ${iteration} duplication ${i} done`)
      }
    } else {
      break;
    }
    iteration++;
    console.log(iteration)
  }
}

async function fill12(maxHeight, timeDiff) {
  const txs = await target.query(`
      SELECT t.*, d.*
        FROM txs_12 as t
        LEFT JOIN txs_12_data as d ON t.id = d.tx_id
    `);
  if (txs.length) {
    for (let i = 1; i <= TIMES_TO_DUPLICATE; i++) {
      const newTxs = {}
      const txsData = []
      txs.forEach(t => {
        const {
          tx_id,
          data_key,
          data_type,
          data_value_integer,
          data_value_boolean,
          data_value_binary,
          data_value_string,
          position_in_tx,
          ...tx
        } = t;
        const trx = getNewTx(tx, i, maxHeight, timeDiff)
        if (tx_id) {
          txsData.push({
            tx_id: trx.id,
            data_key,
            data_type,
            data_value_integer,
            data_value_boolean,
            data_value_binary,
            data_value_string,
            position_in_tx,
          })
        }
        newTxs[trx.index] = trx
      })
      const arrayTx = Object.keys(newTxs).map(key => newTxs[key]);
      await target.query(knex('txs_12').insert(arrayTx).toString())
      await target.query(knex('txs_12_data').insert(txsData).toString())
      console.log(`Table txs_12 iteration ${i} done`)
    }
  }
}

async function fill11(maxHeight, timeDiff) {
  const txs = await target.query(`
      SELECT t.*, d.*
        FROM txs_11 as t
        LEFT JOIN txs_11_transfers as d ON t.id = d.tx_id
    `);

  if (txs.length) {
    for (let i = 1; i <= TIMES_TO_DUPLICATE; i++) {
      const newTxs = {}
      const txsData = []
      txs.forEach(t => {
        const {
          tx_id,
          recipient,
          amount,
          position_in_tx,
          ...tx
        } = t;
        const trx = getNewTx(tx, i, maxHeight, timeDiff)
        if (tx_id) {
          txsData.push({
            tx_id: trx.id,
            recipient,
            amount,
            position_in_tx,
          })
        }
        newTxs[trx.index] = trx
      })
      const arrayTx = Object.keys(newTxs).map(key => newTxs[key]);
      await target.query(knex('txs_11').insert(arrayTx).toString())
      await target.query(knex('txs_11_transfers').insert(txsData).toString())
      console.log(`Table txs_11 iteration ${i} done`)
    }
  }
}