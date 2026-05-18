/**
 * @file SalaryToken (CUSDO) 合约交互封装类
 */

import { ethers } from 'ethers';
import { ENV } from '../config/env';

// 导入 SalaryToken ABI
import SalaryTokenABI from './SalaryToken.json';

class SalaryToken {
  constructor() {
    this.contractAddress = ENV.SALARY_TOKEN_ADDRESS;
    this.contractAbi = SalaryTokenABI.abi;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  static fromPreset() {
    return new SalaryToken();
  }

  async connect(provider, signer) {
    try {
      this.provider = provider;
      this.signer = signer;
      this.account = await signer.getAddress();
      
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractAbi,
        this.signer
      );

      return {
        success: true,
        account: this.account,
        error: null
      };
    } catch (error) {
      console.error('Failed to connect to SalaryToken:', error);
      return {
        success: false,
        account: null,
        error: error.message
      };
    }
  }

  async setOperator(operatorAddress, expiresAt = '0xffffffffffff') {
    try {
      if (!this.contract) {
        return { success: false, error: 'Contract not initialized' };
      }

      const tx = await this.contract.setOperator(operatorAddress, expiresAt);
      console.log(`setOperator transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        receipt: receipt,
        error: null
      };
    } catch (error) {
      console.error('Failed to set operator:', error);
      return { success: false, error: error.message };
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }
}

export default SalaryToken;

export { SalaryToken };