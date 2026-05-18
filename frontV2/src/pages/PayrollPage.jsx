import { useState, useEffect, useCallback } from 'react';
import { Send, Lock, CheckSquare, Square, Loader2, AlertTriangle, ArrowRight, Users, History, Clock, User, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../store/walletContext';
import { useFHE } from '../utils/relayerSdk';
import { ENV } from '../config/env';
import { useTranslation } from '../i18n/i18n';

export default function PayrollPage({ account, employees: employeesProp = [], onPaymentComplete }) {
  const { t } = useTranslation();
  const { contract, signer } = useWallet();
  const { encryptSalary, decryptValue } = useFHE();
  // 确保 employees 是数组
  const employees = employeesProp || [];
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSalaries, setEmployeeSalaries] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // 薪资记录状态
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  // 管理员解密状态
  const [decryptedAmounts, setDecryptedAmounts] = useState({});

  const toggleEmployee = (address) => {
    setSelectedEmployees(prev => {
      if (prev.includes(address)) {
        setEmployeeSalaries(prevSalaries => {
          const newSalaries = { ...prevSalaries };
          delete newSalaries[address];
          return newSalaries;
        });
        return prev.filter(addr => addr !== address);
      } else {
        setEmployeeSalaries(prevSalaries => ({
          ...prevSalaries,
          [address]: ''
        }));
        return [...prev, address];
      }
    });
    setError('');
  };

  const updateEmployeeSalary = (address, value) => {
    setEmployeeSalaries(prev => ({
      ...prev,
      [address]: value
    }));
    setError('');
  };

  const selectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
      setEmployeeSalaries({});
    } else {
      // 将员工转换为地址字符串数组
      const addresses = employees.map(emp => 
        typeof emp === 'string' ? emp : emp.walletAddress
      );
      setSelectedEmployees(addresses);
      const newSalaries = {};
      employees.forEach(emp => {
        const addr = typeof emp === 'string' ? emp : emp.walletAddress;
        newSalaries[addr] = '';
      });
      setEmployeeSalaries(newSalaries);
    }
  };

  const handlePay = async () => {
    if (selectedEmployees.length === 0) {
      setError(t('payroll.pleaseSelectEmployee'));
      return;
    }

    const invalidSalaries = selectedEmployees.filter(addr => {
      const salary = parseInt(employeeSalaries[addr]);
      return isNaN(salary) || salary <= 0;
    });

    if (invalidSalaries.length > 0) {
      setError(t('payroll.validSalary'));
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMessage('');
    setCompletedCount(0);

    try {
      // 批量加密所有员工的工资
      setIsEncrypting(true);
      
      const employees = [];
      const encryptedSalaries = [];
      const inputProofs = [];

      for (let i = 0; i < selectedEmployees.length; i++) {
        const employeeAddress = selectedEmployees[i];
        // 乘以 10^6 转换为最小单位（USDO 是 6 位小数）
        const salary = Math.floor(parseFloat(employeeSalaries[employeeAddress]) * 1000000);
        
        // 使用 FHE 加密工资
        console.log('[Payroll] 准备加密 - salary:', salary, '(原始输入:', employeeSalaries[employeeAddress], ')', 'contract:', ENV.CONTRACT_ADDRESS, 'account:', account);
        console.log('[Payroll] account 类型:', typeof account);
        console.log('[Payroll] account 是否有效:', account ? /^0x[a-fA-F0-9]{40}$/.test(account) : false);
        
        const encryptResult = await encryptSalary(salary, ENV.CONTRACT_ADDRESS, account);
        if (!encryptResult.success) {
          throw new Error(encryptResult.error || 'Encryption failed');
        }
        
        employees.push(employeeAddress);
        encryptedSalaries.push(encryptResult.encryptedSalary);
        inputProofs.push(encryptResult.inputProof);
        
        // 更新加密进度
        setCompletedCount(i + 1);
      }
      
      setIsEncrypting(false);
      // 批量发送加密工资到合约
      const result = await contract.batchSendEncryptedSalary(employees, encryptedSalaries, inputProofs);
      
      if (result.success) {
        // 批量发放成功，通知所有员工
        employees.forEach((employeeAddress, index) => {
          onPaymentComplete(employeeAddress, encryptedSalaries[index]);
        });
        
        setSuccessMessage(t('payroll.batchSuccess', { count: selectedEmployees.length }));
        setSelectedEmployees([]);
        setEmployeeSalaries({});
      } else {
        throw new Error(result.error || 'Batch payment failed');
      }
    } catch (err) {
      setError(err.message || t('errors.paymentFailed'));
    } finally {
      setIsProcessing(false);
      setIsEncrypting(false);
    }
  };



  // 获取所有薪资记录（管理员）并自动解密
  const loadSalaryRecords = useCallback(async () => {
    if (!contract) return;
    
    setIsLoadingRecords(true);
    try {
      const records = await contract.getAllSalaryRecords();
      console.log('=== 薪资发放记录数据 ===');
      console.log('原始数据:', records);
      console.log('记录数量:', records.length);
      if (records.length > 0) {
        console.log('第一条记录示例:', records[0]);
        console.log('员工地址:', records[0].employee);
        console.log('加密金额:', records[0].encryptedAmount);
        console.log('时间戳:', records[0].timestamp);
      }
      console.log('========================');
      setSalaryRecords(records);
      
      // 自动解密所有记录
      if (records.length > 0 && decryptValue) {
        const newDecrypted = {};
        for (let i = 0; i < records.length; i++) {
          try {
            const result = await decryptValue(
              records[i].encryptedAmount,
              ENV.CONTRACT_ADDRESS,
              account,
              signer
            );
            if (result.success) {
              // 除以 10^6 转换为显示单位
              const displayValue = (parseFloat(result.value) / 1000000).toFixed(2);
              newDecrypted[i] = displayValue;
              setDecryptedAmounts(prev => ({ ...prev, [i]: displayValue }));
            }
          } catch (err) {
            console.error(`Decrypt record ${i} failed:`, err);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load salary records:', error);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [contract, decryptValue, account, signer]);

  // 页面加载时获取薪资记录
  useEffect(() => {
    loadSalaryRecords();
  }, [loadSalaryRecords]);

  // 支付完成后刷新记录
  useEffect(() => {
    if (successMessage) {
      loadSalaryRecords();
    }
  }, [successMessage, loadSalaryRecords]);

  // 格式化时间戳
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="border-glow rounded-2xl p-8 bg-surface/50 backdrop-blur-sm text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-highlight" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">{t('employees.walletNotConnected')}</h2>
            <p className="text-text-muted mb-6">{t('payroll.pleaseConnect')}</p>
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

  if (employees.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="border-glow rounded-2xl p-8 bg-surface/50 backdrop-blur-sm text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-highlight" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">{t('payroll.noEmployeesFound')}</h2>
            <p className="text-text-muted mb-6">{t('payroll.addFirst')}</p>
            <Link
              to="/employees"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all"
            >
              {t('payroll.addEmployees')}
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
          <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-highlight/20 to-success/20 mb-6">
            <Send className="w-16 h-16 text-highlight" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t('payroll.title')}</h1>
          <p className="text-text-muted max-w-md mx-auto">
            {t('payroll.description')}
          </p>
        </div>

        <div className="border-glow rounded-2xl p-6 bg-surface/50 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-text-primary">{t('payroll.selectEmployee')}</label>
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  {selectedEmployees.length === employees.length ? t('payroll.deselectAll') : t('payroll.selectAll')}
                </button>
              </div>
              
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {employees.map(emp => {
                  // 兼容两种数据格式：地址字符串 或 EmployeeWithAddress 对象
                  const addr = typeof emp === 'string' ? emp : emp.walletAddress;
                  const name = typeof emp === 'string' ? '' : (emp.employee?.name || '');
                  return (
                  <div
                    key={addr}
                    className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedEmployees.includes(addr)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEmployee(addr);
                      }}
                      className="flex-shrink-0"
                    >
                      {selectedEmployees.includes(addr) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-text-muted" />
                      )}
                    </button>
                    <div className="flex-shrink-0 min-w-[120px]">
                      <span className="font-medium text-sm text-text-primary">
                        {name || '未命名'}
                      </span>
                    </div>
                    <div className="flex-1 text-right">
                      <span className="font-mono text-xs text-text-muted">
                        {addr}
                      </span>
                    </div>
                    {selectedEmployees.includes(addr) && (
                      <div className="relative flex-shrink-0 w-32">
                        <input
                          type="number"
                          value={employeeSalaries[addr] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateEmployeeSalary(addr, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t('payroll.enterAmount')}
                          className="w-full py-2 px-3 pr-10 rounded-lg bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary font-mono text-sm"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">ETH</span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {selectedEmployees.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                  <Users className="w-4 h-4" />
                  <span>{t('payroll.selectedCount', { count: selectedEmployees.length })}</span>
                </div>
              )}
            </div>

            {selectedEmployees.length > 0 && (
              <div className="p-4 rounded-xl bg-card/50 border border-border">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-text-muted">{t('payroll.encryptionPreview')}</p>
                    <p className="text-sm text-accent">{t('payroll.encryptDesc')}</p>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && selectedEmployees.length > 1 && (
              <div className="p-4 rounded-xl bg-highlight/10 border border-highlight/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-highlight">{t('payroll.processingBatch')}</span>
                  <span className="text-sm text-text-muted">{completedCount} / {selectedEmployees.length}</span>
                </div>
                <div className="w-full bg-card rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedCount / selectedEmployees.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isProcessing || selectedEmployees.length === 0 || selectedEmployees.some(addr => !employeeSalaries[addr] || parseInt(employeeSalaries[addr]) <= 0)}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-lg transition-all glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                isEncrypting ? (
                  <>
                    <Lock className="w-5 h-5 animate-pulse" />
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('payroll.encrypting')}
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('payroll.processing')}
                  </>
                )
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {t('payroll.encryptPay')}
                </>
              )}
            </button>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 text-success mb-2">
                  <CheckSquare className="w-4 h-4" />
                  <span className="font-medium">{successMessage}</span>
                </div>
                <Link
                  to="/view"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-highlight hover:underline"
                >
                  {t('payroll.viewSalary')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 薪资发放记录区域 */}
        <div className="mt-8 border-glow rounded-2xl p-6 bg-surface/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-text-primary">{t('payroll.salaryHistory')}</h2>
            <button
              onClick={loadSalaryRecords}
              disabled={isLoadingRecords}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-sm text-text-muted"
            >
              {isLoadingRecords ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t('common.refresh')}
                </>
              )}
            </button>
          </div>

          {isLoadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : salaryRecords.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-4 text-text-muted/50" />
              <p className="text-text-muted">{t('payroll.noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {salaryRecords.map((record, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary font-mono text-xs truncate">
                          {record.employee}
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(record.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {decryptedAmounts[index] !== undefined ? (
                        <p className="font-semibold text-success text-sm">
                          {decryptedAmounts[index]} ETH
                        </p>
                      ) : (
                        <>
                          <p className="font-semibold text-highlight text-xs font-mono break-all max-w-[120px]">
                            {record.encryptedAmount ? record.encryptedAmount.slice(0, 10) + '...' : '-'}
                          </p>
                          <p className="text-xs text-text-muted">{t('payroll.encrypted')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
