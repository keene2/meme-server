import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getTradingProvider } from './services/tradingService';
import { MarketService } from './services/marketService';
import { BlockCrawler } from './services/blockCrawler';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化服务
let tradingProvider: any;
let marketService: MarketService;
let blockCrawler: BlockCrawler;

async function initializeServices() {
  try {
    // 初始化 DEX 市场服务
    marketService = new MarketService(
      process.env.OKX_API_KEY || '',
      process.env.OKX_SECRET_KEY || '',
      process.env.OKX_API_PASSPHRASE || ''
    );
    console.log('DEX Market Service initialized.');

    // 初始化交易提供商
    tradingProvider = getTradingProvider('okx', {
      apiKey: process.env.OKX_API_KEY || '',
      secretKey: process.env.OKX_SECRET_KEY || '',
      apiPassphrase: process.env.OKX_API_PASSPHRASE || '',
      projectId: process.env.OKX_PROJECT_ID || '',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    });
    console.log('OKX Trading Provider initialized.');

    // 初始化区块爬虫
    blockCrawler = new BlockCrawler(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    await blockCrawler.start();
    console.log('Block Crawler initialized and started.');

  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      trading: !!tradingProvider,
      market: !!marketService,
      blockCrawler: !!blockCrawler
    }
  });
});

// 获取报价
app.get('/api/quote', async (req, res) => {
  try {
    const { fromTokenAddress, toTokenAddress, amount, slippage, userWalletAddress } = req.query;

    if (!fromTokenAddress || !toTokenAddress || !amount || !slippage || !userWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromTokenAddress, toTokenAddress, amount, slippage, userWalletAddress'
      });
    }

    const result = await tradingProvider.getQuote({
      fromTokenAddress: fromTokenAddress as string,
      toTokenAddress: toTokenAddress as string,
      amount: amount as string,
      slippage: slippage as string,
      userWalletAddress: userWalletAddress as string,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Quote API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// 构建交易（返回未签名的交易给用户签名）
app.post('/api/build-transaction', async (req, res) => {
  try {
    const { 
      fromTokenAddress, 
      toTokenAddress, 
      amount, 
      slippage, 
      userWalletAddress,
      enableMevProtection,
      priorityFee,
      enableTwap
    } = req.body;

    if (!fromTokenAddress || !toTokenAddress || !amount || !slippage || !userWalletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromTokenAddress, toTokenAddress, amount, slippage, userWalletAddress'
      });
    }

    const result = await tradingProvider.buildTransaction({
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage,
      userWalletAddress,
      enableMevProtection: enableMevProtection || false,
      priorityFee,
      enableTwap: enableTwap || false,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Build transaction API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// 提交用户签名后的交易
app.post('/api/submit-transaction', async (req, res) => {
  try {
    const { signedTransaction, enableMevProtection } = req.body;

    if (!signedTransaction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: signedTransaction'
      });
    }

    const result = await tradingProvider.submitTransaction({
      signedTransaction,
      enableMevProtection: enableMevProtection || false,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Submit transaction API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// 获取市场数据
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await marketService.getTopMarkets();
    res.json({
      success: true,
      data: markets
    });
  } catch (error: any) {
    console.error('Markets API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market data'
    });
  }
});

// 获取特定代币的市场数据
app.get('/api/markets/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const market = await marketService.getMarketByToken(tokenAddress);
    
    if (!market) {
      return res.status(404).json({
        success: false,
        error: 'Market not found'
      });
    }

    res.json({
      success: true,
      data: market
    });
  } catch (error: any) {
    console.error('Market detail API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch market data'
    });
  }
});

// ==================== 新增的 OKX DEX API 端点 ====================

// 获取支持的区块链
app.get('/api/dex/chains', async (req, res) => {
  try {
    const chains = await marketService.getSupportedChains();
    res.json({
      success: true,
      data: chains
    });
  } catch (error: any) {
    console.error('Supported chains API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch supported chains'
    });
  }
});

// 获取代币价格
app.get('/api/dex/price', async (req, res) => {
  try {
    const { chainIndex, tokenContractAddress } = req.query;

    if (!chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chainIndex, tokenContractAddress'
      });
    }

    const price = await marketService.getTokenPrice(
      chainIndex as string,
      tokenContractAddress as string
    );

    res.json({
      success: true,
      data: price
    });
  } catch (error: any) {
    console.error('Token price API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token price'
    });
  }
});

// 批量获取代币价格
app.post('/api/dex/prices', async (req, res) => {
  try {
    const { chainIndex, tokenContractAddress } = req.body;

    if (!chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chainIndex, tokenContractAddress'
      });
    }

    const prices = await marketService.getBatchTokenPrices(
      chainIndex as string,
      tokenContractAddress as string
    );

    res.json({
      success: true,
      data: prices
    });
  } catch (error: any) {
    console.error('Batch token prices API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token prices'
    });
  }
});

// 获取 Solana 热门代币价格
app.get('/api/dex/solana/popular-prices', async (req, res) => {
  try {
    const { quoteCurrency = 'USD' } = req.query;
    const prices = await marketService.getSolanaPopularTokenPrices(quoteCurrency as string);

    res.json({
      success: true,
      data: prices
    });
  } catch (error: any) {
    console.error('Solana popular prices API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Solana popular token prices'
    });
  }
});

// 获取代币交易记录
app.get('/api/dex/trades', async (req, res) => {
  try {
    const { chainIndex, tokenContractAddress, after, limit = '100' } = req.query;

    if (!chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chainIndex, tokenContractAddress'
      });
    }

    const trades = await marketService.getTokenTrades(
      chainIndex as string,
      tokenContractAddress as string,
      after as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: trades
    });
  } catch (error: any) {
    console.error('Token trades API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token trades'
    });
  }
});

