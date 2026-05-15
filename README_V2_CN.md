# FHE 薪资系统 V2

基于 Zama fhEVM 构建的全同态加密薪资管理系统，采用 ERC7984 机密代币标准，并支持机密代币到明文代币的兑换机制。

## V2 新特性

| 特性 | V1 | V2 |
|------|----|----|
| 薪资代币 | 普通 ERC20 | ERC7984 机密代币 |
| 薪资数据 | 明文存储（简化版）/ 加密存储（FHE版） | 通过 fhEVM 实现链上全加密 |
| 提现方式 | 直接 ERC20 转账 | 机密代币 → ERC20 兑换（附解密证明） |
| 代币兑换 | 不支持 | SwapERC7984ToERC20 桥接合约 |
| FHE 合规性 | 部分 | 完全符合 fhEVM 规范，含完善的访问控制 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        管理员（雇主）                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ 充值 ERC7984  │  │ 发放加密薪资     │  │ 批量发放         │  │
│  │ 到系统       │  │                  │  │ 加密薪资         │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
└─────────┼───────────────────┼──────────────────────┼────────────┘
          │                   │                      │
          ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FheSalarySystem                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ 加密合约余额   │  │ 员工管理       │  │ 薪资记录（加密） │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│                          │                                      │
│                          │ confidentialTransferFrom              │
│                          ▼                                      │
│                  ┌───────────────┐                              │
│                  │  SalaryToken  │  (ERC7984)                   │
│                  │  CUSDO        │                              │
│                  └───────┬───────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │ 员工           │                │
          │ 查看余额       │                │
          │ （加密）       │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SwapERC7984ToERC20                            │
│  ┌─────────────────┐    ┌──────────────────┐                    │
│  │ 1. 发起兑换     │───▶│ 2. 解密并完成    │───▶ SalaryERC20   │
│  │ （机密金额）    │    │    兑换          │     (USDO ERC20)  │
│  └─────────────────┘    └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## 项目结构

```
├── contracts/
│   ├── FheSalarySystem.sol        # 核心薪资管理合约（FHE）
│   ├── SalaryToken.sol            # ERC7984 机密薪资代币（CUSDO）
│   ├── SalaryERC20.sol            # 普通 ERC20 代币（USDO），用于兑换输出
│   ├── SwapERC7984ToERC20.sol     # 机密代币到明文代币的兑换桥接合约
├── scripts/
│   ├── deployV2.js                # V2部署脚本
│   ├── deploy.js                  # V1基础部署脚本
├── test/
│   ├── CompleteSystem.test.js     # 完整系统集成测试
│   └── FheSalarySystem.test.js    # 薪资系统单元测试
├── hardhat.config.js              # Hardhat 配置
├── package.json                   # 项目依赖
└── README_CN.md                   # 本文档
```

## 智能合约

### FheSalarySystem

核心薪资管理合约，采用全同态加密保护所有薪资数据。

**核心功能：**
- 员工管理（添加、查询、角色权限控制）
- 加密薪资充值与发放
- 批量薪资发放
- 每位员工的加密余额追踪
- 薪资发放记录
- 合约暂停机制

**访问控制：**
| 角色 | 权限 |
|------|------|
| 管理员 | 添加员工、充值代币、发放薪资、暂停合约 |
| 员工 | 查看自己的加密余额、提现、查看自己的薪资记录 |
| 无角色 | 无任何权限 |

**核心函数：**
| 函数 | 权限 | 说明 |
|------|------|------|
| `addEmployee()` | 管理员 | 注册新员工 |
| `depositTokens()` | 管理员 | 向系统充值加密代币 |
| `depositTokensEncrypted()` | 管理员 | 使用客户端加密输入充值 |
| `sendEncryptedSalary()` | 管理员 | 向员工发放加密薪资 |
| `batchSendEncryptedSalary()` | 管理员 | 批量发放加密薪资 |
| `withdraw()` | 员工 | 申请提现加密余额 |
| `getEncryptedBalance()` | 员工 | 查看自己的加密薪资余额 |
| `getMySalaryRecords()` | 员工 | 查看自己的薪资历史 |
| `getAllSalaryRecords()` | 管理员 | 查看所有薪资记录 |
| `getAllEmployees()` | 管理员 | 查看所有员工详情 |
| `pauseContract()` | 管理员 | 暂停/恢复合约 |

