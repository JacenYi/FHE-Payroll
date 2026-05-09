require("@fhevm/hardhat-plugin");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",

  networks: {
    zamaSepolia: {
      url: "https://sepolia.infura.io/v3/[YOUR_INFURA_KEY]",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
