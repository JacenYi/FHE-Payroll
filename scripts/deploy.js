const hre = require("hardhat");

async function main() {

    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying with:", deployer.address);

    // =========================
    // Deploy SalaryToken
    // =========================

    const SalaryToken =
        await hre.ethers.getContractFactory("SalaryToken");

    const token =
        await SalaryToken.deploy();

    await token.waitForDeployment();

    const tokenAddress =
        await token.getAddress();

    console.log("SalaryToken:", tokenAddress);

    // =========================
    // Deploy FheSalarySystem
    // =========================

    const FheSalarySystem =
        await hre.ethers.getContractFactory(
            "FheSalarySystem"
        );

    const salarySystem =
        await FheSalarySystem.deploy(
            tokenAddress
        );

    await salarySystem.waitForDeployment();

    const systemAddress =
        await salarySystem.getAddress();

    console.log(
        "FheSalarySystem:",
        systemAddress
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});