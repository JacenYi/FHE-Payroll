# FHE Payroll Dapp
---

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.2.5 |
| 构建工具 | Vite | 8.0.10 |
| 样式框架 | TailwindCSS | 3.4.19 |
| 区块链交互 | ethers.js | 6.16.0 |
| FHE加密 | @zama-fhe/react-sdk | 3.0.0 |
| 路由管理 | react-router-dom | 7.15.0 |
| 状态管理 | React Context | - |
| 数据缓存 | @tanstack/react-query | 5.100.9 |
| 图标库 | lucide-react | 1.14.0 |

---

## 📁 目录结构

```
src/
├── components/          # UI组件层
│   ├── ui/             # 基础UI组件库
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── select.jsx
│   │   └── separator.jsx
│   ├── EmployeeManagement.jsx
│   ├── Navbar.jsx
│   └── WalletSection.jsx
├── config/             # 配置文件
│   └── env.js
├── i18n/               # 国际化支持
│   ├── locale/
│   │   ├── en.js
│   │   └── zh.js
│   └── i18n.jsx
├── lib/                # 通用工具函数
│   └── utils.js
├── pages/              # 页面组件
│   ├── HomePage.jsx
│   ├── WalletPage.jsx
│   ├── EmployeeManagementPage.jsx
│   ├── PayrollPage.jsx
│   └── EmployeeViewPage.jsx
├── store/              # 状态管理
│   ├── walletContext.js
│   └── walletStore.jsx
├── utils/              # 核心工具类
│   ├── evmContract.js
│   └── relayerSdk.jsx
├── App.jsx             # 应用主组件
├── App.css             # 应用样式
├── index.css           # 全局样式
└── main.jsx            # 应用入口
```

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- MetaMask 浏览器插件

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env` 文件：

```env
# 合约配置
VITE_CONTRACT_ADDRESS=0xe7*************************0512
VITE_SALARY_TOKEN_ADDRESS=0x5F***************************80aa3

# Zama Relayer API Key（可选）
VITE_ZAMA_RELAYER_API_KEY=your_api_key_here

# 测试网配置（可选，使用默认值即可）
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_HOLESKY_RPC_URL=https://ethereum-holesky.publicnode.com
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

---

## 📱 页面功能说明

### 页面权限划分

| 页面路径 | 页面名称 | 管理员 | 员工 | 公共 |
|---------|---------|--------|------|------|
| `/` | 首页 | ✅ | ✅ | ✅ |
| `/wallet` | 钱包页面 | ✅ | ✅ | ✅ |
| `/employees` | 员工管理 | ✅ | ❌ | ❌ |
| `/payroll` | 薪资发放 | ✅ | ❌ | ❌ |
| `/view` | 工资查看 | ❌ | ✅ | ❌ |

### 首页 (`/`)

**文件**: `src/pages/HomePage.jsx`

**功能描述**:
- 应用介绍和功能展示
- 钱包连接入口
- 快速导航按钮（根据角色显示不同入口）
- 使用步骤说明

### 钱包页面 (`/wallet`)

**文件**: `src/pages/WalletPage.jsx`

**功能描述**:
- 显示钱包连接状态
- 显示钱包地址和余额
- 显示当前网络信息
- 连接/断开钱包操作

### 员工管理页面 (`/employees`)

**文件**: `src/pages/EmployeeManagementPage.jsx`

**功能描述**:
- 添加新员工表单
- 员工列表展示
- 员工详情查看

**表单字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| Wallet Address | 字符串 | 员工钱包地址 |
| First Name | 字符串 | 名 |
| Last Name | 字符串 | 姓 |
| Email | 字符串 | 邮箱地址 |
| Residential Address | 字符串 | 家庭住址 |

### 薪资发放页面 (`/payroll`)

**文件**: `src/pages/PayrollPage.jsx`

**功能描述**:
- 选择员工进行工资发放
- 输入工资金额
- 使用FHE加密工资
- 批量发放工资
- 显示发放进度

**核心流程**:
```
选择员工 → 输入工资 → FHE加密 → 发送到链上 → 记录发放
```

### 员工查看页面 (`/view`)

**文件**: `src/pages/EmployeeViewPage.jsx`

**功能描述**:
- 查看个人工资记录
- 解密查看加密工资
- 显示工资历史

---

## 🔄 核心业务流程

### 整体流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        管理员流程                               │
├─────────────────────────────────────────────────────────────────┤
│  连接钱包 → 添加员工 → 选择员工 → 输入工资 → FHE加密 → 发放工资  │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                        员工流程                               │
├───────────────────────────────────────────────────────────────┤
│              连接钱包 → 查看工资记录 → 解密查看工资            │
└───────────────────────────────────────────────────────────────┘
```

### 工资发放流程

```
1. 管理员访问 /payroll 页面
2. 选择要发放工资的员工
3. 为每位员工输入工资金额
4. 点击"加密并发放"按钮
5. 系统使用 FHE 加密工资金额
6. 调用合约 sendEncryptedSalary 方法
7. 交易确认后，工资记录存储到链上
8. 员工可在 /view 页面查看加密工资并解密
```

### FHE加密流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    FHE 加密流程                                 │
├─────────────────────────────────────────────────────────────────┤
│  获取公钥 → 加密工资金额(euint64) → 生成inputProof → 发送合约  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FHE 解密流程                                 │
├─────────────────────────────────────────────────────────────────┤
│           获取加密工资 → 使用私钥解密 → 显示明文工资             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 网络配置

### 支持的网络

| 网络名称 | 链ID | RPC URL | Relayer URL |
|---------|------|---------|-------------|
| Sepolia | 11155111 | https://sepolia.infura.io/v3/YOUR_INFURA_KEY| https://relayer.sepolia.zama.ai |

> **注意**：MetaMask新版本要求RPC URL必须使用HTTPS协议，本地开发时建议使用测试网。

### 网络切换

应用会自动检测当前网络，如果与目标网络不匹配，会提示用户切换网络。

---

## 📦 核心模块说明

### Provider 层级结构

```
WalletProvider (钱包状态)
  └── FHEProvider (FHE加密)
        └── App (路由配置)
```

### 钱包状态管理

**文件**: `src/store/walletStore.jsx`

钱包状态包含：
- `account`: 当前连接的钱包地址
- `isConnecting`: 是否正在连接
- `chainId`: 当前链ID
- `balance`: ETH余额
- `provider`: ethers Provider实例
- `signer`: ethers Signer实例
- `contract`: 合约实例

### 合约交互

**文件**: `src/utils/evmContract.js`

主要方法：
| 方法 | 功能 |
|------|------|
| `connectWallet()` | 连接MetaMask钱包 |
| `disconnectWallet()` | 断开钱包连接 |
| `call(methodName, ...args)` | 调用合约只读方法 |
| `send(methodName, ...args)` | 调用合约写入方法 |
| `addEmployee(data)` | 添加员工 |
| `sendEncryptedSalary()` | 发送加密工资 |
| `getAllEmployees()` | 获取员工列表 |

---

## ⚠️ 注意事项

1. **MetaMask安装**：使用前需安装MetaMask浏览器插件
2. **网络选择**：建议使用Sepolia测试网，本地网络需配置HTTPS
3. **测试代币**：测试网操作需要测试代币，可从水龙头获取
4. **FHE初始化**：首次使用需要生成密钥对，可能需要一些时间

---

---

**文档版本**: v1.0  
**生成日期**: 2026-05-09  
**项目名称**: FHE Payroll Demo
