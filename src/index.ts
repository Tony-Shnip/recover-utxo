import DB from './db/db';
import Helpers from './util/helpers';
import { Blockchain } from './blockchain';
import { Utxo } from './utxo';

const blockchain = new Blockchain();
const utxo = new Utxo();

// console.log(utxo.getUtxoByAddress('020983a291f7997c1d326cc6fb7b3567bb183f79f0d3b4eeb026df9f7b6cb3e49b'));

async function start(index) {
  const block = await blockchain.getBlockByIndex(index, true)

  for (let i = 0; i < block.data.length; i++) {
    if (block.data[i].type === 'regular' && block.data[i].txOuts.length > 2) {
      utxo.checkUtxo(block.data[i]);
    }
  }
}

start(process.argv[2])


