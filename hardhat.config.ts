import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    hardhat: {
      forking: {
          // url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.API_KEY}`,
          // blockNumber: 27540591,
          url: 'https://polygon-rpc.com',
          blockNumber: 31720670
      },
      accounts: {
        count: 350,
        initialIndex: 0,
        path: "m/44'/60'/0'/0",
      },
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    polygon: {
      url: 'https://polygon-rpc.com',
      accounts: [`${process.env.PRIVATE_KEY}`],
    }
  },
  gasReporter: {
    enabled: true
  },
  mocha: {
    timeout: 100000000
  },
};

export default config;
