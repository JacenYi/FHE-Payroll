/**
 * @file EVM 合约交互封装类
 * @description 封装 ethers.js 实现完整的 EVM 钱包连接和合约交互功能
 * @version 1.0
 * @author perry
 */

import { ethers } from 'ethers';
import { ENV } from '../config/env';
import FheSalarySystem from './FheSalarySystem.json';

/**
 * EVM 合约交互封装类
 * 
 * 功能概述：
 * - 提供完整的 EVM 钱包连接和合约交互功能
 * - 封装了 ethers.js 的常用操作
 * - 提供与模拟 contract.js 兼容的 API 接口
 * 
 * 主要功能模块：
 * 1. 钱包管理 - 连接/断开钱包、账户切换监听
 * 2. 合约交互 - 读取(call)和写入(send)操作
 * 3. 网络管理 - 网络切换、链信息获取
 * 4. 事件监听 - 合约事件订阅和历史查询
 * 5. 业务方法 - 员工管理、薪资发放、NFT相关操作
 */
class EVMContract {
  /**
   * 构造函数
   * 
   * @param {string} contractAddress - 合约地址（十六进制格式）
   * @param {Array} contractAbi - 合约 ABI 数组
   * @param {number} targetChainId - 目标链 ID（可选，用于自动网络切换）
   * 
   * @property {string} contractAddress - 合约地址
   * @property {Array} contractAbi - 合约 ABI
   * @property {number|null} targetChainId - 目标链ID
   * @property {ethers.BrowserProvider|null} provider - ethers Provider 实例
   * @property {ethers.Signer|null} signer - ethers Signer 实例
   * @property {ethers.Contract|null} contract - 合约实例
   * @property {string|null} account - 当前连接的钱包地址
   * @property {boolean} isConnecting - 是否正在连接钱包
   */
  constructor(contractAddress, contractAbi, targetChainId = null) {
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
    this.targetChainId = targetChainId;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
    this.isConnecting = false;
  }

  /**
   * 使用预设配置快速创建实例
   * 
   * @description 从环境变量读取合约地址，使用内置的 ABI 创建合约实例
   * 默认目标链为本地网络(chainId: 31337)
   * 
   * @returns {EVMContract} EVMContract 实例
   */
  static fromPreset() {
    // 从环境变量获取合约地址
    const address = ENV.CONTRACT_ADDRESS;
    const network = NETWORKS[ENV.ACTIVE_NETWORK] || NETWORKS.LOCAL;
    const abi = FheSalarySystem.abi;

    return new EVMContract(address, abi, network.chainId);
  }

