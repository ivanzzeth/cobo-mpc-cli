# cobo-mpc-cli

Modular CLI tool for Cobo MPC Wallet interaction using Cobo WaaS 2.0 API.

## Installation

```bash
npm install
npm link
```

## Configuration

Set your Cobo API credentials as environment variables:

```bash
export COBO_PRIVATE_KEY="your-api-secret-here"
export COBO_ENV="dev"  # or "prod"
```

Or use command-line options:

```bash
cobo-mpc-cli -e dev -k your-api-secret tx list
```

## Commands

### Transaction Management (`tx`)

#### List Transactions

List all transactions with optional filters:

```bash
# Basic usage
cobo-mpc-cli tx list

# With filters
cobo-mpc-cli tx list \
  --limit 20 \
  --statuses Completed,Failed \
  --types Withdrawal,Deposit \
  --chain-ids ETH,BTC

# JSON output
cobo-mpc-cli tx list --json

# Pagination
cobo-mpc-cli tx list --after "cursor-string" --limit 50
```

**Options:**
- `-l, --limit <number>` - Maximum number of transactions (default: 10)
- `-s, --statuses <statuses>` - Filter by statuses (comma-separated)
- `-t, --types <types>` - Filter by types (comma-separated)
- `-w, --wallet-ids <ids>` - Filter by wallet IDs
- `-c, --chain-ids <ids>` - Filter by chain IDs
- `--transaction-ids <ids>` - Filter by transaction IDs
- `--request-id <id>` - Filter by request ID
- `--before <cursor>` - Pagination cursor for previous page
- `--after <cursor>` - Pagination cursor for next page
- `--direction <dir>` - Sort direction: ASC or DESC (default: DESC)
- `--json` - Output as JSON

#### Get Transaction Details

Get detailed information about a specific transaction including fee breakdown:

```bash
# Formatted output with fee details
cobo-mpc-cli tx get <transaction-id>

# JSON output
cobo-mpc-cli tx get <transaction-id> --json
```

**Example:**
```bash
cobo-mpc-cli tx get f47ac10b-58cc-4372-a567-0e02b2c3d479
```

The detailed view includes:
- Basic information (ID, status, type, timestamps)
- Blockchain information (chain, token, hash, block info)
- Source and destination details
- **Fee breakdown** (gas price, gas limit, fee rate, compute units, etc.)
- Transaction timeline
- Notes and descriptions

#### Cancel Transaction

Cancel a pending transaction:

```bash
cobo-mpc-cli tx cancel <transaction-id>
```

**Example:**
```bash
cobo-mpc-cli tx cancel f47ac10b-58cc-4372-a567-0e02b2c3d479
```

#### Drop Transaction

Drop a broadcasting transaction using RBF (Replace-By-Fee):

```bash
# EVM EIP-1559
cobo-mpc-cli tx drop <transaction-id> \
  --fee-type EVM_EIP_1559 \
  --max-fee 9000000000000 \
  --priority-fee 1000000000000 \
  --token-id ETH

# EVM Legacy
cobo-mpc-cli tx drop <transaction-id> \
  --fee-type EVM_Legacy \
  --gas-price 100000000 \
  --token-id ETH

# Fixed
cobo-mpc-cli tx drop <transaction-id> \
  --fee-type Fixed \
  --token-id TRON
```

**Options:**
- `-f, --fee-type <type>` - Fee type: EVM_EIP_1559, EVM_Legacy, or Fixed (required)
- `--max-fee <amount>` - Max fee per gas (for EVM_EIP_1559)
- `--priority-fee <amount>` - Priority fee per gas (for EVM_EIP_1559)
- `--gas-price <amount>` - Gas price (for EVM_Legacy)
- `--token-id <id>` - Token ID for fee (e.g., ETH)

#### Speed Up Transaction

Speed up a broadcasting transaction using RBF (Replace-By-Fee):

