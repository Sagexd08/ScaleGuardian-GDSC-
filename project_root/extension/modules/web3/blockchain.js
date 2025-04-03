/**
 * Blockchain Interaction Module
 * 
 * This module provides functionality to interact with blockchain networks
 * including Ethereum, Polygon, and others via Web3.js. It handles contract 
 * interactions, transaction management, and wallet connectivity.
 */

class BlockchainService {
  /**
   * Initialize the blockchain service
   * @param {Object} options - Configuration options
   * @param {Object} options.web3Provider - Web3 provider instance or URL
   * @param {Object} options.contracts - Map of contract names to ABIs and addresses
   * @param {string} options.defaultNetwork - Default network to connect to ('mainnet', 'polygon', 'mumbai', etc.)
   * @param {boolean} options.autoConnect - Whether to automatically connect to wallet
   */
  constructor(options = {}) {
    this.web3 = null;
    this.provider = null;
    this.contracts = new Map();
    this.accounts = [];
    this.currentAccount = null;
    this.isConnected = false;
    this.networkId = null;
    this.networkName = null;
    
    // Configuration options
    this.options = {
      web3Provider: options.web3Provider || null,
      contracts: options.contracts || {},
      defaultNetwork: options.defaultNetwork || 'mainnet',
      autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
      gasLimit: options.gasLimit || 3000000,
      gasPrice: options.gasPrice || null, // null means use network estimate
      maxPriorityFeePerGas: options.maxPriorityFeePerGas || null, // for EIP-1559
      maxFeePerGas: options.maxFeePerGas || null, // for EIP-1559
      transactionTimeout: options.transactionTimeout || 60000 // ms
    };
    
    // Event handlers
    this.eventHandlers = {
      connect: [],
      disconnect: [],
      accountsChanged: [],
      chainChanged: [],
      error: []
    };
    
    // Initialize if auto-connect is enabled
    if (this.options.autoConnect) {
      this.initialize();
    }
  }

