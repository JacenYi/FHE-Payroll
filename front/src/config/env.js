/**
 * 环境变量配置
 * 统一管理应用所需的环境变量
 */

// Vite 环境变量需要以 VITE_ 开头
export const ENV = {
  // 合约相关
  CONTRACT_ADDRESS: '0xc0*******************************2d88',
  SALARY_TOKEN_ADDRESS: import.meta.env.VITE_SALARY_TOKEN_ADDRESS || '0x5F*******************************0aa3',

  // Zama Relayer
  ZAMA_RELAYER_API_KEY: import.meta.env.VITE_ZAMA_RELAYER_API_KEY || '',

  // 当前激活的网络 
  ACTIVE_NETWORK: import.meta.env.VITE_ACTIVE_NETWORK || 'SEPOLIA',

  // Sepolia 网络
  SEPOLIA_RPC_URL: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  SEPOLIA_RELAYER_URL: import.meta.env.VITE_SEPOLIA_RELAYER_URL || 'https://relayer.sepolia.zama.ai',

  // Holesky 网络
  HOLESKY_RPC_URL: import.meta.env.VITE_HOLESKY_RPC_URL || 'https://ethereum-holesky.publicnode.com',
  HOLESKY_RELAYER_URL: import.meta.env.VITE_HOLESKY_RELAYER_URL || 'https://relayer.holesky.zama.ai',
};

export default ENV;
