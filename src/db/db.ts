import * as fs from 'fs';
import * as lmdb from 'lmdb-lib';
import * as path from 'path';
import * as dotenv from 'dotenv';

import Helpers from '../util/helpers';

dotenv.load();

class DB {
  public DB_ENV: lmdb.Env;
  public DBI: lmdb.Dbi;
  public data: string;
  public options: object;
  public root: string;

  public constructor(data, options = {}) {
    this.DB_ENV = new lmdb.Env();
    this.root = path.dirname(path.dirname(path.dirname(path.dirname(fs.realpathSync(__filename)))));
    this.data = data;
    this.options = options;
    this.connect();
  }

  public connect() {
    this.openEnv();
    this.openDbi();
  }

  public openEnv() {
    const defaultOpt = {
      path: '/home/dragon/node/' + this.data,
      mapSize: 0x8000000000,
      maxReaders: 126
    };

    Object.assign(defaultOpt, this.options);

    Helpers.createFolder(defaultOpt.path);

    this.DB_ENV.open(defaultOpt);
  }

  public openDbi() {
    this.DBI = this.DB_ENV.openDbi({
      name: null,
      create: true
    });
  }

  public initTxn(readOnly = true) {
    return this.DB_ENV.beginTxn({ readOnly });
  }

  public batchWrite(data, options, callback) {
    this.DB_ENV.batchWrite(data, options, callback);
  }

  public initCursor(txn, keyIsBuffer = true) {
    return new lmdb.Cursor(txn, this.DBI, { keyIsBuffer });
  }

  public get(txn: lmdb.Txn, key: Buffer) {
    return txn.getBinary(this.DBI, key);
  }

  public getString(txn: lmdb.Txn, key: string) {
    return txn.getString(this.DBI, key);
  }

  public put(txn: lmdb.Txn, key: Buffer, value: Buffer = Buffer.from('')) {
    txn.putBinary(this.DBI, key, value);
  }

  public putString(txn: lmdb.Txn, key: string, value: string) {
    txn.putString(this.DBI, key, value);
  }

  public getMaxkeysize() {
    return this.DB_ENV.getMaxkeysize();
  }

  public del(txn, key) {
    txn.del(this.DBI, key);
  }

  public sync() {
    return new Promise((resolve, reject) => {
      this.DB_ENV.sync((error) => {
        if (error) {
          return reject(error);
        }

        return resolve(true);
      });
    });
  }

  public drop(txn: lmdb.Txn) {
    this.DBI.drop({
      txn,
      justFreePages: true
    });
  }

  public close() {
    this.DBI.close();
    this.DB_ENV.close();
  }
}

export default DB;
