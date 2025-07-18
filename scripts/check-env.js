#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 用于检查 .env 文件中的配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('red', '❌ .env 文件不存在');
    log('yellow', '💡 请复制 .env.example 到 .env 并配置相应的值');
    return false;
  }
  
  log('green', '✅ .env 文件存在');
  return true;
}

function validateBase58(str) {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(str);
}

function validateSolanaPrivateKey(privateKey) {
  if (!privateKey) {
    return { valid: false, error: '私钥为空' };
  }
  
  if (!validateBase58(privateKey)) {
    return { valid: false, error: '不是有效的 base58 格式' };
  }
  
  try {
    const bs58 = require('bs58');
    // 处理不同的 bs58 导出方式
    const decode = bs58.decode || bs58.default?.decode || bs58;
    const decoded = decode(privateKey);
    
    if (decoded.length !== 64) {
      return { valid: false, error: `私钥长度错误，期望64字节，实际${decoded.length}字节` };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `解码失败: ${error.message}` };
  }
}

function validateSolanaAddress(address) {
  if (!address) {
    return { valid: false, error: '地址为空' };
  }
  
  if (!validateBase58(address)) {
    return { valid: false, error: '不是有效的 base58 格式' };
  }
  
  if (address.length < 32 || address.length > 44) {
    return { valid: false, error: '地址长度不正确' };
  }
  
  return { valid: true };
}

function validateUrl(url) {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: '不是有效的 URL 格式' };
  }
}

function checkEnvironmentVariables() {
  require('dotenv').config();
  
  const requiredVars = [
    { name: 'PORT', validator: (val) => !isNaN(parseInt(val)) ? { valid: true } : { valid: false, error: '不是有效的端口号' } },
    { name: 'SOLANA_RPC_URL', validator: validateUrl },
    { name: 'OKX_API_KEY', validator: (val) => val ? { valid: true } : { valid: false, error: '不能为空' } },
    { name: 'OKX_SECRET_KEY', validator: (val) => val ? { valid: true } : { valid: false, error: '不能为空' } },
    { name: 'OKX_API_PASSPHRASE', validator: (val) => val ? { valid: true } : { valid: false, error: '不能为空' } },
    { name: 'OKX_PROJECT_ID', validator: (val) => val ? { valid: true } : { valid: false, error: '不能为空' } },
    { name: 'SOLANA_PRIVATE_KEY', validator: validateSolanaPrivateKey },
    { name: 'SOLANA_WALLET_ADDRESS', validator: validateSolanaAddress }
  ];
  
  let allValid = true;
  
  log('blue', '\n🔍 检查环境变量...\n');
  
  for (const { name, validator } of requiredVars) {
    const value = process.env[name];
    const result = validator(value);
    
    if (result.valid) {
      log('green', `✅ ${name}: 有效`);
    } else {
      log('red', `❌ ${name}: ${result.error}`);
      allValid = false;
    }
  }
  
  return allValid;
}

function generateExampleKeys() {
  log('blue', '\n📝 生成示例配置...\n');
  
  // 生成示例 Solana 密钥对
  try {
    const { Keypair } = require('@solana/web3.js');
    const bs58 = require('bs58');
    
    const keypair = Keypair.generate();
    // 处理不同的 bs58 导出方式
    const encode = bs58.encode || bs58.default?.encode || bs58;
    const privateKey = encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toString();
    
    log('yellow', '⚠️  以下是示例密钥对，仅用于测试，请勿在生产环境使用：');
    log('blue', `SOLANA_PRIVATE_KEY=${privateKey}`);
    log('blue', `SOLANA_WALLET_ADDRESS=${publicKey}`);
    
  } catch (error) {
    log('red', '❌ 无法生成示例密钥对，请确保已安装 @solana/web3.js 和 bs58');
  }
}

function main() {
  log('blue', '🚀 RushX Server 环境配置检查工具\n');
  
  if (!checkEnvFile()) {
    return;
  }
  
  try {
    require('dotenv');
    require('bs58');
    require('@solana/web3.js');
  } catch (error) {
    log('red', '❌ 缺少必要的依赖包，请运行: pnpm install');
    return;
  }
  
  const isValid = checkEnvironmentVariables();
  
  if (isValid) {
    log('green', '\n🎉 所有环境变量配置正确！');
    log('green', '✅ 可以启动服务器: pnpm dev');
  } else {
    log('red', '\n❌ 环境变量配置有误，请检查上述错误');
    log('yellow', '💡 参考 README.md 获取详细配置说明');
    generateExampleKeys();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateBase58,
  validateSolanaPrivateKey,
  validateSolanaAddress,
  validateUrl
};