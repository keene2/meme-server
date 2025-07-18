#!/usr/bin/env node

/**
 * 快速设置脚本
 * 帮助用户快速配置 .env 文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSolanaKeypair() {
  try {
    const { Keypair } = require('@solana/web3.js');
    const bs58 = require('bs58');
    
    const keypair = Keypair.generate();
    const privateKey = bs58.encode(keypair.secretKey);
    const publicKey = keypair.publicKey.toString();
    
    return { privateKey, publicKey };
  } catch (error) {
    log('red', '❌ 无法生成密钥对，请确保已安装依赖: pnpm install');
    return null;
  }
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const examplePath = path.join(process.cwd(), '.env.example');
  
  // 检查是否已存在 .env 文件
  if (fs.existsSync(envPath)) {
    log('yellow', '⚠️  .env 文件已存在');
    return false;
  }
  
  // 复制 .env.example
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    log('green', '✅ 已创建 .env 文件');
    return true;
  } else {
    log('red', '❌ .env.example 文件不存在');
    return false;
  }
}

function updateEnvFile(updates) {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('red', '❌ .env 文件不存在');
    return false;
  }
  
  let content = fs.readFileSync(envPath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, content);
  return true;
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function interactiveSetup() {
  log('blue', '🚀 RushX Server 交互式设置\n');
  
  // 创建 .env 文件
  createEnvFile();
  
  log('cyan', '📝 请提供以下配置信息：\n');
  
  const config = {};
  
  // OKX API 配置
  log('yellow', '🔑 OKX API 配置（从 OKX 开发者控制台获取）:');
  config.OKX_API_KEY = await promptUser('OKX API Key: ');
  config.OKX_SECRET_KEY = await promptUser('OKX Secret Key: ');
  config.OKX_API_PASSPHRASE = await promptUser('OKX Passphrase: ');
  config.OKX_PROJECT_ID = await promptUser('OKX Project ID: ');
  
  console.log();
  
  // Solana 配置
  log('yellow', '🔗 Solana 配置:');
  const useTestnet = await promptUser('使用测试网？(y/N): ');
  
  if (useTestnet.toLowerCase() === 'y') {
    config.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
    log('green', '✅ 使用 Solana 测试网');
  } else {
    const customRpc = await promptUser('自定义 RPC URL (留空使用默认): ');
    config.SOLANA_RPC_URL = customRpc || 'https://api.mainnet-beta.solana.com';
  }
  
  console.log();
  
  // 钱包配置
  log('yellow', '👛 钱包配置:');
  const walletOption = await promptUser('选择钱包配置方式:\n1. 生成新的测试钱包\n2. 使用现有钱包\n请选择 (1/2): ');
  
  if (walletOption === '1') {
    const keypair = generateSolanaKeypair();
    if (keypair) {
      config.SOLANA_PRIVATE_KEY = keypair.privateKey;
      config.SOLANA_WALLET_ADDRESS = keypair.publicKey;
      log('green', '✅ 已生成新的测试钱包');
      log('cyan', `钱包地址: ${keypair.publicKey}`);
      log('red', '⚠️  这是测试钱包，请勿在生产环境使用真实资金');
    }
  } else {
    config.SOLANA_PRIVATE_KEY = await promptUser('Solana 私钥 (base58 格式): ');
    config.SOLANA_WALLET_ADDRESS = await promptUser('Solana 钱包地址: ');
  }
  
  console.log();
  
  // 更新 .env 文件
  if (updateEnvFile(config)) {
    log('green', '✅ 配置已保存到 .env 文件');
    log('blue', '\n🎉 设置完成！');
    log('cyan', '下一步：');
    log('cyan', '1. 运行 pnpm check-env 验证配置');
    log('cyan', '2. 运行 pnpm dev 启动服务器');
  } else {
    log('red', '❌ 保存配置失败');
  }
}

async function quickSetup() {
  log('blue', '⚡ 快速设置（使用测试配置）\n');
  
  createEnvFile();
  
  const keypair = generateSolanaKeypair();
  if (!keypair) return;
  
  const config = {
    OKX_API_KEY: 'your_api_key_here',
    OKX_SECRET_KEY: 'your_secret_key_here', 
    OKX_API_PASSPHRASE: 'your_passphrase_here',
    OKX_PROJECT_ID: 'your_project_id_here',
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    SOLANA_PRIVATE_KEY: keypair.privateKey,
    SOLANA_WALLET_ADDRESS: keypair.publicKey
  };
  
  if (updateEnvFile(config)) {
    log('green', '✅ 已创建测试配置');
    log('yellow', '⚠️  请编辑 .env 文件，填入真实的 OKX API 凭证');
    log('cyan', '钱包地址: ' + keypair.publicKey);
    log('red', '⚠️  这是测试钱包，请勿在生产环境使用真实资金');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    await quickSetup();
  } else {
    await interactiveSetup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSolanaKeypair, createEnvFile, updateEnvFile };