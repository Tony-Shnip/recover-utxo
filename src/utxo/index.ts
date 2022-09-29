import DB from "../db/db";
import Helpers from "../util/helpers";



export class Utxo {

  public utxoDB;
  public utxoReader;

  constructor() {
    const options = {
      noMetaSync: true,
      noSync: true
    };

    this.utxoDB = new DB('utxo', options);
    this.utxoReader = this.utxoDB.initTxn();
  }

  getUtxoByAddress(address) {
    const utxo = [];
    const shortAddress = Helpers.toShortAddress(address);
    const unspentKey = Buffer.from(
      'un/' + shortAddress + '/'
    );

    const cursor = this.utxoDB.initCursor(this.utxoReader);

    for (
      let found = cursor.goToRange(unspentKey);
      found !== null;
      found = cursor.goToNext()
    ) {
      if (Buffer.compare(unspentKey, found.slice(0, unspentKey.length))) {
        break;
      }

      const output = this.utxoDB.get(this.utxoReader, found);

      if (!output) {
        continue;
      }

      const data = Helpers.JSONToObject(output.toString());

      const input = [
        found.toString(),
        data.txOutIndex,
        data.txOutId,
        data.amount,
        data.address,
        data.signature
      ];

      utxo.push(input);
    }

    cursor.close();

    return utxo;
  }

  saveUtxoData(data) {
    return new Promise((resolve, reject) => {
      this.utxoDB.batchWrite(
        data,
        {
          ignoreNotFound: true
        },
        (error) => {
          if (error) {
            return reject(error);
          }
  
          return resolve(true);
        }
      );
    });
  }

  checkUtxo(tx) {
    const unspentInputs = {}
    const utxoData = [];

    for (let i = 0; i < tx.txOuts.length; i++) {
      if (tx.txOuts[i].address !== tx.txIns[0].address) {
        const shortAddress = Helpers.toShortAddress(tx.txOuts[i].address);

        const key = 'un/' + shortAddress + '/' + tx.txIns[0].txOutId + '/1';

        const unspentKey = Buffer.from(key);

        const utxo = this.utxoDB.get(this.utxoReader, unspentKey);

        if (!utxo) {
          unspentInputs[key] = {
            txOutId: tx.txIns[0].txOutId,
            txOutIndex: i,
            amount: tx.txOuts[i].amount,
            address: tx.txOuts[i].address
          }
        }
      }
    }

    for (const item in unspentInputs) {
      const address = Helpers.toShortAddress(unspentInputs[item].address);
      const unspentKey = this.buildUnspentKey(
        address,
        unspentInputs[item]
      );
      const unspentData = Buffer.from(JSON.stringify(unspentInputs[item]));
  
      utxoData.push([
        this.utxoDB.DBI,
        unspentKey,
        unspentData
      ]);
    }

    this.saveUtxoData(utxoData);
  }

  buildUnspentKey(address, output): Buffer {
    const params = ['un/' + address];

    params.push(output.txOutId);
    params.push(output.txOutIndex);

    return Buffer.from(params.join('/'));
  }


}