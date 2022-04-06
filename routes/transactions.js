var express = require('express');
const abi = require('./abi.json');
const Web3 = require('web3');

const AWS = require('aws-sdk')

const REGION = "us-east-1"; //e.g. "us-east-1"

AWS.config.update({ 
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS,
  region: REGION 
})

// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");

var router = express.Router();

const w3 = new Web3('https://cloudflare-eth.com');

// const ddbClient = new DynamoDBClient({ 
//   accessKeyId: '',
//   secretAccessKey: '',
//   region: REGION 
// });

const ddbClient = new AWS.DynamoDB({apiVersion: '2012-08-10'})

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

      // await ddbClient.send(new BatchWriteItemCommand(params));
      const chunkSize = 25
      for (let i = 0; i < records.length; i+= chunkSize){
        const chunk = records.slice(i, i+chunkSize);
        const params = {
          RequestItems: {
            transactions:chunk 
          }
        }
        ddbClient.batchWriteItem(params, (err, data) => {
          if (err !== null){
            reject(err)
          }
          console.log(`Processed ${params.RequestItems.transactions} records`)
          console.log(data)
        })
      }

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
