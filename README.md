# RushX Server - MEV 保护的 Solana 交易服务

基于 OKX DEX API 的 Solana 代币交易服务，支持 MEV 保护和 TWAP 拆单功能。

## 功能特性

### 🛡️ MEV 保护
- **动态优先级费用**: 根据网络状况和交易金额自动调整优先级费用
- **TWAP 拆单**: 大额交易自动拆分成多个小单，随机时间间隔执行
- **交易模拟**: 执行前进行交易模拟，确保成功率
- **智能重试**: 内置重试机制，提高交易成功率

### 📊 交易功能
- **实时报价**: 获取最优兑换路径和价格
- **多路径聚合**: 通过 OKX DEX 聚合器获得最佳价格
- **滑点保护**: 可配置滑点容忍度
- **交易追踪**: 完整的交易状态监控

## 环境配置

### 1. 复制环境变量文件
```bash
cp .env.example .env
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
# 服务器配置
PORT=8080

# Solana RPC 端点
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# OKX API 凭证
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_API_PASSPHRASE=your_passphrase
OKX_PROJECT_ID=your_project_id

# Solana 钱包配置
SOLANA_PRIVATE_KEY=your_base58_private_key
SOLANA_WALLET_ADDRESS=your_wallet_address
```

### 3. 获取 Solana 私钥

#### 从 Phantom 钱包导出：
1. 打开 Phantom 钱包
2. 点击设置 → 显示私钥
3. 复制 base58 格式的私钥（通常以数字和字母组成的长字符串）

#### 从 Solana CLI 生成：
```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana-keygen pubkey ~/.config/solana/id.json  # 获取公钥地址
```

## 安装和运行

### 1. 安装依赖
```bash
pnpm install
```

### 2. 启动开发服务器
```bash
pnpm dev
```

### 3. 启动生产服务器
```bash
pnpm build
pnpm start
```

## API 接口

### 获取报价
```http
POST /api/quote
Content-Type: application/json

{
  "fromTokenAddress": "So11111111111111111111111111111111111111112",
  "toTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000",
  "slippage": "0.5"
}
```

### 执行交易（支持 MEV 保护）
```http
POST /api/swap
Content-Type: application/json

{
  "fromTokenAddress": "So11111111111111111111111111111111111111112",
  "toTokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000",
  "slippage": "0.5",
  "enableMevProtection": true,
  "enableTwap": false,
  "priorityFee": "5000"
}
```

#### 参数说明：
- `fromTokenAddress`: 源代币合约地址
- `toTokenAddress`: 目标代币合约地址  
- `amount`: 交易数量（最小单位）
- `slippage`: 滑点容忍度（如 "0.5" 表示 0.5%）
- `enableMevProtection`: 是否启用 MEV 保护（可选）
- `enableTwap`: 是否强制启用 TWAP 拆单（可选）
- `priorityFee`: 自定义优先级费用（lamports，可选）

### 响应格式
```json
{
  "success": true,
  "txId": "transaction_hash",
  "mevProtected": true
}
```

## MEV 保护机制

### 1. 动态优先级费用
- 自动获取网络当前优先级费用
- 根据交易金额调整费用倍数：
  - 大额交易（>100万）：3倍费用
  - 中等交易（>10万）：2倍费用
  - 小额交易：1倍费用
- 最低保证费用：1000 lamports

### 2. TWAP 拆单策略
- 自动检测：交易金额 > 50万时启用
- 拆单规则：每10万一单，最多拆成10单
- 随机延迟：1-5秒随机间隔，避免被检测
- 失败处理：任一子交易失败则停止后续交易

### 3. 交易安全保障
- **预执行模拟**：确保交易能够成功
- **区块确认追踪**：监控交易状态
- **自动重试机制**：最多重试3次
- **错误恢复**：详细的错误信息和处理建议

## 常见代币地址

```javascript
// Solana 原生代币
const SOL = "So11111111111111111111111111111111111111112";

// 稳定币
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

// 热门代币
const RAY = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";
const SRM = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
```

## 开发说明

### 项目结构
```
src/
├── index.ts              # 主服务器文件
├── services/
│   ├── tradingService.ts  # 交易服务（API模式 + MEV保护）
│   ├── marketService.ts   # 市场数据服务
│   └── blockCrawler.ts    # 区块爬虫服务
```

### 技术栈
- **Node.js + TypeScript**: 服务器框架
- **Express**: Web 框架
- **WebSocket**: 实时通信
- **@solana/web3.js**: Solana 区块链交互
- **axios**: HTTP 客户端
- **bs58**: Base58 编码/解码

## 安全注意事项

1. **私钥安全**: 
   - 永远不要将私钥提交到版本控制
   - 使用环境变量存储敏感信息
   - 定期轮换 API 密钥

2. **网络安全**:
   - 使用 HTTPS 部署生产环境
   - 配置适当的 CORS 策略
   - 实施速率限制

3. **交易安全**:
   - 始终进行交易模拟
   - 设置合理的滑点保护
   - 监控异常交易行为

## 故障排除

### 常见错误

1. **"Invalid SOLANA_PRIVATE_KEY"**
   - 确保私钥是 base58 格式
   - 检查私钥长度（应为64字节）

2. **"API Error: Insufficient balance"**
   - 检查钱包余额
   - 确保有足够的 SOL 支付交易费用

3. **"Transaction simulation failed"**
   - 检查代币地址是否正确
   - 验证交易金额和滑点设置

## 许可证

MIT License