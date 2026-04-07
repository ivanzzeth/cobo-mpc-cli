#!/usr/bin/env node

import { program } from 'commander';
import 'dotenv/config';
import { createTxCommand } from './commands/tx.js';

program
  .name('cobo-mpc-cli')
  .description('Modular CLI tool for Cobo MPC Wallet interaction')
  .version('0.0.1')
  .option('-e, --env <environment>', 'Environment: dev or prod', 'prod')
  .option('-k, --private-key <key>', 'Cobo API private key (or set COBO_PRIVATE_KEY env var)')
  .hook('preAction', (thisCommand, actionCommand) => {
    // Set environment variable for commands
    const options = thisCommand.opts();
    if (options.privateKey) {
      process.env.COBO_PRIVATE_KEY = options.privateKey;
    }
    process.env.COBO_ENV = options.env;
  });

// Add tx subcommand
program.addCommand(createTxCommand());

program.parse();
