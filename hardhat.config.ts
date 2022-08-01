import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    // hardhat: {
    //   forking: {
    //       url: 'https://polygon-rpc.com',
    //       // blockNumber: 31191710
    //   }
    // },
    mumbai: {
      // url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.API_KEY}`,
      url: `https://matic-mumbai.chainstacklabs.com`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      // gas: 21000000,
      // gasPrice: 60000000000
      gas: 2100000,
      gasPrice: 8000000000
    },
    rinkeby: {
      url: `https://rpc.ankr.com/eth_rinkeby`,
      accounts: [`${process.env.PRIVATE_KEY}`],
      gas: 2100000,
      gasPrice: 8000000000
    },
  }
};

export default config;
