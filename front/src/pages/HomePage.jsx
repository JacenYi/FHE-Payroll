import { useState } from 'react';
import { Shield, Lock, Users, Send, Eye, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export default function HomePage({ account, onConnect, isConnecting, role = 'employee' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleAddEmployee = () => {
    if (!isAdmin) {
      setDialogMessage(t('common.adminAlert'));
      setAdminDialogOpen(true);
      return;
    }
    navigate('/employees');
  };

  const handleProcessPayroll = () => {
    if (!isAdmin) {
      setDialogMessage(t('common.payrollAlert'));
      setAdminDialogOpen(true);
      return;
    }
    navigate('/payroll');
  };

  const handleStepAction = (step) => {
    if (step.adminOnly && !isAdmin) {
      if (step.link === '/employees') {
        setDialogMessage(t('common.adminAlert'));
      } else if (step.link === '/payroll') {
        setDialogMessage(t('common.payrollAlert'));
      }
      setAdminDialogOpen(true);
      return;
    }
    
    let navigateTo = step.link;
    if (step.link === '/view' && isAdmin) {
      navigateTo = '/payroll';
    }
    navigate(navigateTo);
  };

  const features = [
    {
      icon: Lock,
      title: t('home.encryptionTitle'),
      description: t('home.encryptionDesc'),
      color: 'from-primary to-accent'
    },
    {
      icon: Users,
      title: t('home.managementTitle'),
      description: t('home.managementDesc'),
      color: 'from-accent to-highlight',
      adminOnly: true
    },
    {
      icon: Send,
      title: t('home.paymentTitle'),
      description: t('home.paymentDesc'),
      color: 'from-highlight to-success',
      adminOnly: true
    },
    {
      icon: Eye,
      title: t('home.privacyTitle'),
      description: t('home.privacyDesc'),
      color: 'from-success to-primary'
    }
  ];

  const steps = [
    {
      number: '01',
      title: t('home.step1Title'),
      description: t('home.step1Desc'),
      action: t('home.step1Action'),
      link: '/wallet',
      forAll: true
    },
    {
      number: '02',
      title: t('home.step2Title'),
      description: t('home.step2Desc'),
      action: t('home.step2Action'),
      link: '/employees',
      adminOnly: true
    },
    {
      number: '03',
      title: t('home.step3Title'),
      description: t('home.step3Desc'),
      action: t('home.step3Action'),
      link: '/payroll',
      adminOnly: true
    },
    {
      number: '04',
      title: t('home.step4Title'),
      description: t('home.step4Desc'),
      action: t('home.step4Action'),
      link: '/view',
      forAll: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-highlight/20 mb-8 animate-float">
              <Shield className="w-20 h-20 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-text-primary mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
              {t('home.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!account ? (
                <button
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all glow-purple disabled:opacity-50 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('home.connecting')}
                    </span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {t('home.getStarted')}
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={handleAddEmployee}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        {t('common.addEmployee')}
                      </button>
                      <button
                        onClick={handleProcessPayroll}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-highlight hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        {t('common.processPayroll')}
                      </button>
                    </>
                  ) : (
                    <Link
                      to={role === 'admin' ? '/payroll' : '/view'}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      {t('common.viewMySalary')}
                    </Link>
                  )}
                </div>
              )}
              <Link
                to="/wallet"
                className="px-8 py-3 rounded-xl bg-card border border-border text-text-primary hover:border-primary/50 transition-all flex items-center gap-2"
              >
                {account ? t('common.walletDetails') : t('home.explore')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {features.map((feature, index) => {
              if (feature.adminOnly && !isAdmin) return null;

              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border-glow hover:bg-surface transition-all"
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-muted">{feature.description}</p>
                  {feature.adminOnly && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                      {t('common.adminOnly')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-text-primary mb-4">{t('home.howItWorks')}</h2>
              <p className="text-text-muted">{t('home.howItWorksDesc')}</p>
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => {
                return (
                  <div
                    key={index}
                    className="flex gap-6 p-6 rounded-2xl bg-surface/50 backdrop-blur-sm border-glow hover:bg-surface transition-all"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {step.number}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-text-primary mb-2">{step.title}</h3>
                          {step.adminOnly && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {t('common.adminOnly')}
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted">{step.description}</p>
                      </div>
                      <button
                        onClick={() => handleStepAction(step)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex-shrink-0"
                      >
                        {step.action}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isAdmin && account && (
            <div className="mb-8 p-6 rounded-2xl bg-accent/10 border border-accent/30">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">{t('common.employeeFeature')}</h3>
                  <p className="text-text-muted mb-4">
                    {t('common.employeeDesc')}
                  </p>
                  <Link
                    to={role === 'admin' ? '/payroll' : '/view'}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    {t('common.viewMySalary')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="relative rounded-3xl p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-highlight/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-highlight/20 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">{t('home.readyTitle')}</h2>
                <p className="text-text-muted">{t('home.readyDesc')}</p>
              </div>
              {isAdmin ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleAddEmployee}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    {t('common.addEmployee')}
                  </button>
                  <button
                    onClick={handleProcessPayroll}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-highlight hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {t('common.processPayroll')}
                  </button>
                </div>
              ) : (
                <Link
                  to={role === 'admin' ? '/payroll' : '/view'}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  {t('common.viewMySalary')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-card/50">
              <div className="text-3xl font-bold text-primary mb-1">🔐</div>
              <p className="text-sm text-text-muted">{t('home.fhe')}</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50">
              <div className="text-3xl font-bold text-accent mb-1">⚡</div>
              <p className="text-sm text-text-muted">{t('home.fast')}</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50">
              <div className="text-3xl font-bold text-highlight mb-1">🌐</div>
              <p className="text-sm text-text-muted">{t('home.blockchain')}</p>
            </div>
            <div className="p-4 rounded-xl bg-card/50">
              <div className="text-3xl font-bold text-success mb-1">🔒</div>
              <p className="text-sm text-text-muted">{t('home.privacy')}</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-text-primary">FHE Payroll Demo</span>
          </div>
          <p className="text-sm text-text-muted">
            {t('home.footer')}
          </p>
        </div>
      </footer>

      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              {t('common.adminOnly')}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}