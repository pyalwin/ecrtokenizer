var express = require('express');
const abi = require('./abi.json');
const Web3 = require('web3');

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");

const REGION = "us-east-1"; //e.g. "us-east-1"

var router = express.Router();

const w3 = new Web3('https://cloudflare-eth.com');

const ddbClient = new DynamoDBClient({ 
  accessKeyId: 'AKIAR7DPNNDVTW6DPM6J',
  secretAccessKey: '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',
  region: REGION 
});

const createTransactions = (acc) => {
  return new Promise(async(resolve, reject) => {
    let contract = new w3.eth.Contract(abi, acc)
    try{
      const transactions = await contract.getPastEvents('Transfer')
      let records = []
      transactions.forEach((data) => {
        records.push({
          "PutRequest": {
            "Item": {
              "from_addr": { "S": data.returnValues.from },
              "to_addr": { "S": data.returnValues.to },
              "org_value": { "S": data.returnValues.value },
              "value": {"N": (data.returnValues.value / Math.pow(10, 18)).toString() }    
            }
          }
        })
      })

      console.log(records)

      const params = {
        RequestItems: {
          transactions:records 
        }
      }

      console.log(params)

      await ddbClient.send(new BatchWriteItemCommand(params));

      resolve(records.length)
    }catch(err){
      console.log(err)
      reject(err)
    }    
  })
}

/* GET transactions listing. */
router.get('/', async function(req, res, next) {
  let acc = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  let trans = await createTransactions(acc)
  console.log(trans)
  res.send(`Successfully processed ${trans} transactions`);
});




module.exports = router;