// 获取K线数据
app.get('/api/dex/kline', async (req, res) => {
  try {
    const { chainIndex, tokenContractAddress, bar = '1m', after, before, limit = '100' } = req.query;

    if (!chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chainIndex, tokenContractAddress'
      });
    }

    const klineData = await marketService.getKlineData(
      chainIndex as string,
      tokenContractAddress as string,
      bar as string,
      after as string,
      before as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: klineData
    });
  } catch (error: any) {
    console.error('Kline data API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch kline data'
    });
  }
});

// 获取历史K线数据
app.get('/api/dex/kline/history', async (req, res) => {
  try {
    const { chainIndex, tokenContractAddress, bar = '1m', after, before, limit = '100' } = req.query;

    if (!chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: chainIndex, tokenContractAddress'
      });
    }

    const historyKlineData = await marketService.getHistoryKlineData(
      chainIndex as string,
      tokenContractAddress as string,
      bar as string,
      after as string,
      before as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: historyKlineData
    });
  } catch (error: any) {
    console.error('History kline data API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch history kline data'
    });
  }
});

// 获取钱包总价值
app.get('/api/dex/balance/total', async (req, res) => {
  try {
    const { address, chains } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: address'
      });
    }

    const totalValue = await marketService.getTotalValue(
      address as string,
      chains as string
    );

    res.json({
      success: true,
      data: totalValue
    });
  } catch (error: any) {
    console.error('Total value API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch total value'
    });
  }
});

// 获取钱包余额详情
app.get('/api/dex/balance/details', async (req, res) => {
  try {
    const { 
      address, 
      chainIndex,
      tokenContractAddress,
      page = '1',
      limit = '20'
    } = req.query;

    if (!address || !chainIndex) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: address, chainIndex'
      });
    }

    const balanceDetails = await marketService.getBalanceDetails(
      address as string,
      chainIndex as string,
      tokenContractAddress as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: balanceDetails
    });
  } catch (error: any) {
    console.error('Balance details API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch balance details'
    });
  }
});

// 获取特定代币余额
app.get('/api/dex/balance/token', async (req, res) => {
  try {
    const { address, chainIndex, tokenContractAddress } = req.query;

    if (!address || !chainIndex || !tokenContractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: address, chainIndex, tokenContractAddress'
      });
    }

    const tokenBalance = await marketService.getTokenBalance(
      address as string,
      chainIndex as string,
      tokenContractAddress as string
    );

    res.json({
      success: true,
      data: tokenBalance
    });
  } catch (error: any) {
    console.error('Token balance API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token balance'
    });
  }
});

// 获取交易历史
app.get('/api/dex/history/transactions', async (req, res) => {
  try {
    const { 
      address, 
      chainIndex,
      tokenContractAddress,
      page = '1',
      limit = '20'
    } = req.query;

    if (!address || !chainIndex) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: address, chainIndex'
      });
    }

    const transactions = await marketService.getTransactionHistory(
      address as string,
      chainIndex as string,
      tokenContractAddress as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    console.error('Transaction history API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction history'
    });
  }
});

// 获取交易历史支持的链
app.get('/api/dex/history/chains', async (req, res) => {
  try {
    const chains = await marketService.getTransactionHistorySupportedChains();
    res.json({
      success: true,
      data: chains
    });
  } catch (error: any) {
    console.error('Transaction history supported chains API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction history supported chains'
    });
  }
});

// 根据交易哈希获取交易详情
app.get('/api/dex/transaction/detail', async (req, res) => {
  try {
    const { txHash, chainIndex } = req.query;

    if (!txHash || !chainIndex) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: txHash, chainIndex'
      });
    }

    const transactionDetail = await marketService.getTransactionDetailByTxHash(
      txHash as string,
      chainIndex as string
    );

    res.json({
      success: true,
      data: transactionDetail
    });
  } catch (error: any) {
    console.error('Transaction detail API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction detail'
    });
  }
});

// 获取综合币价
app.get('/api/dex/aggregated-price', async (req, res) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: symbol'
      });
    }

    const aggregatedPrice = await marketService.getAggregatedPrice(symbol as string);

    res.json({
      success: true,
      data: aggregatedPrice
    });
  } catch (error: any) {
    console.error('Aggregated price API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch aggregated price'
    });
  }
});

// 获取 Solana 钱包完整资产信息
app.get('/api/dex/solana/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { quoteCurrency = 'USD' } = req.query;

    const walletAssets = await marketService.getSolanaWalletAssets(
      address,
      quoteCurrency as string
    );

    res.json({
      success: true,
      data: walletAssets
    });
  } catch (error: any) {
    console.error('Solana wallet assets API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Solana wallet assets'
    });
  }
});

// 启动服务器
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 Meme Trading Platform Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💰 Quote API: http://localhost:${PORT}/api/quote`);
    console.log(`🔨 Build Transaction API: http://localhost:${PORT}/api/build-transaction`);
    console.log(`📤 Submit Transaction API: http://localhost:${PORT}/api/submit-transaction`);
    console.log(`📈 Markets API: http://localhost:${PORT}/api/markets`);
  });
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  if (blockCrawler) {
    await blockCrawler.stop();
    console.log('Block Crawler stopped.');
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  
  if (blockCrawler) {
    await blockCrawler.stop();
    console.log('Block Crawler stopped.');
  }
  
  process.exit(0);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});