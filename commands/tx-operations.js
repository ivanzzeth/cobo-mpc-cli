import CoboWaas2 from '@cobo/cobo-waas2';

/**
 * Initialize the Cobo API client
 */
function initClient() {
  const privateKey = process.env.COBO_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Private key is required. Set COBO_PRIVATE_KEY env var or use -k option.');
  }

  const apiClient = CoboWaas2.ApiClient.instance;

  // Set environment
  const env = process.env.COBO_ENV || 'prod';
  if (env === 'dev') {
    apiClient.setEnv(CoboWaas2.Env.DEV);
  } else {
    apiClient.setEnv(CoboWaas2.Env.PROD);
  }

  // Set private key
  apiClient.setPrivateKey(privateKey);

  return new CoboWaas2.TransactionsApi();
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toISOString();
}

/**
 * Format transaction for display
 */
function formatTransaction(tx) {
  return {
    'Transaction ID': tx.transaction_id || 'N/A',
    'Cobo ID': tx.cobo_id || 'N/A',
    'Request ID': tx.request_id || 'N/A',
    'Type': tx.type || 'N/A',
    'Status': tx.status || 'N/A',
    'Sub Status': tx.sub_status || 'N/A',
    'Chain ID': tx.chain_id || 'N/A',
    'Token ID': tx.token_id || 'N/A',
    'Created': formatTimestamp(tx.created_timestamp),
    'Updated': formatTimestamp(tx.updated_timestamp),
    'Hash': tx.transaction_hash || 'Pending',
  };
}

/**
 * List all transactions
 */
export async function listTransactions(options) {
  const apiInstance = initClient();

  const opts = {
    limit: parseInt(options.limit) || 10,
    direction: options.direction || 'DESC',
  };

  // Add optional filters
  if (options.statuses) opts.statuses = options.statuses;
  if (options.types) opts.types = options.types;
  if (options.walletIds) opts.wallet_ids = options.walletIds;
  if (options.chainIds) opts.chain_ids = options.chainIds;
  if (options.transactionIds) opts.transaction_ids = options.transactionIds;
  if (options.requestId) opts.request_id = options.requestId;
  if (options.before) opts.before = options.before;
  if (options.after) opts.after = options.after;

  console.log('Fetching transactions...\n');

  const data = await apiInstance.listTransactions(opts);

  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (!data.data || data.data.length === 0) {
    console.log('No transactions found.');
    return;
  }

  console.log(`Found ${data.data.length} transactions:\n`);

  // Display as table
  const formattedTxs = data.data.map(formatTransaction);
  console.table(formattedTxs);

  // Show pagination info
  if (data.pagination) {
    console.log('\nPagination:');
    console.log(`  Total Count: ${data.pagination.total_count || 'N/A'}`);
    if (data.pagination.before) {
      console.log(`  Before cursor: ${data.pagination.before.substring(0, 20)}...`);
    }
    if (data.pagination.after) {
      console.log(`  After cursor: ${data.pagination.after.substring(0, 20)}...`);
    }
  }
}

/**
 * Cancel a transaction
 */
export async function cancelTransaction(transactionId) {
  const apiInstance = initClient();

  console.log(`Canceling transaction: ${transactionId}...\n`);

  const result = await apiInstance.cancelTransactionById(transactionId);

  console.log('Transaction cancellation submitted successfully!\n');
  console.log('Result:');
  console.log(`  Request ID: ${result.request_id}`);
  console.log(`  Transaction ID: ${result.transaction_id}`);
  console.log(`  Status: ${result.status}`);

  return result;
}

/**
 * Drop a transaction using RBF
 */
