const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
    console.log("");

    const deployedContracts = {};

    console.log("1. Deploying SalaryERC20...");
    const SalaryERC20 = await hre.ethers.getContractFactory("SalaryERC20");
    const salaryERC20 = await SalaryERC20.deploy();
    await salaryERC20.waitForDeployment();
    const salaryERC20Address = await salaryERC20.getAddress();
    deployedContracts.SalaryERC20 = salaryERC20Address;
    console.log("   SalaryERC20 deployed to:", salaryERC20Address);
    console.log("");

    console.log("2. Deploying SalaryToken (ERC7984)...");
    const SalaryToken = await hre.ethers.getContractFactory("SalaryToken");
    const salaryToken = await SalaryToken.deploy(
        deployer.address,           // owner_
        1000000 * 10 ** 6,                    // initialSupply_
        "CUSDO",   // name_
        "CUSDO",                      // symbol_
        ""                          // contractURI_
    );
    await salaryToken.waitForDeployment();
    const salaryTokenAddress = await salaryToken.getAddress();
    deployedContracts.SalaryToken = salaryTokenAddress;
    console.log("   SalaryToken deployed to:", salaryTokenAddress);
    console.log("");

    console.log("3. Deploying SwapERC7984ToERC20...");
    const SwapERC7984ToERC20 = await hre.ethers.getContractFactory("SwapERC7984ToERC20");
    const swapContract = await SwapERC7984ToERC20.deploy(salaryTokenAddress, salaryERC20Address);
    await swapContract.waitForDeployment();
    const swapContractAddress = await swapContract.getAddress();
    deployedContracts.SwapERC7984ToERC20 = swapContractAddress;
    console.log("   SwapERC7984ToERC20 deployed to:", swapContractAddress);
    console.log("");

    console.log("4. Deploying FheSalarySystem...");
    const FheSalarySystem = await hre.ethers.getContractFactory("FheSalarySystem");
    const salarySystem = await FheSalarySystem.deploy(salaryTokenAddress);
    await salarySystem.waitForDeployment();
    const salarySystemAddress = await salarySystem.getAddress();
    deployedContracts.FheSalarySystem = salarySystemAddress;
    console.log("   FheSalarySystem deployed to:", salarySystemAddress);
    console.log("");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
