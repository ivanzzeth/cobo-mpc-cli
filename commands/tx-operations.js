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
  if (options.coboIds) opts.cobo_ids = options.coboIds;
  if (options.transactionHashes) opts.transaction_hashes = options.transactionHashes;
  if (options.tokenIds) opts.token_ids = options.tokenIds;
  if (options.assetIds) opts.asset_ids = options.assetIds;
  if (options.vaultId) opts.vault_id = options.vaultId;
  if (options.walletType) opts.wallet_type = options.walletType;
  if (options.walletSubtype) opts.wallet_subtype = options.walletSubtype;
  if (options.projectId) opts.project_id = options.projectId;
  if (options.minCreatedTimestamp) opts.min_created_timestamp = parseInt(options.minCreatedTimestamp);
  if (options.maxCreatedTimestamp) opts.max_created_timestamp = parseInt(options.maxCreatedTimestamp);
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
 * Get transaction details
 */
export async function getTransaction(transactionId, options) {
  const apiInstance = initClient();

  console.log(`Fetching transaction: ${transactionId}...\n`);

  const tx = await apiInstance.getTransactionById(transactionId);

  if (options.json) {
    console.log(JSON.stringify(tx, null, 2));
    return;
  }

  // Display basic info
  console.log('=== Basic Information ===');
  console.log(`Transaction ID: ${tx.transaction_id || 'N/A'}`);
  console.log(`Cobo ID: ${tx.cobo_id || 'N/A'}`);
  console.log(`Request ID: ${tx.request_id || 'N/A'}`);
  console.log(`Type: ${tx.type || 'N/A'}`);
  console.log(`Status: ${tx.status || 'N/A'}`);
  if (tx.sub_status) console.log(`Sub Status: ${tx.sub_status}`);
  console.log(`Created: ${formatTimestamp(tx.created_timestamp)}`);
  console.log(`Updated: ${formatTimestamp(tx.updated_timestamp)}`);
  if (tx.completed_timestamp) {
    console.log(`Completed: ${formatTimestamp(tx.completed_timestamp)}`);
  }

  // Display blockchain info
  console.log('\n=== Blockchain Information ===');
  console.log(`Chain ID: ${tx.chain_id || 'N/A'}`);
  console.log(`Token ID: ${tx.token_id || 'N/A'}`);
  console.log(`Transaction Hash: ${tx.transaction_hash || 'Pending'}`);
  if (tx.block_info) {
    console.log(`Block Height: ${tx.block_info.block_height || 'N/A'}`);
    console.log(`Block Hash: ${tx.block_info.block_hash || 'N/A'}`);
    console.log(`Block Time: ${formatTimestamp(tx.block_info.block_time)}`);
  }

  // Display source/destination
  if (tx.source) {
    console.log('\n=== Source ===');
    console.log(`Source Type: ${tx.source.source_type || 'N/A'}`);
    if (tx.source.wallet_id) console.log(`Wallet ID: ${tx.source.wallet_id}`);
    if (tx.source.address) console.log(`Address: ${tx.source.address}`);
    if (tx.source.amount) console.log(`Amount: ${tx.source.amount}`);
  }

  if (tx.destination) {
    console.log('\n=== Destination ===');
    console.log(`Destination Type: ${tx.destination.destination_type || 'N/A'}`);
    if (tx.destination.address) console.log(`Address: ${tx.destination.address}`);
    if (tx.destination.value) console.log(`Value: ${tx.destination.value}`);
    if (tx.destination.calldata) console.log(`Has Calldata: Yes (${tx.destination.calldata.length} bytes)`);
    if (tx.destination.account_output) {
      const dest = tx.destination.account_output;
      if (dest.address) console.log(`Address: ${dest.address}`);
      if (dest.amount) console.log(`Amount: ${dest.amount}`);
      if (dest.memo) console.log(`Memo: ${dest.memo}`);
    }
    if (tx.destination.utxo_outputs) {
      console.log(`UTXO Outputs: ${tx.destination.utxo_outputs.length} outputs`);
      tx.destination.utxo_outputs.forEach((utxo, idx) => {
        console.log(`  [${idx}] ${utxo.address}: ${utxo.amount}`);
      });
    }
  }

  // Display fee info
  if (tx.fee) {
    console.log('\n=== Fee Information ===');
    console.log(`Fee Type: ${tx.fee.fee_type || 'N/A'}`);
    if (tx.fee.token_id) console.log(`Token ID: ${tx.fee.token_id}`);
    if (tx.fee.fee_used) console.log(`Fee Used: ${tx.fee.fee_used}`);
    if (tx.fee.estimated_fee_used) console.log(`Estimated Fee: ${tx.fee.estimated_fee_used}`);

    // Display type-specific fee details
    switch (tx.fee.fee_type) {
      case 'EVM_EIP_1559':
        if (tx.fee.max_fee_per_gas) console.log(`Max Fee Per Gas: ${tx.fee.max_fee_per_gas} wei`);
        if (tx.fee.max_priority_fee_per_gas) console.log(`Max Priority Fee Per Gas: ${tx.fee.max_priority_fee_per_gas} wei`);
        if (tx.fee.effective_gas_price) console.log(`Effective Gas Price: ${tx.fee.effective_gas_price} wei`);
        if (tx.fee.gas_limit) console.log(`Gas Limit: ${tx.fee.gas_limit}`);
        if (tx.fee.gas_used) console.log(`Gas Used: ${tx.fee.gas_used}`);
        break;

      case 'EVM_Legacy':
        if (tx.fee.gas_price) console.log(`Gas Price: ${tx.fee.gas_price} wei`);
        if (tx.fee.gas_limit) console.log(`Gas Limit: ${tx.fee.gas_limit}`);
        if (tx.fee.gas_used) console.log(`Gas Used: ${tx.fee.gas_used}`);
        break;

      case 'UTXO':
        if (tx.fee.fee_rate) console.log(`Fee Rate: ${tx.fee.fee_rate} sat/vByte`);
        if (tx.fee.max_fee_amount) console.log(`Max Fee Amount: ${tx.fee.max_fee_amount}`);
        break;

      case 'Fixed':
        if (tx.fee.max_fee_amount) console.log(`Max Fee Amount: ${tx.fee.max_fee_amount}`);
        break;

      case 'SOL':
        if (tx.fee.base_fee) console.log(`Base Fee: ${tx.fee.base_fee} SOL`);
        if (tx.fee.rent_amount) console.log(`Rent Amount: ${tx.fee.rent_amount} SOL`);
        if (tx.fee.compute_unit_price) console.log(`Compute Unit Price: ${tx.fee.compute_unit_price}`);
        if (tx.fee.compute_unit_limit) console.log(`Compute Unit Limit: ${tx.fee.compute_unit_limit}`);
        break;

      case 'FIL':
        if (tx.fee.gas_base) console.log(`Gas Base Fee: ${tx.fee.gas_base}`);
        if (tx.fee.gas_premium) console.log(`Gas Premium: ${tx.fee.gas_premium}`);
        if (tx.fee.gas_fee_cap) console.log(`Gas Fee Cap: ${tx.fee.gas_fee_cap}`);
        if (tx.fee.gas_limit) console.log(`Gas Limit: ${tx.fee.gas_limit}`);
        break;
    }
  }

  // Display timeline
  if (tx.timeline) {
    console.log('\n=== Timeline ===');
    tx.timeline.forEach(event => {
      const timestamp = event.finished_timestamp || event.timestamp;
      const status = event.finished ? '✓' : '○';
      console.log(`${status} [${formatTimestamp(timestamp)}] ${event.status}`);
      if (event.description) console.log(`  ${event.description}`);
    });
  }

  // Display notes
  if (tx.description) {
    console.log('\n=== Notes ===');
    console.log(tx.description);
  }

  return tx;
}