export async function dropTransaction(transactionId, options) {
  const apiInstance = initClient();

  // Generate a unique request ID
  const requestId = `drop-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Build fee object based on fee type
  let fee;

  switch (options.feeType) {
    case 'EVM_EIP_1559':
      if (!options.maxFee || !options.priorityFee) {
        throw new Error('EVM_EIP_1559 requires --max-fee and --priority-fee options');
      }
      fee = {
        fee_type: 'EVM_EIP_1559',
        max_fee_per_gas: options.maxFee,
        max_priority_fee_per_gas: options.priorityFee,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      break;

    case 'EVM_Legacy':
      if (!options.gasPrice) {
        throw new Error('EVM_Legacy requires --gas-price option');
      }
      fee = {
        fee_type: 'EVM_Legacy',
        gas_price: options.gasPrice,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      break;

    case 'Fixed':
      fee = {
        fee_type: 'Fixed',
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      break;

    default:
      throw new Error(`Unknown fee type: ${options.feeType}. Use EVM_EIP_1559, EVM_Legacy, or Fixed`);
  }

  const transactionRbf = {
    request_id: requestId,
    fee: fee,
  };

  console.log(`Dropping transaction: ${transactionId}...\n`);
  console.log('RBF Parameters:');
  console.log(`  Request ID: ${requestId}`);
  console.log(`  Fee Type: ${options.feeType}`);
  if (options.maxFee) console.log(`  Max Fee: ${options.maxFee}`);
  if (options.priorityFee) console.log(`  Priority Fee: ${options.priorityFee}`);
  if (options.gasPrice) console.log(`  Gas Price: ${options.gasPrice}`);
  if (options.tokenId) console.log(`  Token ID: ${options.tokenId}`);
  console.log('');

  const result = await apiInstance.dropTransactionById(transactionId, { transactionRbf });

  console.log('Transaction drop submitted successfully!\n');
  console.log('Result:');
  console.log(`  Request ID: ${result.request_id}`);
  console.log(`  Transaction ID: ${result.transaction_id}`);
  console.log(`  Status: ${result.status}`);

  return result;
}

/**
 * Speed up a transaction using RBF
 */
export async function speedupTransaction(transactionId, options) {
  const apiInstance = initClient();

  // Generate a unique request ID
  const requestId = `speedup-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Build fee object based on fee type
  let fee;

  switch (options.feeType) {
    case 'EVM_EIP_1559':
      if (!options.maxFee || !options.priorityFee) {
        throw new Error('EVM_EIP_1559 requires --max-fee and --priority-fee options');
      }
      fee = {
        fee_type: 'EVM_EIP_1559',
        max_fee_per_gas: options.maxFee,
        max_priority_fee_per_gas: options.priorityFee,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      if (options.gasLimit) fee.gas_limit = options.gasLimit;
      break;

    case 'EVM_Legacy':
      if (!options.gasPrice) {
        throw new Error('EVM_Legacy requires --gas-price option');
      }
      fee = {
        fee_type: 'EVM_Legacy',
        gas_price: options.gasPrice,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      if (options.gasLimit) fee.gas_limit = options.gasLimit;
      break;

    case 'Fixed':
      if (!options.tokenId) {
        throw new Error('Fixed fee type requires --token-id option');
      }
      fee = {
        fee_type: 'Fixed',
        token_id: options.tokenId,
      };
      if (options.maxFeeAmount) fee.max_fee_amount = options.maxFeeAmount;
      break;

    case 'UTXO':
      if (!options.tokenId) {
        throw new Error('UTXO fee type requires --token-id option');
      }
      fee = {
        fee_type: 'UTXO',
        token_id: options.tokenId,
      };
      if (options.feeRate) fee.fee_rate = options.feeRate;
      if (options.maxFeeAmount) fee.max_fee_amount = options.maxFeeAmount;
      break;

    case 'SOL':
      if (!options.computeUnitPrice || !options.computeUnitLimit) {
        throw new Error('SOL fee type requires --compute-unit-price and --compute-unit-limit options');
      }
      fee = {
        fee_type: 'SOL',
        compute_unit_price: options.computeUnitPrice,
        compute_unit_limit: options.computeUnitLimit,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      break;

    case 'FIL':
      if (!options.gasFeeCap || !options.gasPremium) {
        throw new Error('FIL fee type requires --gas-fee-cap and --gas-premium options');
      }
      fee = {
        fee_type: 'FIL',
        gas_fee_cap: options.gasFeeCap,
        gas_premium: options.gasPremium,
      };
      if (options.tokenId) fee.token_id = options.tokenId;
      if (options.gasLimit) fee.gas_limit = options.gasLimit;
      break;

    default:
      throw new Error(`Unknown fee type: ${options.feeType}. Use EVM_EIP_1559, EVM_Legacy, Fixed, UTXO, SOL, or FIL`);
  }

  const transactionRbf = {
    request_id: requestId,
    fee: fee,
  };

  console.log(`Speeding up transaction: ${transactionId}...\n`);
  console.log('RBF Parameters:');
  console.log(`  Request ID: ${requestId}`);
  console.log(`  Fee Type: ${options.feeType}`);
  if (options.maxFee) console.log(`  Max Fee per Gas: ${options.maxFee}`);
  if (options.priorityFee) console.log(`  Priority Fee per Gas: ${options.priorityFee}`);
  if (options.gasPrice) console.log(`  Gas Price: ${options.gasPrice}`);
  if (options.gasLimit) console.log(`  Gas Limit: ${options.gasLimit}`);
  if (options.feeRate) console.log(`  Fee Rate: ${options.feeRate}`);
  if (options.maxFeeAmount) console.log(`  Max Fee Amount: ${options.maxFeeAmount}`);
  if (options.computeUnitPrice) console.log(`  Compute Unit Price: ${options.computeUnitPrice}`);
  if (options.computeUnitLimit) console.log(`  Compute Unit Limit: ${options.computeUnitLimit}`);
  if (options.gasFeeCap) console.log(`  Gas Fee Cap: ${options.gasFeeCap}`);
  if (options.gasPremium) console.log(`  Gas Premium: ${options.gasPremium}`);
  if (options.tokenId) console.log(`  Token ID: ${options.tokenId}`);
  console.log('');

  const result = await apiInstance.speedupTransactionById(transactionId, { transactionRbf });

  console.log('Transaction speedup submitted successfully!\n');
  console.log('Result:');
  console.log(`  Request ID: ${result.request_id}`);
  console.log(`  Transaction ID: ${result.transaction_id}`);
  console.log(`  Status: ${result.status}`);

  return result;
}
