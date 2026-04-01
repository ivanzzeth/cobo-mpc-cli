import { Command } from 'commander';
import { listTransactions, cancelTransaction, dropTransaction } from './tx-operations.js';

export function createTxCommand() {
  const txCommand = new Command('tx')
    .description('Transaction management commands');

  // List transactions command
  txCommand
    .command('list')
    .description('List all transactions with optional filters')
    .option('-l, --limit <number>', 'Maximum number of transactions to return', '10')
    .option('-s, --statuses <statuses>', 'Filter by statuses (comma-separated): Submitted,PendingScreening,PendingAuthorization,PendingSignature,Broadcasting,Confirming,Completed,Failed,Rejected')
    .option('-t, --types <types>', 'Filter by types (comma-separated): Deposit,Withdrawal,ContractCall,MessageSign,ExternalSafeTx,Stake,Unstake')
    .option('-w, --wallet-ids <ids>', 'Filter by wallet IDs (comma-separated)')
    .option('-c, --chain-ids <ids>', 'Filter by chain IDs (comma-separated)')
    .option('--transaction-ids <ids>', 'Filter by transaction IDs (comma-separated)')
    .option('--request-id <id>', 'Filter by request ID')
    .option('--before <cursor>', 'Pagination cursor for previous page')
    .option('--after <cursor>', 'Pagination cursor for next page')
    .option('--direction <dir>', 'Sort direction: ASC or DESC', 'DESC')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        await listTransactions(options);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // Cancel transaction command
  txCommand
    .command('cancel <transactionId>')
    .description('Cancel a pending transaction')
    .action(async (transactionId) => {
      try {
        await cancelTransaction(transactionId);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  // Drop transaction command
  txCommand
    .command('drop <transactionId>')
    .description('Drop a broadcasting transaction using RBF (Replace-By-Fee)')
    .requiredOption('-f, --fee-type <type>', 'Fee type: EVM_EIP_1559, EVM_Legacy, or Fixed')
    .option('--max-fee <amount>', 'Max fee per gas (for EVM_EIP_1559)')
    .option('--priority-fee <amount>', 'Priority fee per gas (for EVM_EIP_1559)')
    .option('--gas-price <amount>', 'Gas price (for EVM_Legacy)')
    .option('--token-id <id>', 'Token ID for fee (e.g., ETH)')
    .action(async (transactionId, options) => {
      try {
        await dropTransaction(transactionId, options);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  return txCommand;
}
