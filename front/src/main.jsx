/**
 * FHE Payroll 应用入口文件
 * 
 * 功能概述：
 * - React 应用的入口点
 * - 挂载所有 Provider（钱包、FHE）
 * - 渲染根组件 App
 * 
 * Provider 层次结构：
 * WalletProvider → FHEProvider (真实加密) → App
 */

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WalletProvider } from './store/walletStore'
import { FHEProvider } from './utils/relayerSdk'

/**
 * FHE 配置组件
 * FHEProvider 使用 window.ethereum 初始化
 */
function FHEWrapper({ children }) {
  return (
    <FHEProvider>
      {children}
    </FHEProvider>
  );
}

// 创建 React 根节点并挂载应用
createRoot(document.getElementById('root')).render(
  // WalletProvider：提供钱包连接和合约交互的全局状态
  <WalletProvider>
    {/* FHEProvider：提供真实的 FHE 加密解密功能 */}
    <FHEWrapper>
      {/* 根应用组件 */}
      <App />
    </FHEWrapper>
  </WalletProvider>
)