```bash
# EVM EIP-1559
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type EVM_EIP_1559 \
  --max-fee 12000000000000 \
  --priority-fee 2000000000000 \
  --token-id ETH \
  --gas-limit 21000

# EVM Legacy
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type EVM_Legacy \
  --gas-price 150000000 \
  --token-id ETH \
  --gas-limit 21000

# UTXO (Bitcoin)
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type UTXO \
  --fee-rate 100 \
  --token-id BTC

# Solana
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type SOL \
  --compute-unit-price 0.0001 \
  --compute-unit-limit 200000 \
  --token-id SOL

# Filecoin
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type FIL \
  --gas-fee-cap 0.00035 \
  --gas-premium 0.0001 \
  --gas-limit 500 \
  --token-id FIL

# Fixed
cobo-mpc-cli tx speedup <transaction-id> \
  --fee-type Fixed \
  --token-id TRON \
  --max-fee-amount 0.1
```

**Options:**
- `-f, --fee-type <type>` - Fee type: EVM_EIP_1559, EVM_Legacy, Fixed, UTXO, SOL, or FIL (required)
- `--max-fee <amount>` - Max fee per gas (for EVM_EIP_1559)
- `--priority-fee <amount>` - Priority fee per gas (for EVM_EIP_1559)
- `--gas-price <amount>` - Gas price (for EVM_Legacy)
- `--gas-limit <amount>` - Gas limit (for EVM transactions)
- `--fee-rate <rate>` - Fee rate in sat/vByte (for UTXO)
- `--max-fee-amount <amount>` - Max fee amount (for Fixed/UTXO)
- `--compute-unit-price <price>` - Compute unit price (for SOL)
- `--compute-unit-limit <limit>` - Compute unit limit (for SOL)
- `--gas-fee-cap <cap>` - Gas fee cap (for FIL)
- `--gas-premium <premium>` - Gas premium (for FIL)
- `--token-id <id>` - Token ID for fee (e.g., ETH, BTC, SOL)

## Fee Models

The CLI supports multiple fee models for different blockchain types:

### EVM_EIP_1559
Used for Ethereum and EVM-compatible chains that support EIP-1559:
- `max_fee_per_gas`: Maximum gas fee per unit (in wei)
- `max_priority_fee_per_gas`: Maximum priority fee (miner tip) per unit (in wei)
- `gas_limit`: Maximum gas units allowed

### EVM_Legacy
Used for older EVM chains or chains that don't support EIP-1559:
- `gas_price`: Gas price in wei
- `gas_limit`: Maximum gas units allowed

### UTXO
Used for Bitcoin and UTXO-based chains:
- `fee_rate`: Fee rate in satoshis per virtual byte (sat/vByte)
- `max_fee_amount`: Maximum total fee willing to pay

### SOL
Used for Solana:
- `compute_unit_price`: Price paid per compute unit (determines priority)
- `compute_unit_limit`: Maximum compute units allowed

### FIL
Used for Filecoin:
- `gas_fee_cap`: Maximum gas price per unit
- `gas_premium`: Priority fee to incentivize miners
- `gas_limit`: Maximum gas units allowed

### Fixed
Used for chains with fixed transaction fees (e.g., TRON):
- `token_id`: Token used to pay the fee
- `max_fee_amount`: Maximum fee willing to pay (optional)

## Transaction Statuses

- `Submitted` - Transaction submitted to Cobo
- `PendingScreening` - Awaiting risk screening
- `PendingAuthorization` - Awaiting authorization
- `PendingSignature` - Awaiting signature
- `Broadcasting` - Being broadcast to the blockchain
- `Confirming` - Awaiting blockchain confirmations
- `Completed` - Successfully completed
- `Failed` - Transaction failed
- `Rejected` - Transaction was rejected
- `Pending` - Generic pending state

## Environment

- **Development**: `https://api.dev.cobo.com/v2`
- **Production**: `https://api.cobo.com/v2`

Set environment with:
```bash
export COBO_ENV="dev"  # or "prod"
```

Or use the `-e` flag:
```bash
cobo-mpc-cli -e prod tx list
```

## Resources

- [Cobo WaaS 2.0 Documentation](https://www.cobo.com/developers/v2)
- [Transaction Management Guide](https://www.cobo.com/developers/v2/guides/transactions/manage-transactions)
- [Fee Models Guide](https://www.cobo.com/developers/v2/guides/transactions/estimate-fees)
- [Cobo WaaS Skill for AI Assistants](https://www.cobo.com/developers/v2/guides/overview/cobo-waas-skill)

## License

MIT
