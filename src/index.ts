import DB from './db/db';
import Helpers from './util/helpers';
import { Blockchain } from './blockchain';
import { Utxo } from './utxo';

const blockchain = new Blockchain();
const utxo = new Utxo();


async function start(index) {
  const block = await blockchain.getBlockByIndex(index, true)

  for (let i = 0; i < block.data.length; i++) {
    if (block.data[i].txOuts.length > 2) {
      utxo.checkUtxo(block.data[i]);
    }
  }

  return utxo.checkUtxo(block);
}

start(0)