  /**
   * 检查 MetaMask 是否安装
   * 
   * @returns {boolean} true=已安装, false=未安装
   */
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  }

  /**
   * 连接钱包
   * 
   * @description 连接 MetaMask 钱包，自动处理网络切换
   * 
   * 连接流程：
   * 1. 检查 MetaMask 安装状态
   * 2. 创建 ethers Provider 实例
   * 3. 请求账户访问权限（触发 MetaMask 弹窗）
   * 4. 验证返回的账户列表
   * 5. 如果指定了目标链，执行网络切换
   * 6. 创建合约实例
   * 7. 设置账户/网络切换监听器
   * 
   * @returns {Object} 连接结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} account - 钱包地址（成功时）
   * @returns {string|null} error - 错误信息（失败时）
   */
  async connectWallet() {
    try {
      // 设置连接状态标志，防止重复连接
      this.isConnecting = true;

      // 检查 MetaMask 是否安装
      // 必须在浏览器环境中运行，且 MetaMask 扩展已安装
      if (!this.isMetaMaskInstalled()) {
        return {
          success: false,
          account: null,
          error: 'Please install MetaMask!'
        };
      }

      // 创建 ethers BrowserProvider 实例
      // BrowserProvider 封装了与 MetaMask 的通信
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // 请求账户访问权限
      // 触发 MetaMask 弹窗，用户授权后返回账户列表
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 验证账户列表是否为空
      // 用户可能拒绝授权或钱包未解锁
      if (accounts.length === 0) {
        return {
          success: false,
          account: null,
          error: 'No accounts found. Please unlock MetaMask.'
        };
      }

      // 保存第一个账户地址（MetaMask 按优先级排序）
      this.account = accounts[0];

      // 如果指定了目标链ID，执行网络检查和切换
      // 确保合约交互在正确的链上进行
      if (this.targetChainId) {
        // 获取当前网络信息
        const network = await this.provider.getNetwork();
        const currentChainId = Number(network.chainId);

        // 比较当前链与目标链
        if (currentChainId !== this.targetChainId) {
          // 在预定义的网络配置中查找目标链配置
          const networkConfig = Object.values(NETWORKS).find(n => n.chainId === this.targetChainId);
          if (networkConfig) {
            // 切换到目标网络（如果网络不存在会自动添加）
            await this.switchNetworkWithoutReconnect(this.targetChainId, networkConfig);
          } else {
            // 目标链配置未找到，返回错误
            return {
              success: false,
              account: this.account,
              error: `Network configuration not found for chain ID ${this.targetChainId}`
            };
          }
        }
      }

      // 网络切换后重新创建 Provider
      // 确保 Provider 与当前激活的网络同步
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // 获取 Signer 实例
      // Signer 用于签名交易和消息，代表当前连接的账户
      this.signer = await this.provider.getSigner();

      // 创建合约实例
      // 将合约地址、ABI 和 Signer 绑定，形成可调用的合约对象
      this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.signer);

      // 设置事件监听器
      // 监听账户切换和网络切换事件，自动处理状态更新
      this._setupEventListeners();

      // 返回成功结果，包含连接的账户地址
      return {
        success: true,
        account: this.account,
        error: null
      };
    } catch (error) {
      // 捕获并记录所有异常
      console.error('Failed to connect wallet:', error);
      return {
        success: false,
        account: null,
        error: error.message || 'Failed to connect wallet'
      };
    } finally {
      // 无论成功与否，重置连接状态标志
      this.isConnecting = false;
    }
  }

  /**
   * 断开钱包连接
   * 
   * @description 重置所有状态，断开与钱包的连接
   */
  disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  /**
   * 获取当前网络信息
   * 
   * @returns {Object} 网络信息
   * @returns {boolean} success - 是否成功
   * @returns {Object|null} data - 网络数据 {chainId, name}
   * @returns {string|null} error - 错误信息
   */
  async getNetworkInfo() {
    try {
      // 检查钱包是否已连接
      if (!this.provider) {
        return { success: false, error: 'Wallet not connected', data: null };
      }

      // 获取网络信息
      const network = await this.provider.getNetwork();
      return {
        success: true,
        error: null,
        data: {
          chainId: Number(network.chainId),
          name: network.name
        }
      };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  /**
   * 调用合约只读方法
   * 
   * @description 调用不修改链上状态的方法，无需支付 Gas
   * 
   * @param {string} methodName - 合约方法名
   * @param {...any} args - 方法参数
   * 
   * @returns {Object} 调用结果
   * @returns {boolean} success - 是否成功
   * @returns {any|null} data - 返回数据
   * @returns {string|null} error - 错误信息
   */
  async call(methodName, ...args) {
    try {
      // 检查合约是否已初始化
      if (!this.contract) {
        return {
          success: false,
          data: null,
          error: 'Contract not initialized. Please connect wallet first.'
        };
      }

      // 调用合约方法
      const result = await this.contract[methodName](...args);
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      console.error(`Failed to call ${methodName}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || `Failed to call ${methodName}`
      };
    }
  }

  /**
   * 发送合约写入交易
   * 
   * @description 调用修改链上状态的方法，需要支付 Gas，需要用户确认
   * 
   * 交易流程：
   * 1. 验证合约和签名器是否已初始化
   * 2. 调用合约方法，触发 MetaMask 签名弹窗
   * 3. 交易提交到网络，返回交易哈希
   * 4. 等待交易被打包确认（1个区块确认）
   * 5. 返回交易回执，包含区块信息和状态
   * 
   * @param {string} methodName - 合约方法名
   * @param {...any} args - 方法参数
   * 
   * @returns {Object} 交易结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {Object|null} receipt - 交易回执（包含 status、blockNumber、gasUsed 等）
   * @returns {string|null} error - 错误信息
   */
  async send(methodName, ...args) {
    try {
      // 验证钱包连接状态
      // 必须同时有合约实例和签名器才能发送交易
      if (!this.contract || !this.signer) {
        return {
          success: false,
          txHash: null,
          receipt: null,
          error: 'Wallet not connected. Please connect wallet first.'
        };
      }

      // 调试：检查合约实例和方法是否存在
      console.log('[Contract] 调用方法:', methodName);
      console.log('[Contract] 合约实例:', this.contract);
      console.log('[Contract] 可用方法:', this.contract ? Object.keys(this.contract) : '合约未初始化');
      console.log('[Contract] 方法是否存在:', this.contract && typeof this.contract[methodName]);

      // 调用合约方法，发送交易
      // ethers.js 会自动估算 Gas 费用并触发 MetaMask 签名弹窗
      // 不设置 gasPrice，让钱包自动处理（支持 EIP-1559）
      const tx = await this.contract[methodName](...args);
      console.log(`Transaction sent: ${tx.hash}`);

      // 等待交易确认
      // wait(1) 表示等待1个区块确认，确保交易不可逆
      const receipt = await tx.wait();

      // 返回成功结果，包含交易哈希和完整回执
      return {
        success: true,
        txHash: tx.hash,
        receipt: receipt,
        error: null
      };
    } catch (error) {
      console.error(`Failed to send ${methodName}:`, error);
      
      // 解析常见错误码，提供更友好的错误提示
      let errorMessage = error.message;
      if (error.code === 'ACTION_REJECTED') {
        // 用户拒绝签名交易
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        // Gas 费用不足
        errorMessage = 'Insufficient funds for gas';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        // Gas 估算失败，可能是合约逻辑问题
        errorMessage = 'Transaction may fail or require more gas';
      }

      return {
        success: false,
        txHash: null,
        receipt: null,
        error: errorMessage
      };
    }
  }

  /**
   * 估算交易 Gas 费用
   * 
   * @param {string} methodName - 合约方法名
   * @param {...any} args - 方法参数
   * 
   * @returns {Object} Gas 估算结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} gas - Gas 估算值（字符串）
   * @returns {string|null} error - 错误信息
   */
  async estimateGas(methodName, ...args) {
    try {
      if (!this.contract) {
        return { success: false, gas: null, error: 'Contract not initialized' };
      }

      const gasEstimate = await this.contract[methodName].estimateGas(...args);
      return {
        success: true,
        gas: gasEstimate.toString(),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        gas: null,
        error: error.message
      };
    }
  }

  /**
   * 订阅合约事件
   * 
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 事件触发时的回调函数
   * 
   * @returns {Function|null} 取消订阅函数
   */
  onEvent(eventName, callback) {
    if (!this.contract) {
      console.error('Contract not initialized');
      return;
    }

    // 订阅事件
    this.contract.on(eventName, callback);

    // 返回取消订阅函数
    return () => {
      this.contract.off(eventName, callback);
    };
  }

  /**
   * 查询历史事件
   * 
   * @param {string} eventName - 事件名称
   * @param {number} [fromBlock=0] - 起始区块
   * @param {number|string} [toBlock='latest'] - 结束区块
   * 
   * @returns {Object} 事件查询结果
   * @returns {boolean} success - 是否成功
   * @returns {Array|null} events - 事件数组
   * @returns {string|null} error - 错误信息
   */
  async getPastEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      if (!this.contract) {
        return { success: false, events: null, error: 'Contract not initialized' };
      }

      // 创建事件过滤器
      const filter = this.contract.filters[eventName]();
      
      // 查询事件
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      return {
        success: true,
        events: events,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        events: null,
        error: error.message
      };
    }
  }

  /**
   * 获取钱包余额
   * 
   * @returns {Object} 余额查询结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} balance - ETH 余额（格式化后）
   * @returns {string|null} error - 错误信息
   */
  async getBalance() {
    try {
      if (!this.provider || !this.account) {
        return { success: false, balance: null, error: 'Wallet not connected' };
      }

      // 获取余额并格式化
      const balance = await this.provider.getBalance(this.account);
      return {
        success: true,
        balance: ethers.formatEther(balance),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        balance: null,
        error: error.message
      };
    }
  }

  /**
   * 切换网络（不重新连接）
   * 
   * @description 切换到目标网络，如果网络不存在则添加
   * 
   * @param {number} chainId - 目标链 ID
   * @param {Object} network - 网络配置对象
   * @param {string} network.name - 网络名称
   * @param {string} network.rpcUrl - RPC URL
   * @param {string} network.currencyName - 货币名称
   * @param {string} network.currencySymbol - 货币符号
   * @param {string} network.explorerUrl - 区块浏览器 URL
   * 
   * @throws {Error} 切换失败时抛出错误
   */
  async switchNetworkWithoutReconnect(chainId, network) {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      try {
        // 尝试切换到已存在的网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }]
        });
      } catch (switchError) {
        // 错误码 4902 表示网络未添加，需要添加新网络
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              nativeCurrency: {
                name: network.currencyName,
                symbol: network.currencySymbol,
                decimals: 18
              },
              blockExplorerUrls: [network.explorerUrl]
            }]
          });
        } else {
          throw switchError;
        }
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  /**
   * 设置事件监听器（内部方法）
   * 
   * @description 监听 MetaMask 的账户切换和网络切换事件
   * 当用户在 MetaMask 中切换账户或网络时，自动更新本地状态
   * 
   * 监听的事件：
   * - accountsChanged: 用户切换钱包账户时触发
   * - chainChanged: 用户切换区块链网络时触发
   */
  _setupEventListeners() {
    // 检查 MetaMask 是否可用
    if (!window.ethereum) return;

    // 先移除已存在的监听器，防止重复绑定导致多次触发
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');

    // 监听账户切换事件
    // 用户在 MetaMask 中切换账户时触发
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        // 用户锁定钱包或断开连接
        // 重置所有状态并刷新页面
        this.disconnectWallet();
        window.location.reload();
      } else {
        // 用户切换到新账户
        // 更新账户地址并刷新页面以重新加载数据
        this.account = accounts[0];
        window.location.reload();
      }
    });

    // 监听网络切换事件
    // 用户在 MetaMask 中切换网络时触发
    window.ethereum.on('chainChanged', () => {
      // isConnecting 标志用于区分是用户主动切换还是代码自动切换
      // 如果是代码自动切换（如连接时的网络切换），不刷新页面
      if (!this.isConnecting) {
        window.location.reload();
      }
    });
  }

  /**
   * 获取当前账户地址
   * 
   * @returns {string|null} 当前连接的钱包地址
   */
  getAccount() {
    return this.account;
  }

  /**
   * 检查是否已连接钱包
   * 
   * @returns {boolean} true=已连接, false=未连接
   */
  isConnected() {
    return this.contract !== null && this.account !== null;
  }

  // ==================== 业务便捷方法 ====================
  // 以下方法封装了具体的业务逻辑，提供更友好的 API

  /**
   * 获取合约所有者地址
   * 
   * @returns {string} 合约所有者地址
   */
  async getOwner() {
    try {
      return await this.call('admin');
    } catch (error) {
      console.error('Failed to get owner:', error);
      throw error;
    }
  }

  /**
   * 检查地址是否为管理员
   *
   * @description 使用合约的 getUserRole 方法判断用户角色
   * 角色枚举: 0 = None（不属于企业）, 1 = Employee, 2 = Admin
   *
   * @param {string} address - 待检查的地址
   * @returns {boolean} true=是管理员, false=不是管理员（包含员工和未注册用户）
   */
  async isOwner(address) {
    try {
      const role = await this.getUserRole(address);

      // role 为 2 表示管理员
      if (role === 2) {
        return true;
      }

      // role 为 0 或 1 都返回 false（不是管理员）
      return false;
    } catch (error) {
      console.error('Failed to check owner:', error);
      try {
        const owner = await this.call('admin');
        return address?.toLowerCase() === owner.toLowerCase();
      } catch (adminError) {
        console.error('Failed to get admin address:', adminError);
        return false;
      }
    }
  }

  /**
   * 获取用户角色状态
   *
   * @description 调用合约的 getUserRole 方法获取用户角色状态
   * 角色枚举: 0 = None（不属于企业）, 1 = Employee, 2 = Admin
   *
   * @param {string} address - 用户钱包地址
   * @returns {Object} 角色状态对象
   * @returns {number} role - 用户角色 (0=None, 1=Employee, 2=Admin)
   * @returns {string} roleName - 角色名称 (none/employee/admin)
   * @returns {boolean} hasAccess - 是否有操作权限
   */
  async getUserRoleStatus(address) {
    try {
      const role = await this.getUserRole(address);

      if (role === null) {
        return {
          role: null,
          roleName: 'unknown',
          hasAccess: false
        };
      }

      // 角色枚举: 0=None, 1=Employee, 2=Admin
      if (role === 2) {
        return {
          role: 2,
          roleName: 'admin',
          hasAccess: true
        };
      } else if (role === 1) {
        return {
          role: 1,
          roleName: 'employee',
          hasAccess: true
        };
      } else {
        // role === 0，不属于企业
        return {
          role: 0,
          roleName: 'none',
          hasAccess: false
        };
      }
    } catch (error) {
      console.error('Failed to get user role status:', error);
      return {
        role: null,
        roleName: 'unknown',
        hasAccess: false
      };
    }
  }

  /**
   * 获取用户角色
   *
   * @description 调用合约的 getUserRole 方法获取用户角色
   * 角色枚举: 0 = None, 1 = Employee, 2 = Admin
   *
   * @param {string} address - 用户钱包地址
   * @returns {number} 用户角色 (0=None, 1=Employee, 2=Admin)
   */
  async getUserRole(address) {
    try {
      const result = await this.call('getUserRole', address);

      if (!result.success) {
        console.warn('Failed to get user role from contract:', result.error);
        return null;
      }

      // 将 BigInt 转换为普通数字
      // 角色枚举: 0=None, 1=Employee, 2=Admin
      return Number(result.data);
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  /**
   * 添加员工
   * 
   * @description 管理员调用此方法添加新员工到合约
   * 员工信息存储在链上，包括钱包地址、姓名、邮箱和住址
   * 添加成功后触发 EmployeeAdded 事件
   * 
   * @param {Object} employeeData - 员工数据对象
   * @param {string} employeeData.address - 员工钱包地址（必须是有效的以太坊地址）
   * @param {string} employeeData.firstName - 员工名
   * @param {string} employeeData.lastName - 员工姓
   * @param {string} employeeData.email - 员工邮箱
   * @param {string} employeeData.residentialAddress - 员工家庭住址
   * 
   * @returns {Object} 添加结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async addEmployee(employeeData) {
    try {
      // 解构员工数据
      const { address, firstName, lastName, residentialAddress, email } = employeeData;
      
      // 拼接全名（名 + 姓）
      const fullName = `${firstName} ${lastName}`.trim();
      
      // 调用合约添加员工方法
      const result = await this.send('addEmployee', address, fullName, email, residentialAddress);
      return result;
    } catch (error) {
      console.error('Failed to add employee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有员工
   * 
   * @returns {Array} 员工信息数组
   */
  async getAllEmployees() {
    try {
      const result = await this.call('getAllEmployees');
      
      // 检查返回结果是否为空（合约可能未正确初始化）
      if (!result.success) {
        console.warn('getAllEmployees failed, contract may not be properly initialized:', result.error);
        // 返回空数组，允许系统继续运行
        return [];
      }
      
      // 检查返回数据是否为空（可能没有员工或合约未初始化）
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        console.warn('getAllEmployees returned empty data, either no employees exist or contract admin is not set');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Failed to get all employees:', error);
      return [];
    }
  }

  /**
   * 获取员工数量
   * 
   * @returns {number} 员工数量
   */
  async getEmployeeCount() {
    try {
      const result = await this.call('getEmployeeCount');
      return result.success ? result.data : 0;
    } catch (error) {
      console.error('Failed to get employee count:', error);
      return 0;
    }
  }

  /**
   * 获取员工详细信息
   * 
   * @param {string} address - 员工钱包地址
   * @returns {Object|null} 员工信息对象
   */
  async getEmployeeDetails(address) {
    try {
      const result = await this.call('employees', address);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get employee details:', error);
      return null;
    }
  }

  /**
   * 发送加密工资
   * 
   * @description 使用 FHE（全同态加密）技术发送加密工资给员工
   * 工资在链上以加密形式存储，只有员工本人可以解密查看
   * 
   * 业务流程：
   * 1. 管理员调用此方法发放加密工资
   * 2. 加密金额使用 Zama FHE SDK 生成
   * 3. inputProof 用于验证加密数据的有效性
   * 4. 交易成功后触发 SalarySent 事件
   * 
   * @param {string} employeeAddress - 员工钱包地址
   * @param {Object} encryptedAmount - 加密的工资金额（externalEuint64 格式）
   * @param {string} inputProof - 输入证明，由 FHE SDK 生成
   * 
   * @returns {Object} 发送结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async sendEncryptedSalary(employeeAddress, encryptedAmount, inputProof) {
    try {
      // 调用底层 send 方法发送交易
      // sendEncryptedSalary 是合约的写入方法，需要管理员权限
      const result = await this.send('sendEncryptedSalary', employeeAddress, encryptedAmount, inputProof);
      return result;
    } catch (error) {
      console.error('Failed to send encrypted salary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量发送加密工资
   * 
   * @description 批量为多个员工发放加密工资，提高效率，减少 Gas 费用
   * 三个数组参数的长度必须一致，对应关系：employees[i] -> encryptedAmounts[i] -> inputProofs[i]
   * 
   * @param {string[]} employees - 员工钱包地址数组
   * @param {Object[]} encryptedAmounts - 加密工资金额数组（每个元素为 externalEuint64 格式）
   * @param {string[]} inputProofs - 输入证明数组，与工资金额一一对应
   * 
   * @returns {Object} 发送结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async batchSendEncryptedSalary(employees, encryptedAmounts, inputProofs) {
    try {
      // 验证数组长度一致性
      if (employees.length !== encryptedAmounts.length || employees.length !== inputProofs.length) {
        return { success: false, error: 'Array lengths do not match' };
      }
      
      // 调用批量发送方法
      const result = await this.send('batchSendEncryptedSalary', employees, encryptedAmounts, inputProofs);
      return result;
    } catch (error) {
      console.error('Failed to batch send encrypted salary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取加密工资余额（使用合约最新的 getEncryptedBalance 方法）
   * 
   * @returns {string|null} 加密的工资余额
   */
  async getEncryptedSalary() {
    try {
      const result = await this.call('getEncryptedBalance');
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get encrypted salary:', error);
      return null;
    }
  }

  /**
   * 获取当前用户的工资记录
   * 
   * @returns {Array} 工资记录数组
   */
  async getMySalaryRecords() {
    try {
      const result = await this.call('getMySalaryRecords');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Failed to get my salary records:', error);
      return [];
    }
  }

  /**
   * 获取所有工资记录
   * 
   * @returns {Array} 所有工资记录数组
   */
  async getAllSalaryRecords() {
    try {
      const result = await this.call('getAllSalaryRecords');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Failed to get all salary records:', error);
      return [];
    }
  }

  /**
   * 提取工资（调用 FheSalarySystem 的 withdraw 方法）
   * 需要传入加密金额和输入证明
   * 
   * @param {string} encryptedAmount - 加密的提取金额（externalEuint64）
   * @param {string} inputProof - 输入证明
   * 
   * @returns {Object} 提取结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async withdrawSalary(encryptedAmount, inputProof) {
    try {
      const result = await this.send('withdraw', encryptedAmount, inputProof);
      return result;
    } catch (error) {
      console.error('Failed to withdraw salary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 存入代币
   * 
   * @param {number} amount - 存入金额
   * 
   * @returns {Object} 存入结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async depositTokens(amount) {
    try {
      const result = await this.send('depositTokens', amount);
      return result;
    } catch (error) {
      console.error('Failed to deposit tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取合约余额
   * 
   * @returns {number} 合约代币余额
   */
  async getContractBalance() {
    try {
      const result = await this.call('getContractBalance');
      return result.success ? result.data : 0;
    } catch (error) {
      console.error('Failed to get contract balance:', error);
      return 0;
    }
  }

  /**
   * 检查 NFT 所有权
   * 
   * @param {string} account - 用户地址
   * 
   * @returns {Object|null} NFT 所有权信息
   * @returns {boolean} owned - 是否拥有 NFT
   * @returns {string} status - 状态 ('owned' | 'not_owned')
   * @returns {string} message - 状态描述
   */
  async checkNftOwnership(account) {
    try {
      // 使用 employees 映射获取员工信息
      const result = await this.call('employees', account);
      if (result.success && result.data) {
        return {
          owned: result.data.hasNft || false,
          tokenId: null, // ABI 中未包含 tokenId
          autoMinted: false,
          status: result.data.hasNft ? 'owned' : 'not_owned',
          message: result.data.hasNft ? 'NFT owned' : 'NFT not owned'
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to check NFT ownership:', error);
      return null;
    }
  }

  /**
   * 暂停/恢复合约
   * 
   * @param {boolean} status - true=暂停, false=恢复
   * 
   * @returns {Object} 操作结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {string|null} error - 错误信息
   */
  async pauseContract(status) {
    try {
      const result = await this.send('pauseContract', status);
      return result;
    } catch (error) {
      console.error('Failed to pause contract:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取合约暂停状态
   * 
   * @returns {boolean} true=暂停, false=正常
   */
  async getContractPaused() {
    try {
      const result = await this.call('contractPaused');
      return result.success ? result.data : false;
    } catch (error) {
      console.error('Failed to check contract status:', error);
      return false;
    }
  }

  /**
   * 获取管理员地址
   * 
   * @returns {string|null} 管理员地址
   */
  async getAdmin() {
    try {
      const result = await this.call('admin');
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get admin:', error);
      return null;
    }
  }
}

/**
 * 网络配置常量
 * 
 * @description 支持的区块链网络配置
 * 包含链ID、RPC URL、货币信息等
 */
export const NETWORKS = {
  /**
   * 本地开发网络
   * @description Hardhat 或 Ganache 本地节点
   */
  LOCAL: {
    chainId: 31337,
    name: 'Local Network',
    rpcUrl: 'http://192.168.12.51:8545',
    currencyName: 'Ether',
    currencySymbol: 'ETH',
    explorerUrl: ''
  },

  /**
   * Sepolia 测试网
   * @description Ethereum 官方测试网
   */
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    currencyName: 'Sepolia Ether',
    currencySymbol: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io'
  },

  /**
   * Holesky 测试网
   * @description Ethereum 新测试网（Sepolia 替代品）
   */
  HOLESKY: {
    chainId: 17000,
    name: 'Holesky Testnet',
    rpcUrl: 'https://ethereum-holesky.publicnode.com',
    currencyName: 'Holesky Ether',
    currencySymbol: 'ETH',
    explorerUrl: 'https://holesky.etherscan.io'
  },

  /**
   * Polygon Amoy 测试网
   * @description Polygon 网络测试网
   */
  AMOY: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    currencyName: 'MATIC',
    currencySymbol: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com'
  },

  /**
   * BSC 测试网
   * @description Binance Smart Chain 测试网
   */
  BSC_TESTNET: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    currencyName: 'BNB',
    currencySymbol: 'tBNB',
    explorerUrl: 'https://testnet.bscscan.com'
  },

  /**
   * Arbitrum Sepolia 测试网
   * @description Arbitrum L2 网络测试网
   */
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    currencyName: 'Ether',
    currencySymbol: 'ETH',
    explorerUrl: 'https://sepolia.arbiscan.io'
  },

  /**
   * Base Sepolia 测试网
   * @description Base L2 网络测试网
   */
  BASE_SEPOLIA: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    currencyName: 'Ether',
    currencySymbol: 'ETH',
    explorerUrl: 'https://sepolia.basescan.org'
  }
};

/**
 * @exports EVMContract
 * @description 默认导出 EVMContract 类
 */
export default EVMContract;