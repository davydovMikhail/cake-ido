# Crepe inc / smart contracts

### Installing dependencies in the project

```shell
npm install
```

### Launching testing of the Vesting contract

```shell
npx hardhat test test/vesting.test.ts
```

### Launching testing of the IDO contract

```shell
npx hardhat test test/ido.test.ts
```

## Procedure for CrepeIDO.sol deployment to mumbai network

1. Create .env file and fill it in according to the example of the .env-example file

2. Fill in the following fields: PRIVATE_KEY, API_KEY, START_TIME_IDO, END_TIME_IDO, UNLOCK_TIME_IDO, CREPE_TOKEN_ADDR, USDC_TOKEN_ADDR, ROUTER_ADDR

3. Call the IDO deployment script:

```shell
npx hardhat run scripts/deployIDO.ts --network mumbai
```

## Procedure for CrepeVesting.sol deployment to mumbai network

1. Create .env file and fill it in according to the example of the .env-example file

2. Fill in the following fields: PRIVATE_KEY, API_KEY

3. Call the Vesting deployment script:

```shell
npx hardhat run scripts/deployVesting.ts --network mumbai
```

## Description of roles and their work in the CrepeIDO.sol contract, CrepeVesting.sol contract

DEFAULT_ADMIN_ROLE - the standard administrator role, the owner of this role can assign ADMIN_ROLE
ADMIN_ROLE - the role of the contract administrator who can assign CONTRACT_CONTROL_ROLE
CONTRACT_CONTROL_ROLE - the owner of this role can call the key functions of the contract
