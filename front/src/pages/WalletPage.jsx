import { Wallet, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import { useWallet } from '../store/walletContext';
import { useState, useEffect } from 'react';

export default function WalletPage() {
  const { t } = useTranslation();
  const {
    account,
    isConnecting,
    chainId,
    balance,
    error,
    isConnected,
    connect,
    disconnect,
    NETWORKS,
    contract
  } = useWallet();

  const [role, setRole] = useState('none');

  // 格式化链 ID 显示
  const getNetworkName = (id) => {
    const network = Object.values(NETWORKS).find(n => n.chainId === id);
    return network ? network.name : `Chain ID: ${id}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (account && contract) {
        const roleStatus = await contract.getUserRoleStatus(account);
        console.log('=== 角色状态调试 ===');
        console.log('当前账户:', account);
        console.log('角色状态:', roleStatus);
        console.log('role:', roleStatus.role);
        console.log('roleName:', roleStatus.roleName);
        console.log('hasAccess:', roleStatus.hasAccess);
        console.log('====================');
        setRole(roleStatus.roleName);
      }
    };
    loadData();
  }, [account, contract]);

  const renderRoleActions = () => {
    if (role === 'admin') {
      return (
        <>
          <Link
            to="/employees"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all"
          >
            <span>{t('wallet.manageEmployees')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/payroll"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent/20 text-accent hover:bg-accent/30 transition-all"
          >
            <span>处理薪资</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      );
    } else if (role === 'employee') {
      return (
        <Link
          to="/view"
          className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-card border border-border text-text-primary hover:border-primary/50 transition-all"
        >
          <span>{t('wallet.viewMySalary')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    } else {
      return (
        <div className="col-span-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-center text-red-400">
            {t('wallet.notRegistered') || '您不属于该企业，无操作权限'}
          </p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 animate-float">
            <Wallet className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t('wallet.title')}</h1>
          <p className="text-text-muted max-w-md mx-auto">
            {t('wallet.description')}
          </p>
        </div>

        <div className="border-glow rounded-2xl p-8 bg-surface/50 backdrop-blur-sm">
          {!isConnected ? (
            <div className="space-y-6">
              <button
                onClick={connect}
                disabled={isConnecting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-lg transition-all glow-purple disabled:opacity-50"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('wallet.connecting')}
                  </span>
                ) : (
                  t('wallet.connectBtn')
                )}
              </button>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-card/50 border border-dashed border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-highlight flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-text-muted">
                    <p className="font-medium text-text-primary mb-1">{t('wallet.demoTitle')}</p>
                    <p>{t('wallet.demoDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-success">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">{t('wallet.connected')}</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-sm text-text-muted mb-2">{t('wallet.yourAddress')}</p>
                <p className="font-mono text-xl text-accent">
                  {account ? `${account.slice(0, 10)}...${account.slice(-6)}` : ''}
                </p>
              </div>

              {chainId && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-text-muted mb-2">{t('common.network')}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary">{getNetworkName(chainId)}</p>
                  </div>
                </div>
              )}

              {balance && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm text-text-muted mb-2">{t('common.ethBalance')}</p>
                  <p className="font-mono text-xl text-accent">{parseFloat(balance).toFixed(4)} ETH</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {renderRoleActions()}
              </div>

              <button
                onClick={disconnect}
                className="w-full py-3 px-4 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:border-red-500/50 transition-all"
              >
                {t('common.disconnect')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-card/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">🔐</span>
            </div>
            <p className="text-sm text-text-muted">{t('wallet.secure')}</p>
          </div>
          <div className="p-4 rounded-xl bg-card/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-highlight/20 flex items-center justify-center">
              <span className="text-lg font-bold text-highlight">⚡</span>
            </div>
            <p className="text-sm text-text-muted">{t('wallet.fast')}</p>
          </div>
          <div className="p-4 rounded-xl bg-card/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-lg font-bold text-success">🌐</span>
            </div>
            <p className="text-sm text-text-muted">{t('wallet.decentralized')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
