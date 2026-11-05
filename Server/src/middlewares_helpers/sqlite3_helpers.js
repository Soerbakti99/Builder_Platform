const { AsyncLocalStorage } = require('node:async_hooks');
const { db } = require('../config/database');


const transactionContext = new AsyncLocalStorage();
let databaseQueue = Promise.resolve();

function enqueue(work) {

  if (transactionContext.getStore()?.inTransaction) return work();

  const result = databaseQueue.then(work, work);
  databaseQueue = result.then(() => undefined, () => undefined);
  return result;
}

const dbRun = (query, params = []) =>
  enqueue(() => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  }));

const dbGet = (query, params = []) =>
  enqueue(() => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }));

const dbAll = (query, params = []) =>
  enqueue(() => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }));

const withTransaction = (work) =>
  enqueue(() => transactionContext.run({ inTransaction: true }, async () => {
    await dbRun('BEGIN IMMEDIATE TRANSACTION');
    try {
      const result = await work();
      await dbRun('COMMIT');
      return result;
    } catch (error) {
      try {
        await dbRun('ROLLBACK');
      } catch (rollbackError) {
        console.error('[SQLite ROLLBACK]', rollbackError);
      }
      throw error;
    }
  }));

module.exports = { dbRun, dbGet, dbAll, withTransaction };
