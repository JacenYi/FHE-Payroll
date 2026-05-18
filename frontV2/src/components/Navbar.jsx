import { Shield, Wallet, Users, Send, Eye, Globe, UserCog, User, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation, languages } from '../i18n/i18n';

export default function Navbar({ account, onConnect, onDisconnect, isConnecting, role }) {
  const location = useLocation();
  const { t, lang, changeLang } = useTranslation();

  const navItems = [
    { path: '/', label: t('navbar.home'), icon: Shield, showFor: ['admin', 'employee'] },
    { path: '/wallet', label: t('navbar.wallet'), icon: Wallet, showFor: ['admin', 'employee'] },
    { path: '/employees', label: t('navbar.employees'), icon: Users, showFor: ['admin'] },
    { path: '/payroll', label: t('navbar.payroll'), icon: Send, showFor: ['admin'] },
    { path: '/view', label: t('navbar.view'), icon: Eye, showFor: ['employee'] },
  ];

  const currentLang = languages.find(l => l.code === lang);

  return (
    <nav className="border-b border-border/30 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/wallet" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent group-hover:glow-purple transition-all">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-text-primary">FHE Payroll</span>
          </Link>

          <div className="flex items-center gap-2">
            {navItems
              .filter((item) => item.showFor.includes(role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-text-muted hover:text-text-primary hover:bg-card'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => changeLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              title={`Switch to ${lang === 'en' ? '中文' : 'English'}`}
            >
              <Globe className="w-4 h-4 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">
                {currentLang?.flag} {currentLang?.name}
              </span>
            </button>

            {account && role !== 'none' && role !== 'unknown' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                role === 'admin'
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-primary/20 border-primary text-primary'
              }`}>
                {role === 'admin' ? <UserCog className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm font-medium hidden sm:inline">
                  {role === 'admin' ? t('navbar.admin') : t('navbar.employee')}
                </span>
              </div>
            )}

            {!account ? (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all glow-purple disabled:opacity-50"
              >
                {isConnecting ? t('navbar.connecting') : t('navbar.connect')}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-sm text-accent">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button
                  onClick={onDisconnect}
                  className="p-0.5 rounded hover:bg-error/20 text-text-muted hover:text-error transition-colors"
                  title={t('navbar.disconnect')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
