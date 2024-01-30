import DB from "../db/db";
import Helpers from "../util/helpers";



export class Blockchain {

  public blockchainDB;
  public blockchainReader;

  constructor() {
    const options = {
      noMetaSync: true,
      noSync: true
    };

    this.blockchainDB = new DB('blockchain', options);
    this.blockchainReader = this.blockchainDB.initTxn();
  }

  public async getBlockByIndex(
    index,
    includeTx = false
  ) {
    const blockHash = this.getBlockHashByIndex(index);
    let block = null;

    if (blockHash) {
      block = await this.getBlockByHash(blockHash, includeTx);
    }

    return block;
  }

  public getBlockHashByIndex(index): Buffer {
    return this.blockchainDB.get(
      this.blockchainReader,
      Buffer.concat([
        Buffer.from('c/'),
        Helpers.writeVarInt(index)
      ])
    );
  }

  public async getBlockByHash(
    hash: Buffer,
    includeTxs = false,
    txsResultType: 'base64' | 'buffer' | 'array' = 'array'
  ) {
    const key = Buffer.concat([
      Buffer.from('b/'),
      hash,
      Buffer.from('b')
    ]);
    const data = this.blockchainDB.get(this.blockchainReader, key);

    if (!data) {
      return null;
    }

    const block = Helpers.JSONToObject(data.toString());

    if (includeTxs) {
      const txs: Buffer = this.getBlockTxs(hash);

      switch (txsResultType) {
        case 'array':
          block.data = await Helpers.decompressData(txs, txsResultType);
          break;
        case 'base64':
          block.data = txs.toString('base64');
          break;
        default:
          block.data = txs;
      }

      delete block.txCount;
    }

    return block;
  }

  public getBlockTxs(hash: Buffer): Buffer {
    const key = Buffer.concat([Buffer.from('btx/'), hash]);

    return this.blockchainDB.get(this.blockchainReader, key);
  }

  public getLastKey(prefix: Buffer): Buffer {
    const maxKeySize = this.blockchainDB.getMaxkeysize();

    if (prefix.length < maxKeySize) {
      return Buffer.concat([
        prefix,
        Buffer.alloc(maxKeySize - prefix.length, 0xff)
      ]);
    }

    return prefix;
  }

  public async getLastBlockIndex(): Promise<number | null> {

    const block = await this.getLastBlock();

    return block ? block.index : null;
  }

  public async getLastBlock(){

    let block = null;
    const prefix = Buffer.from("c/");
    const cursor = this.blockchainDB.initCursor(this.blockchainReader);    

    if (await cursor.goToRange(this.getLastKey(prefix))) {
      const data = await cursor.goToPrev();
      console.log(data);
      

      if (data) {
        const blockHash = await this.blockchainDB.get(this.blockchainReader, data);

        block = await this.getBlockByHash(blockHash);
      }
    }

    cursor.close();

    return block;
  }


}