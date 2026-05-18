/**
 * FHE Payroll 应用主组件
 * 
 * 功能概述：
 * - 应用的根组件，管理全局状态和路由
 * - 使用 WalletContext 管理钱包连接和合约交互
 * - 根据钱包地址判断用户角色（管理员/员工）
 * - 配置应用路由
 * 
 * 主要功能：
 * - 角色管理：判断并设置当前用户的角色
 * - 路由配置：配置所有页面路由
 * - 全局布局：提供导航栏和背景装饰
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nProvider, useTranslation } from './i18n/i18n';
import { useWallet } from './store/walletContext';
import Navbar from './components/Navbar';
import { AlertCircle } from 'lucide-react';
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import PayrollPage from './pages/PayrollPage';
import EmployeeViewPage from './pages/EmployeeViewPage';
import { FHEProvider } from './utils/relayerSdk';

/**
 * 路由内容组件
 * 处理路由变化时重置滚动位置
 */
function AppContent() {
  const location = useLocation();
  const { t } = useTranslation();
  
  // 从 WalletContext 获取钱包相关状态和方法
  const {
    account,           // 当前连接的钱包地址
    isConnecting,     // 是否正在连接钱包
    connect,          // 连接钱包的方法
    disconnect,       // 断开钱包的方法
    contract          // 合约交互实例
  } = useWallet();

  // 角色状态：admin（管理员）或 employee（员工）或 none（不属于企业）
  // 初始设为 none（未知），连接钱包后通过 getUserRoleStatus 获取实际角色
  const [role, setRole] = useState('none');

  // 员工列表状态 - 待实现从合约获取
  const [employees, setEmployees] = useState([]);

  /**
   * 路由变化时重置滚动位置到顶部
   */
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);

  /**
   * 员工添加后的回调函数
   * @param {string} newEmployeeAddress - 新添加的员工地址
   */
  const handleEmployeeAdded = (newEmployeeAddress) => {
    setEmployees(prev => [...prev, newEmployeeAddress]);
  };

  /**
   * 从合约加载数据
   * 先判断角色，再决定是否加载员工列表
   */
  const loadDataFromContract = useCallback(async () => {
    if (account && contract) {
      try {
        // 第一时间获取用户角色
        const roleStatus = await contract.getUserRoleStatus(account);
        console.log('=== App.jsx 角色状态 ===');
        console.log('当前账户:', account);
        console.log('角色状态:', roleStatus);
        console.log('roleName:', roleStatus.roleName);
        console.log('========================');
        
        // 更新角色状态
        setRole(roleStatus.roleName);

        // 只在用户是管理员时调用 getAllEmployees
        if (roleStatus.roleName === 'admin') {
          const employeeList = await contract.getAllEmployees();
          setEmployees(employeeList);
        } else {
          // 非管理员，清空员工列表
          setEmployees([]);
        }
      } catch (error) {
        console.error('Failed to load data from contract:', error);
      }
    }
  }, [account, contract]);


  // 监听钱包地址变化，重新加载数据
  useEffect(() => {
    loadDataFromContract();
  }, [account, loadDataFromContract]);

  return (
    <div className="min-h-screen bg-background">
      {/* 背景装饰：渐变模糊圆形 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-highlight/10 rounded-full blur-3xl" />
      </div>

      {/* 导航栏组件 */}
      <Navbar
        account={account}
        onConnect={connect}
        onDisconnect={disconnect}
        isConnecting={isConnecting}
        role={role}
      />

      {/* 页面内容区域 */}
      <div className="relative z-10">
        <Routes>
          {/* 首页路由 */}
          <Route
            path="/"
            element={
              <HomePage
                account={account}
                onConnect={connect}
                isConnecting={isConnecting}
                role={role}
              />
            }
          />
          {/* 钱包页面路由 */}
          <Route
            path="/wallet"
            element={
              <WalletPage />
            }
          />
          {/* 员工管理页面路由 - 仅管理员可见 */}
          <Route
            path="/employees"
            element={
              <EmployeeManagementPage
                account={account}
                employees={employees}
                onEmployeeAdded={handleEmployeeAdded}
              />
            }
          />
          {/* 薪资发放页面路由 - 仅管理员可见 */}
          <Route
            path="/payroll"
            element={
              <PayrollPage
                account={account}
                employees={employees}
                onPaymentComplete={(employeeAddress, encryptedAmount) => {
                  console.log('Payment completed:', employeeAddress, encryptedAmount);
                }}
              />
            }
          />
          {/* 员工查看页面路由 - 仅员工可见 */}
          <Route
            path="/view"
            element={
              role === 'employee' || role === 'admin' ? (
                <EmployeeViewPage
                  account={account}
                  role={role}
                />
              ) : (
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-400 mb-2">{t('common.noAccess')}</h2>
                    <p className="text-text-muted mb-6">{t('common.notEmployee')}</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-6 py-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                    >
                      {t('common.goHome')}
                    </button>
                  </div>
                </div>
              )
            }
          />
          {/* 未匹配路由重定向到首页 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    // 国际化 Provider，提供多语言支持
    <I18nProvider>
      {/* FHE Provider，提供加密解密功能 */}
      <FHEProvider>
        {/* 路由管理 */}
        <Router>
          <AppContent />
        </Router>
      </FHEProvider>
    </I18nProvider>
  );
}

export default App;
