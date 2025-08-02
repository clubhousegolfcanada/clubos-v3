#!/usr/bin/env node
/**
 * Environment validation script
 * Ensures all required environment variables are set
 */

require('dotenv').config();

const REQUIRED_VARS = [
  { name: 'DATABASE_URL', pattern: /^postgres(ql)?:\/\/.+/, message: 'PostgreSQL connection string' },
  { name: 'JWT_SECRET', minLength: 32, message: 'JWT signing secret (min 32 chars)' },
  { name: 'OPENAI_API_KEY', pattern: /^sk-/, message: 'OpenAI API key' }
];

const OPTIONAL_VARS = [
  { name: 'PORT', type: 'number', default: '3001' },
  { name: 'NODE_ENV', values: ['development', 'production', 'test'], default: 'development' },
  { name: 'SLACK_WEBHOOK_URL', pattern: /^https:\/\/hooks\.slack\.com/ },
  { name: 'ANTHROPIC_API_KEY', pattern: /^sk-ant-/ },
  { name: 'FRONTEND_URL', pattern: /^https?:\/\// }
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('Required variables:');
for (const varDef of REQUIRED_VARS) {
  const value = process.env[varDef.name];
  
  if (!value) {
    console.error(`❌ ${varDef.name} - Not set (${varDef.message})`);
    hasErrors = true;
    continue;
  }
  
  if (varDef.pattern && !varDef.pattern.test(value)) {
    console.error(`❌ ${varDef.name} - Invalid format (${varDef.message})`);
    hasErrors = true;
    continue;
  }
  
  if (varDef.minLength && value.length < varDef.minLength) {
    console.error(`❌ ${varDef.name} - Too short (${varDef.message})`);
    hasErrors = true;
    continue;
  }
  
  console.log(`✅ ${varDef.name} - Set`);
}

// Check optional variables
console.log('\nOptional variables:');
for (const varDef of OPTIONAL_VARS) {
  const value = process.env[varDef.name];
  
  if (!value) {
    if (varDef.default) {
      console.log(`⚪ ${varDef.name} - Not set (using default: ${varDef.default})`);
    } else {
      console.log(`⚪ ${varDef.name} - Not set`);
    }
    continue;
  }
  
  if (varDef.type === 'number' && isNaN(value)) {
    console.error(`❌ ${varDef.name} - Invalid number`);
    hasErrors = true;
    continue;
  }
  
  if (varDef.values && !varDef.values.includes(value)) {
    console.error(`❌ ${varDef.name} - Invalid value (must be one of: ${varDef.values.join(', ')})`);
    hasErrors = true;
    continue;
  }
  
  if (varDef.pattern && !varDef.pattern.test(value)) {
    console.error(`❌ ${varDef.name} - Invalid format`);
    hasErrors = true;
    continue;
  }
  
  console.log(`✅ ${varDef.name} - Set`);
}

// Additional checks
console.log('\nAdditional checks:');

// Check database URL is accessible
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`✅ Database URL - Valid format (${url.hostname})`);
  } catch (e) {
    console.error('❌ Database URL - Invalid URL format');
    hasErrors = true;
  }
}

// Check for common mistakes
if (process.env.JWT_SECRET === 'your-secret-key-here') {
  console.error('❌ JWT_SECRET - Using default value! Please generate a secure secret');
  hasErrors = true;
}

if (process.env.OPENAI_API_KEY === 'sk-your-openai-key') {
  console.error('❌ OPENAI_API_KEY - Using placeholder value!');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ Environment validation failed!');
  console.error('Please fix the errors above and try again.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
  process.exit(0);
}