  /**
   * Initialize the blockchain service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Load Web3.js dynamically if not available
      if (typeof Web3 === 'undefined' && typeof window !== 'undefined') {
        // In a real implementation, you might want to load from a CDN or local file
        // This is just a placeholder for demonstration
        console.log('Web3 not found, attempting to load dynamically');
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/web3/1.7.4/web3.min.js');
      }
      
      // Connect to provider
      await this.connectProvider();
      
      // Initialize contracts
      this.initializeContracts();
      
      return true;
    } catch (error) {
      this.handleError('Initialization failed', error);
      return false;
    }
  }

  /**
   * Connect to a Web3 provider
   * @param {string|Object} [customProvider] - Optional custom provider to use
   * @returns {Promise<boolean>} - Whether connection was successful
   */
  async connectProvider(customProvider = null) {
    try {
      let provider = customProvider || this.options.web3Provider;
      
      // If no provider specified, try to use window.ethereum
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        provider = window.ethereum;
      }
      
      // If still no provider, use a public provider based on the default network
      if (!provider) {
        provider = this.getPublicProvider(this.options.defaultNetwork);
      }
      
      // Create Web3 instance
      if (typeof Web3 !== 'undefined') {
        this.web3 = new Web3(provider);
      } else {
        throw new Error('Web3 is not available');
      }
      
      // Store provider reference
      this.provider = provider;
      
      // If provider has enable method (EIP-1102), request account access
      if (provider.request) {
        try {
          this.accounts = await provider.request({ method: 'eth_requestAccounts' });
          this.currentAccount = this.accounts[0];
          this.isConnected = true;
          
          // Get network ID
          this.networkId = await this.web3.eth.net.getId();
          this.networkName = this.getNetworkName(this.networkId);
          
          // Subscribe to provider events
          this.subscribeToProviderEvents();
          
          // Trigger connect event
          this.triggerEvent('connect', {
            accounts: this.accounts,
            networkId: this.networkId,
            networkName: this.networkName
          });
          
          return true;
        } catch (error) {
          // User rejected request
          this.handleError('User rejected connection', error);
          return false;
        }
      } else {
        // Legacy providers
        try {
          this.accounts = await this.web3.eth.getAccounts();
          this.currentAccount = this.accounts[0];
          this.isConnected = !!this.currentAccount;
          
          // Get network ID
          this.networkId = await this.web3.eth.net.getId();
          this.networkName = this.getNetworkName(this.networkId);
          
          // Trigger connect event if accounts are available
          if (this.isConnected) {
            this.triggerEvent('connect', {
              accounts: this.accounts,
              networkId: this.networkId,
              networkName: this.networkName
            });
          }
          
          return this.isConnected;
        } catch (error) {
          this.handleError('Failed to connect to network', error);
          return false;
        }
      }
    } catch (error) {
      this.handleError('Provider connection failed', error);
      return false;
    }
  }

  /**
   * Get a public provider URL for the specified network
   * @private
   * @param {string} network - Network name
   * @returns {string} - Provider URL
   */
  getPublicProvider(network) {
    // This would typically use environment variables or configuration
    // Here we're just providing some examples
    const providers = {
      mainnet: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      ropsten: 'https://ropsten.infura.io/v3/YOUR_INFURA_KEY',
      rinkeby: 'https://rinkeby.infura.io/v3/YOUR_INFURA_KEY',
      goerli: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
      polygon: 'https://polygon-rpc.com',
      mumbai: 'https://rpc-mumbai.maticvigil.com'
    };
    
    return providers[network.toLowerCase()] || providers.mainnet;
  }

  /**
   * Get network name from network ID
   * @private
   * @param {number} networkId - Network ID
   * @returns {string} - Network name
   */
  getNetworkName(networkId) {
    const networks = {
      1: 'mainnet',
      3: 'ropsten',
      4: 'rinkeby',
      5: 'goerli',
      42: 'kovan',
      56: 'bsc',
      97: 'bsc-testnet',
      137: 'polygon',
      80001: 'mumbai'
    };
    
    return networks[networkId] || `unknown-${networkId}`;
  }

  /**
   * Subscribe to provider events
   * @private
   */
  subscribeToProviderEvents() {
    if (!this.provider || !this.provider.on) return;
    
    // Handle account changes
    this.provider.on('accountsChanged', (accounts) => {
      this.accounts = accounts;
      this.currentAccount = accounts[0] || null;
      this.isConnected = !!this.currentAccount;
      
      this.triggerEvent('accountsChanged', {
        accounts: this.accounts,
        currentAccount: this.currentAccount
      });
    });
    
    // Handle chain/network changes
    this.provider.on('chainChanged', async (chainId) => {
      // chainId is a hex string, convert to number
      this.networkId = parseInt(chainId, 16);
      this.networkName = this.getNetworkName(this.networkId);
      
      // Reload contracts for the new network
      this.initializeContracts();
      
      this.triggerEvent('chainChanged', {
        networkId: this.networkId,
        networkName: this.networkName
      });
    });
    
    // Handle disconnect
    this.provider.on('disconnect', (error) => {
      this.isConnected = false;
      this.triggerEvent('disconnect', { error });
    });
  }

  /**
   * Initialize contract instances
   * @private
   */
  initializeContracts() {
    if (!this.web3 || !this.options.contracts) return;
    
    // Clear existing contracts
    this.contracts.clear();
    
    // Create contract instances
    Object.entries(this.options.contracts).forEach(([name, contractInfo]) => {
      try {
        // Check if we have ABI and address for the current network
        const { abi, networks } = contractInfo;
        
        if (!abi) {
          console.warn(`Missing ABI for contract ${name}`);
          return;
        }
        
        // Get address for current network
        const address = networks && this.networkId 
          ? networks[this.networkId] 
          : contractInfo.address;
        
        if (!address) {
          console.warn(`No address found for contract ${name} on network ${this.networkId}`);
          return;
        }
        
        // Create contract instance
        const contract = new this.web3.eth.Contract(abi, address);
        this.contracts.set(name, contract);
      } catch (error) {
        console.error(`Failed to initialize contract ${name}:`, error);
      }
    });
  }

  /**
   * Call a read-only contract method
   * @param {string} contractName - Name of the contract
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @returns {Promise<any>} - Method result
   */
  async callMethod(contractName, method, args = []) {
    const contract = this.contracts.get(contractName);
    
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} not found on contract ${contractName}`);
    }
    
    try {
      return await contract.methods[method](...args).call();
    } catch (error) {
      this.handleError(`Error calling ${method} on ${contractName}`, error);
      throw error;
    }
  }

  /**
   * Send a transaction to a contract method
   * @param {string} contractName - Name of the contract
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} - Transaction receipt
   */
  async sendTransaction(contractName, method, args = [], options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to wallet');
    }
    
    const contract = this.contracts.get(contractName);
    
    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }
    
    if (!contract.methods[method]) {
      throw new Error(`Method ${method} not found on contract ${contractName}`);
    }
    
    const from = options.from || this.currentAccount;
    
    if (!from) {
      throw new Error('No sender address provided');
    }
    
    // Prepare transaction options
    const txOptions = {
      from,
      gasLimit: options.gasLimit || this.options.gasLimit
    };
    
    // Add gas price if specified
    if (options.gasPrice || this.options.gasPrice) {
      txOptions.gasPrice = options.gasPrice || this.options.gasPrice;
    }
    
    // Add EIP-1559 parameters if specified
    if (options.maxFeePerGas || this.options.maxFeePerGas) {
      txOptions.maxFeePerGas = options.maxFeePerGas || this.options.maxFeePerGas;
    }
    
    if (options.maxPriorityFeePerGas || this.options.maxPriorityFeePerGas) {
      txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas || this.options.maxPriorityFeePerGas;
    }
    
    // Add value if specified
    if (options.value) {
      txOptions.value = options.value;
    }
    
    try {
      // Estimate gas if not specified
      if (!txOptions.gasLimit) {
        txOptions.gasLimit = await contract.methods[method](...args).estimateGas({ from });
      }
      
      // Send transaction
      const transaction = contract.methods[method](...args).send(txOptions);
      
      // Set up timeout if specified
      let timeoutId = null;
      if (this.options.transactionTimeout) {
        timeoutId = setTimeout(() => {
          transaction.emit('error', new Error('Transaction timeout'));
        }, this.options.transactionTimeout);
      }
      
      // Wait for transaction to complete
      const receipt = await transaction;
      
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      return receipt;
    } catch (error) {
      this.handleError(`Error sending ${method} transaction to ${contractName}`, error);
      throw error;
    }
  }

  /**
   * Get the balance of an account
   * @param {string} [address] - Address to check (defaults to current account)
   * @returns {Promise<string>} - Balance in ETH
   */
  async getBalance(address) {
    const account = address || this.currentAccount;
    
    if (!account) {
      throw new Error('No account specified');
    }
    
    try {
      const balanceWei = await this.web3.eth.getBalance(account);
      return this.web3.utils.fromWei(balanceWei, 'ether');
    } catch (error) {
      this.handleError('Error getting balance', error);
      throw error;
    }
  }

  /**
   * Send ETH to an address
   * @param {string} to - Recipient address
   * @param {string|number} amount - Amount in ETH
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} - Transaction receipt
   */
  async sendEth(to, amount, options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to wallet');
    }
    
    const from = options.from || this.currentAccount;
    
    if (!from) {
      throw new Error('No sender address provided');
    }
    
    // Convert amount to wei
    const value = this.web3.utils.toWei(amount.toString(), 'ether');
    
    // Prepare transaction options
    const txOptions = {
      from,
      to,
      value,
      gasLimit: options.gasLimit || this.options.gasLimit
    };
    
    // Add gas price if specified
    if (options.gasPrice || this.options.gasPrice) {
      txOptions.gasPrice = options.gasPrice || this.options.gasPrice;
    }
    
    // Add EIP-1559 parameters if specified
    if (options.maxFeePerGas || this.options.maxFeePerGas) {
      txOptions.maxFeePerGas = options.maxFeePerGas || this.options.maxFeePerGas;
    }
    
    if (options.maxPriorityFeePerGas || this.options.maxPriorityFeePerGas) {
      txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas || this.options.maxPriorityFeePerGas;
    }
    
    try {
      // Send transaction
      return await this.web3.eth.sendTransaction(txOptions);
    } catch (error) {
      this.handleError('Error sending ETH', error);
      throw error;
    }
  }

  /**
   * Disconnect from the provider
   */
  disconnect() {
    this.isConnected = false;
    this.currentAccount = null;
    this.accounts = [];
    
    // Trigger disconnect event
    this.triggerEvent('disconnect', {});
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler to remove
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  /**
   * Trigger an event
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }

  /**
   * Handle and log errors
   * @private
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  handleError(message, error) {
    console.error(`${message}:`, error);
    this.triggerEvent('error', { message, error });
  }

  /**
   * Load a script dynamically
   * @private
   * @param {string} src - Script URL
   * @returns {Promise<void>} - Promise that resolves when script is loaded
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
}

export default BlockchainService;