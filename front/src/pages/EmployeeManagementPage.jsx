import { useState, useEffect } from 'react';
import { Users, Plus, UserCheck, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../store/walletContext';
import { useTranslation } from '../i18n/i18n';

// formatAddress 函数
function formatAddress(address) {
  if (!address) return '';
  return address;
}

export default function EmployeeManagementPage({ account, employees: employeesProp, onEmployeeAdded }) {
  const { t } = useTranslation();
  const { contract } = useWallet();
  // 确保 employees 是数组
  const employees = employeesProp || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    walletAddress: '',
    residentialAddress: '',
    email: ''
  });

  const loadEmployeeDetails = async () => {
    try {
      const details = await contract.getAllEmployees();
      console.log('getAllEmployees 返回数据:', details);
      console.log('员工对象结构:', details.length > 0 ? Object.keys(details[0]) : '无数据');
      setEmployeeList(details);
    } catch (err) {
      console.error('Failed to load employee details:', err);
    }
  };

  useEffect(() => {
    if (account) {
      loadEmployeeDetails();
    }
  }, [account, employees, contract]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleGenerateAddress = () => {
    // TODO: 使用真实的方式生成或获取地址
    setFormData(prev => ({
      ...prev,
      walletAddress: ''
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError(t('errors.firstName'));
      return false;
    }
    if (!formData.lastName.trim()) {
      setError(t('errors.lastName'));
      return false;
    }
    if (!formData.walletAddress.trim()) {
      setError(t('errors.walletAddress'));
      return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress.trim())) {
      setError(t('errors.invalidAddress'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('errors.email'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError(t('errors.invalidEmail'));
      return false;
    }
    if (!formData.residentialAddress.trim()) {
      setError(t('errors.residentialAddress'));
      return false;
    }
    if (employees.includes(formData.walletAddress.trim().toLowerCase())) {
      setError(t('errors.employeeExists'));
      return false;
    }
    return true;
  };

  const handleAddEmployee = async () => {
    if (!validateForm()) return;

    setIsAdding(true);
    setError('');

    try {
      await contract.addEmployee({
        address: formData.walletAddress.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        residentialAddress: formData.residentialAddress.trim(),
        email: formData.email.trim()
      });

      setRecentlyAdded(formData.walletAddress.trim().toLowerCase());
      setTimeout(() => setRecentlyAdded(null), 2000);
      onEmployeeAdded(formData.walletAddress.trim().toLowerCase());

      setFormData({
        firstName: '',
        lastName: '',
        walletAddress: '',
        residentialAddress: '',
        email: ''
      });
      setIsModalOpen(false);
      await loadEmployeeDetails();
    } catch (err) {
      setError(t('errors.failedAdd'));
    } finally {
      setIsAdding(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      walletAddress: '',
      residentialAddress: '',
      email: ''
    });
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="border-glow rounded-2xl p-8 bg-surface/50 backdrop-blur-sm text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-highlight" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">{t('employees.walletNotConnected')}</h2>
            <p className="text-text-muted mb-6">{t('employees.pleaseConnect')}</p>
            <Link
              to="/wallet"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all"
            >
              {t('employees.connectWallet')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 mb-6">
            <Users className="w-16 h-16 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t('employees.title')}</h1>
          <p className="text-text-muted max-w-md mx-auto">
            {t('employees.description')}
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all glow-purple"
          >
            <Plus className="w-5 h-5" />
            {t('employees.addEmployee')}
          </button>
        </div>

        <div className="border-glow rounded-2xl p-6 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {t('employees.employeeList')} ({employeeList.length})
            </h2>
            {employeeList.length > 0 && (
              <Link
                to="/payroll"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-highlight/20 text-highlight hover:bg-highlight/30 transition-all text-sm"
              >
                {t('employees.processPayroll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {employeeList.length === 0 ? (
            <div className="p-8 rounded-xl bg-card/50 border border-dashed border-border text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <p className="text-text-muted">{t('employees.noEmployees')}</p>
              <p className="text-sm text-text-muted mt-2">{t('employees.clickAdd')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeList.map((employee, index) => (
                <div
                  key={employee.walletAddress}
                  className={`p-4 rounded-xl bg-card border transition-all ${
                    recentlyAdded === employee.walletAddress
                      ? 'border-success glow-green'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary">
                        {employee.employee.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-text-muted flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="font-mono text-accent">{formatAddress(employee.walletAddress)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg border-glow rounded-2xl p-6 bg-surface/95 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">{t('employees.addEmployee')}</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-card transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">{t('employees.firstName')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full py-3 px-4 rounded-xl bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">{t('employees.lastName')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full py-3 px-4 rounded-xl bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">{t('employees.walletAddress')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    className="flex-1 py-3 px-4 rounded-xl bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary font-mono text-sm"
                  />
                  <button
                    onClick={handleGenerateAddress}
                    className="px-4 py-3 rounded-xl bg-card border border-border hover:border-highlight text-highlight transition-colors"
                    title="Generate address"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">{t('employees.residentialAddress')}</label>
                <textarea
                  name="residentialAddress"
                  value={formData.residentialAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main Street, City, Country"
                  rows={2}
                  className="w-full py-3 px-4 rounded-xl bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">{t('employees.emailAddress')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  className="w-full py-3 px-4 rounded-xl bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl bg-card border border-border text-text-primary hover:bg-card/80 transition-all"
                >
                  {t('employees.cancel')}
                </button>
                <button
                  onClick={handleAddEmployee}
                  disabled={isAdding}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('employees.adding')}
                    </>
                  ) : (
                    t('employees.addEmployee')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
