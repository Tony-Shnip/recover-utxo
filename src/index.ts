import { Blockchain } from './blockchain';
import { Utxo } from './utxo';

const blockchain = new Blockchain();
const utxo = new Utxo();

// async function start(index) {
//   const block = await blockchain.getBlockByIndex(index, true)
  
//   const lastBlock = await blockchain.getLastBlock();

//   // for (let i = 0; i < block.data.length; i++) {
//   //   if (block.data[i].type === 'regular' && block.data[i].txOuts.length > 2) {
//   //     utxo.checkUtxo(block.data[i]);
//   //   }
//   // }
  

//   console.log(lastBlock);

//   console.log(block);
  

// }

async function start (index) {
  const block = await blockchain.getBlockByIndex(index, true)

  for (let i = 0; i < block.data.length; i++) {
    if (block.data[i].type === 'regular' && block.data[i].txOuts.length > 2) {
      utxo.checkUtxo1(block.data[i]);
    }
  }
}

start(8189696)


