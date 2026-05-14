# FHE 薪资系统

Confidential Payroll Infrastructure 是一个面向 Web3 组织的隐私薪资与金融身份系统，基于 Zama 的 Fully Homomorphic Encryption（FHE，全同态加密）构建。
该系统允许企业在链上完成薪资发放，同时默认保护薪资数据隐私。工资金额、企业薪资结构以及员工收入等敏感信息将以加密形式存储，只有获得授权的用户才能进行解密查看。
我们的目标，是构建链上经济中的隐私雇佣与金融身份基础设施。

## 📁 项目结构

```
├── contracts/
│   ├── FheSalarySystem.sol       # FHE 薪资系统主合约
│   └── SalaryToken.sol           # ERC20 薪资代币
├── scripts/
│   └── deploy.js                # 部署脚本
├── front/                       # 前端Dapp
├── hardhat.config.js            # Hardhat 配置
├── .env                         # 环境变量
├── package.json                 # 项目依赖
└── README.md                    # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

## 🔧 配置说明

### 环境变量配置

在 `.env` 文件中配置你的私钥：

```env
PRIVATE_KEY=your_private_key_here
```

### Hardhat 配置

在 `hardhat.config.js` 中配置网络：

```javascript
require("@fhevm/hardhat-plugin");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    zamaSepolia: {
      url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY", // 替换为你的 Infura 或 Alchemy 节点 URL
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
```

**配置说明：**
- `url`: RPC 节点 URL，可以使用 Infura、Alchemy 等服务
- `accounts`: 部署者的私钥（从 .env 文件读取）
- `chainId`: Sepolia 测试网的链 ID 为 11155111

## 🌐 Sepolia 部署

### 1. 准备测试 ETH

在部署前，确保你的钱包有足够的 Sepolia 测试 ETH，可以从以下水龙头获取：
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### 2. 更新 hardhat.config.js

确保配置了正确的 RPC URL 和私钥：

```javascript
zamaSepolia: {
  url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 11155111,
}
```

### 3. 执行部署

```bash
npx hardhat run scripts/deploy.js --network zamaSepolia
```

### 4. 部署输出示例

```
Deploying with: 0x123456...
SalaryToken: 0x...
FheSalarySystem: 0x...
```
### 5. sepolia测试合约地址
FheSalarySystem: 0xc019cEB21628EFaa14A20a50D5EE2cE727F52d88 
SalaryToken:0x17B865ef552d869BF802c333F75a987d8c2bD332
```
## 📝 合约功能

### 1. 员工管理
- 添加员工（仅管理员）
- 员工信息存储（姓名、邮箱、地址）
- 员工列表查询

### 2. 薪资发放
- 单个员工加密薪资发放
- 批量员工加密薪资发放
- 薪资同态加密累加
- 薪资发放记录

### 3. 员工功能
- 查看自己加密薪资
- 提现薪资
- 查询自己的发放记录

### 4. 管理员功能
- 合约暂停/恢复
- 代币充值
- 查看所有发放记录
- 查询所有员工列表

## 🔐 FHE 特性

- 使用 Zama FHE 加密薪资数据
- 薪资全程加密存储
- 同态加密运算
- 仅授权用户可解密

## 📚 合约说明

### SalaryToken
- 基于 OpenZeppelin ERC20 标准
- 代币符号：USDO
- 精度：6 位小数
- 初始供应量：1,000,000 USDO
- 支持铸造和销毁

### FheSalarySystem
- 基于 Zama fhEVM 实现
- 使用 euint64 加密薪资数据
- 明密文分离设计
- 完整的权限控制

## 🎯 后续步骤

1. 部署成功后，将合约地址更新到前端配置
2. 使用管理员账户充值代币到薪资合约
3. 添加员工并开始发放薪资

## 🔗 参考链接

- [Zama fhEVM 文档](https://docs.zama.ai/fhevm)
- [Hardhat 文档](https://hardhat.org/docs)
- [Sepolia 测试网](https://sepolia.etherscan.io)
