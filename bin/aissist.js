#!/usr/bin/env node

import('../dist/index.js').catch((error) => {
  console.error('Error loading aissist:', error.message);
  process.exit(1);
});
