# OKX DEX API 集成指南

本文档描述了基于 OKX DEX API 新增的功能和端点。

## 新增功能概览

### 1. 市场价格相关 API

#### 获取支持的区块链
- **端点**: `GET /api/dex/chains`
- **描述**: 获取 OKX DEX 支持的所有区块链信息
- **参数**: 无
- **示例**: `GET http://localhost:8082/api/dex/chains`

#### 获取代币价格
- **端点**: `GET /api/dex/price`
- **描述**: 获取特定代币的实时价格
- **参数**:
  - `chainId` (必需): 区块链ID (如: 501 for Solana)
  - `quoteCurrency` (必需): 报价货币
  - `baseCurrency` (必需): 基础货币
- **示例**: `GET /api/dex/price?chainId=501&quoteCurrency=USDC&baseCurrency=SOL`

#### 批量获取代币价格
- **端点**: `GET /api/dex/prices`
- **描述**: 批量获取多个代币的价格
- **参数**:
  - `chainId` (必需): 区块链ID
  - `quoteCurrency` (必需): 报价货币
  - `baseCurrencies` (必需): 基础货币列表，用逗号分隔
- **示例**: `GET /api/dex/prices?chainId=501&quoteCurrency=USDC&baseCurrencies=SOL,BONK,WIF`

#### 获取 Solana 热门代币价格
- **端点**: `GET /api/dex/solana/popular-prices`
- **描述**: 获取 Solana 链上热门代币的价格
- **参数**:
  - `quoteCurrency` (可选): 报价货币，默认为 USD
- **示例**: `GET /api/dex/solana/popular-prices?quoteCurrency=USD`

#### 获取综合币价
- **端点**: `GET /api/dex/aggregated-price`
- **描述**: 获取代币的综合价格信息
- **参数**:
  - `symbol` (必需): 代币符号
- **示例**: `GET /api/dex/aggregated-price?symbol=BTC`

### 2. 交易数据相关 API

#### 获取代币交易记录
- **端点**: `GET /api/dex/trades`
- **描述**: 获取特定代币对的交易历史
- **参数**:
  - `chainId` (必需): 区块链ID
  - `quoteCurrency` (必需): 报价货币
  - `baseCurrency` (必需): 基础货币
  - `limit` (可选): 返回记录数量，默认100
- **示例**: `GET /api/dex/trades?chainId=501&quoteCurrency=USDC&baseCurrency=SOL&limit=50`

#### 获取K线数据
- **端点**: `GET /api/dex/kline`
- **描述**: 获取代币对的K线图数据
- **参数**:
  - `chainId` (必需): 区块链ID
  - `quoteCurrency` (必需): 报价货币
  - `baseCurrency` (必需): 基础货币
  - `period` (可选): 时间周期，默认1H
  - `limit` (可选): 返回记录数量，默认100
- **示例**: `GET /api/dex/kline?chainId=501&quoteCurrency=USDC&baseCurrency=SOL&period=1H&limit=24`

#### 获取历史K线数据
- **端点**: `GET /api/dex/kline/history`
- **描述**: 获取历史K线数据
- **参数**:
  - `chainId` (必需): 区块链ID
  - `quoteCurrency` (必需): 报价货币
  - `baseCurrency` (必需): 基础货币
  - `period` (可选): 时间周期，默认1H
  - `before` (可选): 查询此时间之前的数据
  - `limit` (可选): 返回记录数量，默认100
- **示例**: `GET /api/dex/kline/history?chainId=501&quoteCurrency=USDC&baseCurrency=SOL&period=1H&before=1640995200000&limit=24`

### 3. 钱包余额相关 API

#### 获取钱包总估值
- **端点**: `GET /api/dex/balance/total`
- **描述**: 获取钱包的总资产估值
- **参数**:
  - `chainId` (必需): 区块链ID
  - `address` (必需): 钱包地址
  - `quoteCurrency` (可选): 报价货币，默认USD
- **示例**: `GET /api/dex/balance/total?chainId=501&address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM&quoteCurrency=USD`

#### 获取钱包资产明细
- **端点**: `GET /api/dex/balance/details`
- **描述**: 获取钱包的详细资产信息
- **参数**:
  - `chainId` (必需): 区块链ID
  - `address` (必需): 钱包地址
  - `quoteCurrency` (可选): 报价货币，默认USD
  - `tokenContractAddress` (可选): 特定代币合约地址
  - `protocolType` (可选): 协议类型，默认all
  - `page` (可选): 页码，默认1
  - `limit` (可选): 每页数量，默认20
- **示例**: `GET /api/dex/balance/details?chainId=501&address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM&quoteCurrency=USD&protocolType=all&page=1&limit=20`

#### 获取特定代币余额
- **端点**: `GET /api/dex/balance/token`
- **描述**: 获取钱包中特定代币的余额
- **参数**:
  - `chainId` (必需): 区块链ID
  - `address` (必需): 钱包地址
  - `tokenContractAddress` (必需): 代币合约地址
  - `quoteCurrency` (可选): 报价货币，默认USD
- **示例**: `GET /api/dex/balance/token?chainId=501&address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM&tokenContractAddress=So11111111111111111111111111111111111111112&quoteCurrency=USD`

#### 获取 Solana 钱包完整资产信息
- **端点**: `GET /api/dex/solana/wallet/:address`
- **描述**: 获取 Solana 钱包的完整资产信息（包括总估值、余额明细和交易历史）
- **参数**:
  - `address` (路径参数，必需): 钱包地址
  - `quoteCurrency` (可选): 报价货币，默认USD
- **示例**: `GET /api/dex/solana/wallet/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?quoteCurrency=USD`

### 4. 交易历史相关 API

#### 获取交易历史
- **端点**: `GET /api/dex/history/transactions`
- **描述**: 获取钱包的交易历史记录
- **参数**:
  - `chainId` (必需): 区块链ID
  - `address` (必需): 钱包地址
  - `tokenContractAddress` (可选): 特定代币合约地址
  - `protocolType` (可选): 协议类型，默认all
  - `page` (可选): 页码，默认1
  - `limit` (可选): 每页数量，默认20
- **示例**: `GET /api/dex/history/transactions?chainId=501&address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM&protocolType=all&page=1&limit=20`

## 常用区块链ID

- **Solana**: 501
- **Ethereum**: 1
- **BSC**: 56
- **Polygon**: 137
- **Avalanche**: 43114

## 常用代币合约地址 (Solana)

- **SOL**: So11111111111111111111111111111111111111112
- **USDC**: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- **USDT**: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

## 错误处理

所有 API 端点都遵循统一的响应格式：

### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述"
}
```

## 使用建议

1. **API 限流**: OKX DEX API 有请求频率限制，建议实现适当的缓存机制
2. **错误重试**: 网络请求可能失败，建议实现重试机制
3. **数据验证**: 在使用 API 数据前，建议进行数据有效性验证
4. **监控**: 建议添加 API 调用监控和日志记录

## 测试

使用提供的 `api-tests.http` 文件可以快速测试所有新增的 API 端点。建议使用 VS Code 的 REST Client 扩展进行测试。