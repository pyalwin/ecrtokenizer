var express = require('express');
const abi = require('./abi.json');
const Web3 = require('web3');

const REGION = "us-east-1"; //e.g. "us-east-1"

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { BatchWriteItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");

var router = express.Router();

const w3 = new Web3(process.env.HTTP_PROVIDER);

const ddbClient = new DynamoDBClient({ 
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

      const chunkSize = 25
      for (let i = 0; i < records.length; i+= chunkSize){
        const chunk = records.slice(i, i+chunkSize);
        const params = {
          RequestItems: {
            transaction:chunk 
          }
        }
        try{
          const data = await ddbClient.send(new BatchWriteItemCommand(params))
          console.log(data)
        }catch(err){
          console.log(err)
        }
      }
      resolve(records)
    }catch(err){
      console.log(err)
      reject(err)
    }    
  })
}

const getTransactions = (addr) => {
  return new Promise(async(resolve, reject) => {
    console.log(addr)
     try{
        const params = {
          ExpressionAttributeValues: {
            ':addr': {S: addr}
          },
          TableName: "transaction",
          KeyConditionExpression: 'from_addr = :addr',
          ProjectionExpression: 'from_addr,to_addr,#value',
          ExpressionAttributeNames: {"#value": "value"}
        }
        console.log(params)
        const data = await ddbClient.send(new QueryCommand(params))
        resolve(data)
     }catch(err){
        console.log(err)
        reject(err)
     }
  })
}

/* Index the transactions */
router.get('/:acc', async function(req, res, next) {
  let trans = await createTransactions(req.params.acc)
  console.log(trans)
  res.send(trans)
});

/* Fetch the transactions from index */
router.get('/get/:fromAddr', async function(req, res, next) {
  let records = await getTransactions(req.params.fromAddr)
  res.send(records)
})


module.exports = router;