/**
 * Cancel a transaction
 */
export async function cancelTransaction(transactionId) {
  const apiInstance = initClient();

  console.log(`Canceling transaction: ${transactionId}...\n`);

  try {
    const result = await apiInstance.cancelTransactionById(transactionId);

    console.log('Transaction cancellation submitted successfully!\n');
    console.log('Result:');
    console.log(`  Request ID: ${result.request_id}`);
    console.log(`  Transaction ID: ${result.transaction_id}`);
    console.log(`  Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error('\nAPI Error:', error.response?.data || error.message || error);
    throw error;
  }
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

  try {
    const result = await apiInstance.dropTransactionById(transactionId, { TransactionRbf: transactionRbf });

    console.log('Transaction drop submitted successfully!\n');
    console.log('Result:');
    console.log(`  Request ID: ${result.request_id}`);
    console.log(`  Transaction ID: ${result.transaction_id}`);
    console.log(`  Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error('\nAPI Error:', error.response?.data || error.message || error);
    throw error;
  }
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

  try {
    const result = await apiInstance.speedupTransactionById(transactionId, { TransactionRbf: transactionRbf });

    console.log('Transaction speedup submitted successfully!\n');
    console.log('Result:');
    console.log(`  Request ID: ${result.request_id}`);
    console.log(`  Transaction ID: ${result.transaction_id}`);
    console.log(`  Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error('\nAPI Error:', error.response?.data || error.message || error);
    throw error;
  }
}
