import { ethers } from 'ethers';
import Web3 from 'web3';

let provider: ethers.JsonRpcProvider;
let web3: Web3;
let signer: ethers.Wallet;

const initializeWeb3 = async (): Promise<void> => {
  try {
    if (!process.env.ETHEREUM_RPC_URL) {
      throw new Error('Ethereum RPC URL is not configured');
    }

    // Initialize ethers.js
    provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    
    if (process.env.PRIVATE_KEY) {
      signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    }

    // Initialize Web3
    web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    if (process.env.PRIVATE_KEY) {
      web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
    }

    // Test connection
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Web3 initialized successfully. Current block: ${blockNumber}`);
  } catch (error) {
    console.error('❌ Failed to initialize Web3:', error);
    throw error;
  }
};

export { initializeWeb3 };

export const getProvider = (): ethers.JsonRpcProvider => {
  if (!provider) {
    throw new Error('Web3 not initialized. Call initializeWeb3() first.');
  }
  return provider;
};

export const getWeb3 = (): Web3 => {
  if (!web3) {
    throw new Error('Web3 not initialized. Call initializeWeb3() first.');
  }
  return web3;
};

export const getSigner = (): ethers.Wallet => {
  if (!signer) {
    throw new Error('Signer not available. Private key not configured.');
  }
  return signer;
};

// Smart Contract ABI for escrow contract
const ESCROW_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_payer", "type": "address"},
      {"internalType": "address", "name": "_payee", "type": "address"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "uint256", "name": "_releaseTime", "type": "uint256"}
    ],
    "name": "createEscrow",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_escrowId", "type": "uint256"}],
    "name": "releaseFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_escrowId", "type": "uint256"}],
    "name": "refundFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_escrowId", "type": "uint256"}],
    "name": "getEscrowDetails",
    "outputs": [
      {"internalType": "address", "name": "payer", "type": "address"},
      {"internalType": "address", "name": "payee", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "releaseTime", "type": "uint256"},
      {"internalType": "bool", "name": "released", "type": "bool"},
      {"internalType": "bool", "name": "refunded", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface CreateEscrowParams {
  payerAddress: string;
  payeeAddress: string;
  amount: string; // in ETH
  releaseTimeHours: number;
}

export interface EscrowDetails {
  payer: string;
  payee: string;
  amount: string;
  releaseTime: number;
  released: boolean;
  refunded: boolean;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private web3: Web3;
  private escrowContract: ethers.Contract | undefined;

  constructor() {
    this.provider = getProvider();
    this.signer = getSigner();
    this.web3 = getWeb3();
    
    if (process.env.SMART_CONTRACT_ADDRESS) {
      this.escrowContract = new ethers.Contract(
        process.env.SMART_CONTRACT_ADDRESS,
        ESCROW_CONTRACT_ABI,
        this.signer
      );
    }
  }

  private ensureContract(): ethers.Contract {
    if (!this.escrowContract) {
      throw new Error('Escrow contract not initialized');
    }
    return this.escrowContract;
  }

  // Wallet operations
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async generateWallet(): Promise<{ address: string; privateKey: string; mnemonic?: string }> {
    try {
      const wallet = ethers.Wallet.createRandom();
      const result: { address: string; privateKey: string; mnemonic?: string } = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      
      if (wallet.mnemonic?.phrase) {
        result.mnemonic = wallet.mnemonic.phrase;
      }
      
      return result;
    } catch (error) {
      console.error('Failed to generate wallet:', error);
      throw error;
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      console.error('Failed to validate address:', error);
      return false;
    }
  }

  // Transaction operations
  async sendTransaction(to: string, amount: string, data?: string): Promise<string> {
    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        data: data || '0x',
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async getTransaction(txHash: string): Promise<any> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        transaction: tx,
        receipt: receipt,
        confirmations: receipt ? await this.provider.getBlockNumber() - receipt.blockNumber : 0
      };
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async estimateGas(to: string, amount: string, data?: string): Promise<string> {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to,
        value: ethers.parseEther(amount),
        data: data || '0x',
      });
      
      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Escrow smart contract operations
  async createEscrow(params: CreateEscrowParams): Promise<{ escrowId: string; txHash: string }> {
    try {
      const contract = this.ensureContract();

      const releaseTime = Math.floor(Date.now() / 1000) + (params.releaseTimeHours * 3600);
      const amount = ethers.parseEther(params.amount);

      const tx = await (contract as any).createEscrow(
        params.payerAddress,
        params.payeeAddress,
        amount,
        releaseTime,
        { value: amount }
      );

      const receipt = await tx.wait();
      
      // Extract escrow ID from event logs
      const escrowCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('EscrowCreated(uint256,address,address,uint256)')
      );
      
      const escrowId = escrowCreatedEvent ? 
        ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], escrowCreatedEvent.data)[0].toString() : 
        '0';

      return {
        escrowId,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Failed to create escrow:', error);
      throw error;
    }
  }

  async releaseFunds(escrowId: string): Promise<string> {
    try {
      const contract = this.ensureContract();

      const tx = await (contract as any).releaseFunds(escrowId);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to release funds:', error);
      throw error;
    }
  }

  async refundFunds(escrowId: string): Promise<string> {
    try {
      const contract = this.ensureContract();

      const tx = await (contract as any).refundFunds(escrowId);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('Failed to refund funds:', error);
      throw error;
    }
  }

  async getEscrowDetails(escrowId: string): Promise<EscrowDetails> {
    try {
      const contract = this.ensureContract();

      const details = await (contract as any).getEscrowDetails(escrowId);
      
      return {
        payer: details[0],
        payee: details[1],
        amount: ethers.formatEther(details[2]),
        releaseTime: Number(details[3]),
        released: details[4],
        refunded: details[5]
      };
    } catch (error) {
      console.error('Failed to get escrow details:', error);
      throw error;
    }
  }

  // Utility methods
  async getCurrentBlock(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Failed to get current block:', error);
      throw error;
    }
  }

  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }

  // Event listening
  async listenToEscrowEvents(callback: (event: any) => void): Promise<void> {
    try {
      const contract = this.ensureContract();

      (contract as any).on('*', (event: any) => {
        callback(event);
      });
    } catch (error) {
      console.error('Failed to listen to escrow events:', error);
      throw error;
    }
  }

  // Convert between units
  weiToEth(wei: string): string {
    return ethers.formatEther(wei);
  }

  ethToWei(eth: string): string {
    return ethers.parseEther(eth).toString();
  }

  gweiToWei(gwei: string): string {
    return ethers.parseUnits(gwei, 'gwei').toString();
  }

  weiToGwei(wei: string): string {
    return ethers.formatUnits(wei, 'gwei');
  }
}

export default BlockchainService;
