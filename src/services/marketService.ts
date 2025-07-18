import axios, { Method } from 'axios';
import CryptoJS from 'crypto-js';

const API_BASE_URL = 'https://www.okx.com';

// 接口类型定义
interface ChainInfo {
  chainId: string;
  chainName: string;
  dexTokenApproveAddress: string;
}

interface PriceInfo {
  chainId: string;
  quoteCurrency: string;
  baseCurrency: string;
  lastPx: string;
  uTime: string;
}

interface KlineData {
  o: string; // 开盘价
  h: string; // 最高价
  l: string; // 最低价
  c: string; // 收盘价
  confirm: string; // K线状态
  ts: string; // 时间戳
}

interface BalanceInfo {
  chainId: string;
  tokenContractAddress: string;
  symbol: string;
  balance: string;
  tokenPrice: string;
  tokenType: string;
  isRiskToken: boolean;
}

/**
 * OKX DEX Market API 服务
 * 支持行情价格、余额查询、交易历史等功能
 */
export class MarketService {
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;

  constructor(apiKey: string, secretKey: string, passphrase: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphrase = passphrase;
    console.log('DEX Market Service initialized.');
  }

  private async _request(method: Method, path: string, params: any = {}) {
    const timestamp = new Date().toISOString();
    const body = method === 'GET' ? '' : JSON.stringify(params);
    const message = `${timestamp}${method.toUpperCase()}${path}${body}`;
    const sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, this.secretKey));

    const headers = {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
    console.log('Request:headers', headers);
    //  method, path, params

    try {
      const url = `${API_BASE_URL}${path}`;
      const config = {
        headers,
        params: method === 'GET' ? params : undefined,
        data: method !== 'GET' ? params : undefined,
      };

      const response = await axios({ method, url, ...config });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to request ${path}:`, error.response?.data || error.message);
      throw new Error(`Failed to request ${path}`);
    }
  }

  /**
   * 获取单个币对的最新价格
   * @param symbol 币对名称，例如 'SOL-USDT'
   * @returns 返回价格信息
   */
  async getTicker(symbol: string): Promise<any> {
    const path = '/api/v5/dex/market/tickers';
    const response = await this._request('GET', path, { instId: symbol });
    if (response && response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  }

  /**
   * 获取订单簿
   * @param symbol 币对名称，例如 'SOL-USDT'
   * @param size 深度档位数量，默认 10
   * @returns 返回订单簿信息
   */
  async getOrderBook(symbol: string, size: number = 10): Promise<any> {
    const path = '/api/v5/dex/market/books';
    return this._request('GET', path, { instId: symbol, sz: size.toString() });
  }



  /**
   * 获取热门市场列表
   * @param limit 返回数量限制，默认 20
   * @returns 返回热门市场列表
   */
  async getTopMarkets(limit: number = 20): Promise<any> {
    try {
      // 由于 OKX DEX API 可能没有直接的热门市场接口，这里返回模拟数据
      // 在实际应用中，您可能需要根据 OKX 的实际 API 文档来实现
      const mockMarkets = [
        {
          tokenAddress: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          price: '100.50',
          change24h: '5.2',
          volume24h: '1000000',
          marketCap: '50000000000'
        },
        {
          tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          name: 'USD Coin',
          price: '1.00',
          change24h: '0.1',
          volume24h: '500000',
          marketCap: '30000000000'
        }
      ];

      return mockMarkets.slice(0, limit);
    } catch (error: any) {
      console.error('Failed to get top markets:', error);
      throw new Error('Failed to fetch top markets');
    }
  }

  /**
   * 根据代币地址获取市场数据
   * @param tokenAddress 代币地址
   * @returns 返回市场数据
   */
  async getMarketByToken(tokenAddress: string): Promise<any> {
    try {
      // 由于 OKX DEX API 可能没有直接通过代币地址查询的接口，这里返回模拟数据
      // 在实际应用中，您可能需要根据 OKX 的实际 API 文档来实现
      const mockMarketData = {
        tokenAddress,
        symbol: tokenAddress === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'UNKNOWN',
        name: tokenAddress === 'So11111111111111111111111111111111111111112' ? 'Solana' : 'Unknown Token',
        price: '100.50',
        change24h: '5.2',
        volume24h: '1000000',
        marketCap: '50000000000',
        holders: '1000000',
        transactions24h: '50000'
      };

      return mockMarketData;
    } catch (error: any) {
      console.error(`Failed to get market data for token ${tokenAddress}:`, error);
      throw new Error(`Failed to fetch market data for token ${tokenAddress}`);
    }
  }

  // ==================== 行情价格 API ====================

  /**
   * 获取支持的链
   * @returns 返回支持的区块链列表
   */
  async getSupportedChains(): Promise<ChainInfo[]> {
    const path = '/api/v5/dex/market/supported/chain';
    const response = await this._request('GET', path);
    return response.data || [];
  }

  /**
   * 获取单个代币价格
   * @param chainIndex 链唯一标识，如 '1' (Ethereum), '501' (Solana)
   * @param tokenContractAddress 代币合约地址
   * @returns 返回价格信息
   */
  async getTokenPrice(chainIndex: string, tokenContractAddress: string): Promise<PriceInfo | null> {
    const path = '/api/v5/dex/market/price';
    const response = await this._request('GET', path, {
      chainIndex,
      tokenContractAddress
    });
    return response.data?.[0] || null;
  }

  /**
   * 批量获取代币价格
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 代币合约地址，支持批量查询，最多100个，以逗号分隔
   * @returns 返回价格信息列表
   */
  async getBatchTokenPrices(chainIndex: string, tokenContractAddress: string): Promise<PriceInfo[]> {
    const path = '/api/v5/dex/market/price-info';
    const response = await this._request('POST', path, {
      chainIndex,
      tokenContractAddress
    });
    return response.data || [];
  }

  /**
   * 获取交易记录
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 代币合约地址
   * @param after 可选，请求此 id 之前的分页内容
   * @param limit 返回数量限制，默认100，最大500
   * @returns 返回交易记录
   */
  async getTokenTrades(
    chainIndex: string, 
    tokenContractAddress: string, 
    after?: string,
    limit: number = 100
  ): Promise<any[]> {
    const path = '/api/v5/dex/market/trades';
    const params: any = {
      chainIndex,
      tokenContractAddress,
      limit: limit.toString()
    };
    if (after) {
      params.after = after;
    }
    const response = await this._request('GET', path, params);
    return response.data || [];
  }

  /**
   * 获取K线数据
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 代币合约地址
   * @param bar K线周期，如 '1m', '5m', '1H', '1D'
   * @param after 可选，请求此时间戳之前的分页内容
   * @param before 可选，请求此时间戳之后的分页内容
   * @param limit 返回数量限制，默认100，最大299
   * @returns 返回K线数据
   */
  async getKlineData(
    chainIndex: string, 
    tokenContractAddress: string, 
    bar: string = '1m',
    after?: string,
    before?: string,
    limit: number = 100
  ): Promise<KlineData[]> {
    const path = '/api/v5/dex/market/candles';
    const params: any = {
      chainIndex,
      tokenContractAddress,
      bar,
      limit: limit.toString()
    };
    if (after) {
      params.after = after;
    }
    if (before) {
      params.before = before;
    }
    const response = await this._request('GET', path, params);
    return response.data || [];
  }

  /**
   * 获取历史K线数据
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 代币合约地址
   * @param bar K线周期
   * @param after 可选，请求此时间戳之前的分页内容
   * @param before 可选，请求此时间戳之后的分页内容
   * @param limit 返回数量限制，默认100，最大299
   * @returns 返回历史K线数据
   */
  async getHistoryKlineData(
    chainIndex: string,
    tokenContractAddress: string,
    bar: string = '1m',
    after?: string,
    before?: string,
    limit: number = 100
  ): Promise<KlineData[]> {
    const path = '/api/v5/dex/market/historical-candles';
    const params: any = {
      chainIndex,
      tokenContractAddress,
      bar,
      limit: limit.toString()
    };
    if (after) {
      params.after = after;
    }
    if (before) {
      params.before = before;
    }
    const response = await this._request('GET', path, params);
    return response.data || [];
  }

  // ==================== 余额查询 API ====================

  /**
   * 获取账户总价值
   * @param address 钱包地址
   * @param chains 链列表，逗号分隔，如 '1,56,137'
   * @returns 返回账户总价值信息
   */
  async getTotalValue(address: string, chains?: string): Promise<any> {
    const path = '/api/v5/dex/balance/total-value';
    const params: any = { address };
    if (chains) {
      params.chains = chains;
    }
    const response = await this._request('GET', path, params);
    return response.data || {};
  }

  /**
   * 获取账户余额详情
   * @param address 钱包地址
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 可选，代币合约地址
   * @param page 页码，从1开始
   * @param limit 每页数量，默认20，最大100
   * @returns 返回余额详情列表
   */
  async getBalanceDetails(
    address: string, 
    chainIndex: string,
    tokenContractAddress?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<BalanceInfo[]> {
    const path = '/api/v5/dex/balance/token-balances';
    const params: any = {
      address,
      chainIndex,
      page: page.toString(),
      limit: limit.toString()
    };
    if (tokenContractAddress) {
      params.tokenContractAddress = tokenContractAddress;
    }
    const response = await this._request('GET', path, params);
    return response.data || [];
  }

  /**
   * 获取特定代币余额
   * @param address 钱包地址
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 代币合约地址
   * @returns 返回特定代币余额信息
   */
  async getTokenBalance(address: string, chainIndex: string, tokenContractAddress: string): Promise<BalanceInfo | null> {
    const path = '/api/v5/dex/balance/token-balance';
    const response = await this._request('GET', path, {
      address,
      chainIndex,
      tokenContractAddress
    });
    return response.data || null;
  }

  // ==================== 交易历史 API ====================

  /**
   * 获取交易历史支持的链
   * @returns 返回支持交易历史查询的链列表
   */
  async getTransactionHistorySupportedChains(): Promise<ChainInfo[]> {
    const path = '/api/v5/dex/transaction/supported/chain';
    const response = await this._request('GET', path);
    return response.data || [];
  }

  /**
   * 根据交易哈希获取交易详情
   * @param txHash 交易哈希
   * @param chainIndex 链唯一标识
   * @returns 返回交易详情
   */
  async getTransactionDetailByTxHash(txHash: string, chainIndex: string): Promise<any | null> {
    const path = '/api/v5/dex/transaction/transaction-detail';
    const response = await this._request('GET', path, {
      txHash,
      chainIndex
    });
    return response.data || null;
  }

  /**
   * 根据地址获取交易历史
   * @param address 钱包地址
   * @param chainIndex 链唯一标识
   * @param tokenContractAddress 可选，代币合约地址
   * @param page 页码，从1开始
   * @param limit 每页数量，默认20，最大100
   * @returns 返回交易历史列表
   */
  async getTransactionHistory(
    address: string,
    chainIndex: string,
    tokenContractAddress?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any[]> {
    const path = '/api/v5/dex/transaction/transaction-list';
    const params: any = {
      address,
      chainIndex,
      page: page.toString(),
      limit: limit.toString()
    };
    if (tokenContractAddress) {
      params.tokenContractAddress = tokenContractAddress;
    }
    const response = await this._request('GET', path, params);
    return response.data || [];
  }

  // ==================== 综合币价 API ====================

  /**
   * 获取综合币价
   * @param symbol 币种符号，如 'BTC'
   * @returns 返回综合币价信息
   */
  async getAggregatedPrice(symbol: string): Promise<any> {
    const path = '/api/v5/dex/aggregator/all-token-price';
    const response = await this._request('GET', path, { symbol });
    return response.data?.[0] || null;
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取 Solana 链的热门代币价格
   * @param quoteCurrency 计价货币，默认 'USD'
   * @returns 返回热门代币价格列表
   */
  async getSolanaPopularTokenPrices(quoteCurrency: string = 'USD'): Promise<PriceInfo[]> {
    const popularTokens = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' // Bonk
    ];

    const tokenContractAddress = popularTokens.join(',');
    return this.getBatchTokenPrices('501', tokenContractAddress);
  }

  /**
   * 获取钱包在 Solana 链上的完整资产信息
   * @param address 钱包地址
   * @param quoteCurrency 计价货币，默认 'USD'
   * @returns 返回完整资产信息
   */
  async getSolanaWalletAssets(address: string, quoteCurrency: string = 'USD'): Promise<{
    totalValue: any;
    balances: BalanceInfo[];
    transactions: any[];
  }> {
    const chainIndex = '501'; // Solana chain index

    const [totalValue, balances, transactions] = await Promise.all([
      this.getTotalValue(address, chainIndex),
      this.getBalanceDetails(address, chainIndex),
      this.getTransactionHistory(address, chainIndex)
    ]);

    return {
      totalValue,
      balances,
      transactions
    };
  }
}