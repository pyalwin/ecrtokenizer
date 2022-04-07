## Service to index the transactions from a contract.

The service has two endpoints.

1. `/transactions/:accountID` - Indexes the transactions from the contract for the specified account and loads into database
2.  `/transactions/get/:fromAddress` - Fetches the transactions for specific originator address from the indexed database

The database is a dynamodb backend with the following structure.

`
Table Name: transaction
Partition Key : from_addr ( String )
Sort Key : to_addr ( String )
Global Index : 
     Partition Key: to_addr ( String )
     Sort Key: value ( Number )
`

Steps to run the service
`
Step 1: Create a .env file based on .env_sample and fill up necessary values
Step 2: Install packages 
        yarn install
Step 3: Start the service
        yarn start
`
Now the service would be accessible in default port 3000