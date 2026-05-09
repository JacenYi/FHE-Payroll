import { useState, useEffect } from 'react';
import { Loader2, Wallet, History, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useWallet } from '../store/walletContext';
import { useFHE } from '../utils/relayerSdk';
import { ENV } from '../config/env';
import { useTranslation } from '../i18n/i18n';


export default function EmployeeViewPage({ account, role }) {
  const { t } = useTranslation();
  const { contract, connect, isConnecting, isInitialized, signer } = useWallet();
  const { isReady: fheReady, decryptSalary } = useFHE();
  
  const [isLoading, setIsLoading] = useState(true);

  const [salary, setSalary] = useState('');
  const [balance, setBalance] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [salaryHistory, setSalaryHistory] = useState([]);
  const [decryptedHistoryAmounts, setDecryptedHistoryAmounts] = useState({});

  useEffect(() => {
    const loadData = async () => {
      // 如果钱包还没初始化，等待
      if (!isInitialized) {
        setIsLoading(true);
        return;
      }

      setIsLoading(true);

      try {
        if (account && role === 'employee') {
          // 使用新的合约方法获取加密薪资
          const encryptedSalary = await contract.getEncryptedSalary();
          const history = await contract.getMySalaryRecords();
          console.log('=== 员工薪资发放记录 ===');
          console.log('记录列表:', history);
          console.log('记录数量:', history?.length || 0);
          if (history && history.length > 0) {
            console.log('第一条记录:', history[0]);
            console.log('员工地址:', history[0]?.employee);
            console.log('加密金额:', history[0]?.encryptedAmount);
            console.log('时间戳:', history[0]?.timestamp);
          }
          console.log('========================');
          
          // 如果 FHE 就绪，尝试解密薪资；否则显示加密数据
          if (encryptedSalary) {
            console.log('=== 员工薪资解密调试 ===');
            console.log('加密薪资:', encryptedSalary);
            console.log('fheReady:', fheReady);
            console.log('decryptSalary 方法存在:', !!decryptSalary);
            console.log('signer:', signer);
            console.log('account:', account);
            
            if (fheReady && decryptSalary) {
              try {
                const decryptResult = await decryptSalary(encryptedSalary, ENV.CONTRACT_ADDRESS, account, signer);
                console.log('解密结果:', decryptResult);
                if (decryptResult.success) {
                  // 除以 10^6 转换为显示单位，保留两位小数
                  const displayValue = (parseFloat(decryptResult.salary) / 1000000).toFixed(2);
                  setSalary(displayValue);
                  setBalance(displayValue);
                } else {
                  console.log('解密失败:', decryptResult.error);
                  setSalary(encryptedSalary);
                  setBalance(encryptedSalary);
                }
              } catch (decryptError) {
                console.error('Decryption failed:', decryptError);
                setSalary(encryptedSalary);
                setBalance(encryptedSalary);
              }
            } else {
              console.log('FHE 未就绪或解密方法不存在');
              setSalary(encryptedSalary);
              setBalance(encryptedSalary);
            }
          } else {
            setSalary('');
            setBalance('');
          }
          
          // 解密历史记录中的金额
          if (fheReady && decryptSalary && history && history.length > 0) {
            const decryptedAmounts = {};
            for (let i = 0; i < history.length; i++) {
              const record = history[i];
              if (record?.encryptedAmount) {
                try {
                  const decryptResult = await decryptSalary(record.encryptedAmount, ENV.CONTRACT_ADDRESS, account, signer);
                  if (decryptResult.success) {
                    // 除以 10^6 转换为显示单位，保留两位小数
                    const displayValue = (parseFloat(decryptResult.salary) / 1000000).toFixed(2);
                    decryptedAmounts[i] = displayValue;
                    console.log(`记录 ${i} 解密成功:`, displayValue);
                  } else {
                    console.log(`记录 ${i} 解密失败:`, decryptResult.error);
                  }
                } catch (err) {
                  console.error(`记录 ${i} 解密异常:`, err);
                }
              }
            }
            setDecryptedHistoryAmounts(decryptedAmounts);
          }
          
          setSalaryHistory(history || []);
        } else {
          setSalary('');
          setBalance('');
          setSalaryHistory([]);
          setDecryptedHistoryAmounts({});
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setSalary('');
        setBalance('');
        setSalaryHistory([]);
        setDecryptedHistoryAmounts({});
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [account, role, contract, isInitialized, fheReady, decryptSalary, signer, t]);



  const handleWithdraw = async () => {
    if (!withdrawAmount || !balance || isWithdrawing) return;

    const withdrawNum = parseFloat(withdrawAmount);
    const balanceNum = parseFloat(balance);

    if (withdrawNum <= 0 || withdrawNum > balanceNum) {
      return;
    }

    setIsWithdrawing(true);
    setWithdrawSuccess(false);

    try {
      // 使用新的合约方法 withdrawSalary，传入 uint64 金额（乘以 10^6 转换为最小单位）
      const result = await contract.withdrawSalary(BigInt(Math.floor(withdrawNum * 1000000)));

      if (result.success) {
        // 更新余额
        const newBalance = balanceNum - withdrawNum;
        setBalance(newBalance.toString());
        setWithdrawAmount('');
        setWithdrawSuccess(true);

        setTimeout(() => {
          setWithdrawSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Withdraw failed:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (timestamp) => {
    // 将 BigInt 转换为 number（合约返回的是 BigInt）
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto py-10 space-y-6">
        <Card className="shadow-lg border-border rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground">
              {t('employeeView.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('employeeView.description')}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isInitialized ? (
              <div className="space-y-6 py-12">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                  <div>
                    <p className="font-medium text-foreground">初始化中...</p>
                    <p className="text-sm text-muted-foreground mt-1">正在加载钱包状态</p>
                  </div>
                </div>
              </div>
            ) : !account ? (
              <div className="space-y-6 py-12">
                <div className="flex flex-col items-center text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{t('employees.walletNotConnected')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('view.pleaseConnectView')}</p>
                  </div>
                  <Button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full max-w-xs"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('navbar.connecting')}
                      </>
                    ) : (
                      t('navbar.connect')
                    )}
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* 余额部分 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">{t('employeeView.balance')}</h3>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium text-foreground">{t('employeeView.currentBalance')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${balance || '0.00'}
                    </p>
                  </div>

                  {balance && (
                    <div className="space-y-4 mt-6 p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">{t('employeeView.withdraw')}</h3>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('employeeView.withdrawAmount')}
                        </label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={t('employeeView.enterWithdrawAmount')}
                          max={balance}
                          step="0.01"
                          className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('employeeView.maxWithdraw')}: ${balance}
                        </p>
                      </div>

                      {withdrawSuccess && (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle className="w-4 h-4" />
                          {t('employeeView.withdrawSuccess')}
                        </div>
                      )}

                      <Button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(balance) || isWithdrawing}
                        className="w-full"
                      >
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('employeeView.withdrawing')}...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="w-4 h-4" />
                            {t('employeeView.withdrawBtn')}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 薪资历史记录部分 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{t('employeeView.salaryHistory')}</h3>
                  </div>
                  
                  {salaryHistory.length === 0 ? (
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-sm text-muted-foreground">{t('employeeView.noSalaryHistory')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {salaryHistory.map((record, index) => (
                        <div key={record.timestamp + '-' + index} className="p-4 rounded-xl bg-card border border-border">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {t('employeeView.payment')} #{salaryHistory.length - index}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDate(record.timestamp)}</p>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                              #{salaryHistory.length - index}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{t('employeeView.amount')}</p>
                              <p className="text-lg font-semibold text-foreground">
                                ${decryptedHistoryAmounts[index] || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}