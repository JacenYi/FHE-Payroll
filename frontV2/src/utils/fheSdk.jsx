/**
 * FHE（全同态加密）SDK 封装
 * 
 * 功能概述：
 * - 封装 @zama-fhe/react-sdk 的功能
 * - 提供 React Context 和 Hooks
 * - 支持加密、解密、密钥生成等操作
 * 
 * 包含组件：
 * - FHEProvider: 完整的 FHE Provider（需要 signer）
 * - FHEProviderSimple: 简化版 FHE Provider（用于测试）
 * - useFHE: 自定义 Hook，封装加密功能
 * 
 * 注意事项：
 * - 当前 FHEProviderSimple 为模拟模式，不提供真实加密
 * - 需要配置钱包后才能使用 FHEProvider
 */

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ZamaProvider,
  useEncrypt,
  usePublicKey,
  useGenerateKeypair,
  RelayerWeb,
  indexedDBStorage,
} from '@zama-fhe/react-sdk';
import { EthersSigner } from '@zama-fhe/sdk/ethers';
import { ENV } from '../config/env';

/**
 * FHE Context
 * 用于在组件树中传递 FHE 相关状态和方法
 */
const FHEContext = createContext(null);

/**
 * QueryClient 实例
 * 用于管理 React Query 的缓存和状态
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * FHE SDK Provider
 * 完整的 FHE 功能 Provider，需要传入 ethers provider 和 signer
 * 
 * @param {React.ReactNode} children - 子组件
 * @param {ethers.Provider} provider - ethers Provider
 * @param {ethers.Signer} signer - ethers Signer
 */
// export function FHEProvider({ children, provider, signer }) {
//   const [zamaSigner, setZamaSigner] = useState(null);
//   const [relayer, setRelayer] = useState(null);

//   useEffect(() => {
//     if (!provider || !signer) {
//       setZamaSigner(null);
//       setRelayer(null);
//       return;
//     }

//     try {
//       // 创建 Zama EthersSigner 适配器
//       const ethersSigner = new EthersSigner(provider, signer);
//       setZamaSigner(ethersSigner);

//       // 创建 Relayer 配置
//       const relayerConfig = new RelayerWeb({
//         getChainId: async () => {
//           const network = await provider.getNetwork();
//           return Number(network.chainId);
//         },
//         transports: {
//           11155111: {
//             relayerUrl: ENV.SEPOLIA_RELAYER_URL,
//             network: ENV.SEPOLIA_RPC_URL,
//           },
//           17000: {
//             relayerUrl: ENV.HOLESKY_RELAYER_URL,
//             network: ENV.HOLESKY_RPC_URL,
//           },
//         },
//       });
//       setRelayer(relayerConfig);
//     } catch (err) {
//       console.error('Failed to initialize FHE:', err);
//       setZamaSigner(null);
//       setRelayer(null);
//     }
//   }, [provider, signer]);

//   // 创建一个默认的 signer 占位符，这样 ZamaProvider 可以始终渲染
//   const dummySigner = {
//     getAddress: async () => '0x0000000000000000000000000000000000000000',
//     signMessage: async () => { throw new Error('Signer not initialized'); },
//     signTypedData: async () => { throw new Error('Signer not initialized'); },
//   };

//   const dummyRelayer = {
//     getChainId: async () => 11155111,
//     transport: {
//       relayerUrl: '',
//       network: '',
//     },
//   };

//   // 始终渲染 ZamaProvider，即使 signer 还没准备好
//   return (
//     <QueryClientProvider client={queryClient}>
//       <ZamaProvider 
//         relayer={relayer || dummyRelayer} 
//         signer={zamaSigner || dummySigner} 
//         storage={indexedDBStorage}
//       >
//         <FHEContext.Provider value={{ isReady: !!(zamaSigner && relayer), error: null }}>
//           {children}
//         </FHEContext.Provider>
//       </ZamaProvider>
//     </QueryClientProvider>
//   );
// }
export function FHEProvider({ children, provider, signer }) {
  const [zamaSigner, setZamaSigner] = useState(null);
  const [relayer, setRelayer] = useState(null);

  useEffect(() => {
    async function init() {
      if (!provider || !signer) return;

      try {
        const ethersSigner = new EthersSigner(provider, signer);

        const relayerConfig = new RelayerWeb({
          getChainId: async () => {
            const network = await provider.getNetwork();
            return Number(network.chainId);
          },
          transports: {
            11155111: {
              relayerUrl: ENV.SEPOLIA_RELAYER_URL,
              network: ENV.SEPOLIA_RPC_URL,
            },
          },
        });

        setZamaSigner(ethersSigner);
        setRelayer(relayerConfig);
      } catch (err) {
        console.error(err);
      }
    }

    init();
  }, [provider, signer]);

  // 关键
  if (!zamaSigner || !relayer) {
    return <div>Initializing FHE...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ZamaProvider
        relayer={relayer}
        signer={zamaSigner}
        storage={indexedDBStorage}
      >
        {children}
      </ZamaProvider>
    </QueryClientProvider>
  );
}

/**
 * 简化的 FHE Provider
 * 不需要外部 signer，使用内存存储，适用于开发测试
 * 
 * @param {React.ReactNode} children - 子组件
 */