### SalaryToken（ERC7984 - CUSDO）

基于 ERC7984 标准的机密代币，由 Zama fhEVM 驱动。

**核心功能：**
- 所有余额和转账在链上完全加密
- 支持明文铸造和机密铸造
- 支持明文销毁和机密销毁
- 6 位小数精度
- 采用 `Ownable2Step` 的所有者控制铸造

### SalaryERC20（USDO）

标准 ERC20 代币，作为兑换机制的明文输出。

- 标准 ERC20，6 位小数
- 所有者控制的铸造和销毁
- 作为机密薪资代币的"可提现"版本

### SwapERC7984ToERC20

桥接合约，通过两阶段流程将机密 ERC7984 代币转换为普通 ERC20 代币。

**兑换流程：**
1. **请求阶段** — 员工调用 `swapConfidentialToERC20()` 并传入加密金额。合约从用户转入机密代币，将金额设为可公开解密，并创建待处理兑换记录。
2. **完成阶段** — 阈值解密完成后，任何人可调用 `finalizeSwap()` 并提供解密证明。合约验证证明后，将等额的普通 ERC20 代币转给员工。

**安全保障：**
- 通过 `FHE.checkSignatures` 验证解密证明
- 使用唯一兑换 ID 追踪待处理兑换
- 仅兑换发起人可接收 ERC20 代币

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 7.0.0

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npm run compile
```

### 3. 运行测试

```bash
npm test
```

### 4. 本地部署

```bash
npx hardhat node
npx hardhat run scripts/deployComplete.js --network localhost
```

### 5. Sepolia 测试网部署

配置 `.env` 文件：

```
PRIVATE_KEY=你的私钥
```

然后部署：

```bash
npx hardhat run scripts/deployComplete.js --network sepolia
```

## 部署流程

推荐的部署顺序（详见 `DeploymentExample.sol`）：

1. 部署 `SalaryERC20`（普通 ERC20）
2. 部署 `SalaryToken`（ERC7984 机密代币）
3. 部署 `SwapERC7984ToERC20`（兑换桥接合约）
4. 部署 `FheSalarySystem`（薪资管理合约）
5. 在 `SalaryToken` 上为薪资系统设置操作员权限
6. 向兑换合约存入 ERC20 流动性
7. 开始使用系统

## 完整业务流程

```
管理员初始化：
  1. 部署所有合约
  2. 调用 salaryToken.setOperator(fheSalarySystem, MAX)
  3. 向 SwapERC7984ToERC20 存入 ERC20 流动性
  4. 向 FheSalarySystem 充值 ERC7984 代币

薪资发放：
  5. 管理员添加员工
  6. 管理员发放加密薪资（单个或批量）

员工提现：
  7. 员工调用 salaryToken.setOperator(swapContract, MAX)
  8. 员工调用 swapContract.swapConfidentialToERC20(encryptedAmount, proof)
  9. 等待解密阈值完成
  10. 调用 swapContract.finalizeSwap(swapId, clearAmount, decryptionProof)
  11. 员工收到普通 ERC20（USDO）代币
```

## 技术栈

| 组件 | 技术 |
|------|------|
| FHE 库 | Zama fhEVM (`@fhevm/solidity`) |
| 机密代币标准 | ERC7984 (`@openzeppelin/confidential-contracts`) |
| 标准代币 | ERC20 (`@openzeppelin/contracts`) |
| 开发框架 | Hardhat |
| FHE 测试 | `@fhevm/hardhat-plugin` + `@fhevm/mock-utils` |
| 加密 SDK | `@zama-fhe/relayer-sdk` |
| Solidity 版本 | 0.8.27 |

## 许可证

BSD-3-Clause-Clear