export function FHEProviderSimple({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FHEContext.Provider value={{ isReady: false, error: 'Signer not configured', isMock: true }}>
        {children}
      </FHEContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * 自定义 Hook - 封装加密功能
 * 提供便捷的加密、解密、密钥生成方法
 * 
 * @returns {Object} FHE 相关状态和方法
 */
export function useFHE() {
  const context = useContext(FHEContext);

  // 获取 Zama SDK 的原始 hooks
  const encryptMutation = useEncrypt();
  const { data: publicKeyData } = usePublicKey();
  const generateKeypairMutation = useGenerateKeypair();

  /**
   * 加密单个数字 (euint64)
   * 
   * @param {number} value - 要加密的数值
   * @param {string} contractAddress - 合约地址
   * @returns {Promise<Object>} 加密结果
   */
  const encryptNumber = useCallback(async (value, contractAddress) => {
    // 检查 FHE 是否已初始化
    if (!context?.isReady) {
      return {
        success: false,
        handle: null,
        inputProof: null,
        error: 'FHE not initialized - signer required',
      };
    }

    // 检查公钥是否已获取
    if (!publicKeyData) {
      return {
        success: false,
        handle: null,
        inputProof: null,
        error: 'Public key not available - FHE initializing',
      };
    }

    try {
      const result = await encryptMutation.mutateAsync({
        values: [{ value: BigInt(value), type: 'euint64' }],
        contractAddress,
      });

      // 检查结果是否有效
      if (!result || !result.handles) {
        return {
          success: false,
          handle: null,
          inputProof: null,
          error: 'Encryption returned invalid result',
        };
      }

      return {
        success: true,
        handle: result.handles[0],
        inputProof: result.inputProof,
        error: null,
      };
    } catch (err) {
      console.error('Encryption failed:', err);
      return {
        success: false,
        handle: null,
        inputProof: null,
        error: err.message || 'Encryption failed',
      };
    }
  }, [encryptMutation, context?.isReady, publicKeyData]);

  /**
   * 加密多个数字
   * 
   * @param {Array<Object>} values - 要加密的数值数组
   * @param {string} contractAddress - 合约地址
   * @returns {Promise<Object>} 加密结果
   */
  const encryptBatch = useCallback(async (values, contractAddress) => {
    if (!context?.isReady) {
      return {
        success: false,
        handles: null,
        inputProof: null,
        error: 'FHE not initialized - signer required',
      };
    }

    try {
      const formattedValues = values.map(v => ({
        value: BigInt(v.value),
        type: v.type || 'euint64',
      }));

      const result = await encryptMutation.mutateAsync({
        values: formattedValues,
        contractAddress,
      });

      return {
        success: true,
        handles: result.handles,
        inputProof: result.inputProof,
        error: null,
      };
    } catch (err) {
      console.error('Batch encryption failed:', err);
      return {
        success: false,
        handles: null,
        inputProof: null,
        error: err.message || 'Batch encryption failed',
      };
    }
  }, [encryptMutation, context?.isReady]);

  /**
   * 加密薪资
   * 专门用于加密薪资的便捷方法
   * 
   * @param {number} salary - 薪资数值
   * @param {string} payrollContractAddress - 薪资合约地址
   * @returns {Promise<Object>} 加密结果
   */
  const encryptSalary = useCallback(async (salary, payrollContractAddress) => {
    const result = await encryptNumber(salary, payrollContractAddress);
    return {
      success: result.success,
      encryptedSalary: result.handle,
      inputProof: result.inputProof,
      error: result.error,
    };
  }, [encryptNumber]);

  /**
   * 模拟解密（用于演示）
   * 注意：解密需要在组件中直接使用 useUserDecrypt hook
   * 
   * @returns {Promise<Object>} 解密结果
   */
  const decryptValue = useCallback(async () => {
    console.warn('Decryption requires useUserDecrypt hook in component context');
    return {
      success: false,
      value: null,
      error: 'Use useUserDecrypt hook directly in component',
    };
  }, []);

  /**
   * 生成 FHE 密钥对
   * 
   * @returns {Promise<Object>} 密钥生成结果
   */
  const generateKeypair = useCallback(async () => {
    if (!context?.isReady) {
      return {
        success: false,
        keypair: null,
        error: 'FHE not initialized - signer required',
      };
    }

    try {
      const keypair = await generateKeypairMutation.mutateAsync();
      return {
        success: true,
        keypair,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        keypair: null,
        error: err.message,
      };
    }
  }, [generateKeypairMutation, context?.isReady]);

  return {
    // 状态
    isReady: context?.isReady || false,
    isMock: context?.isMock || false,
    isEncrypting: encryptMutation.isPending,
    isGeneratingKeypair: generateKeypairMutation.isPending,
    publicKey: publicKeyData,
    encryptError: encryptMutation.error,

    // 方法
    encryptNumber,
    encryptBatch,
    encryptSalary,
    decryptValue,
    generateKeypair,

    // 原始 mutations
    encryptMutation,
    generateKeypairMutation,
  };
}

/**
 * 导出 Zama SDK 的其他 hooks
 * 方便在组件中直接使用
 */
export {
  useEncrypt,
  useUserDecrypt,
  usePublicKey,
  useGenerateKeypair,
  RelayerWeb,
  indexedDBStorage,
  memoryStorage,
} from '@zama-fhe/react-sdk';

export { EthersSigner } from '@zama-fhe/sdk/ethers';

export default FHEContext;
