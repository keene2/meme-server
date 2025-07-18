import { Connection, SlotInfo } from '@solana/web3.js';

export class BlockCrawler {
  private connection: Connection;
  private isRunning: boolean = false;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('Block Crawler initialized.');
  }

  public async start() {
    if (this.isRunning) {
      console.log('Block crawler is already running.');
      return;
    }

    console.log('Starting block crawler...');
    this.isRunning = true;
    
    this.connection.onSlotChange((slotInfo) => {
      this.handleNewBlock(slotInfo);
    });
    
    console.log('Block crawler started and listening for new slots.');
  }

  public async stop() {
    if (!this.isRunning) {
      console.log('Block crawler is not running.');
      return;
    }

    console.log('Stopping block crawler...');
    this.isRunning = false;
    // 注意：@solana/web3.js 的 Connection 没有直接的停止方法
    // 在实际应用中，您可能需要保存订阅 ID 并取消订阅
    console.log('Block crawler stopped.');
  }

  private async handleNewBlock(slotInfo: SlotInfo) {
    try {
      // console.log(`New slot detected: ${slotInfo.slot}, parent: ${slotInfo.parent}, root: ${slotInfo.root}`);
      // 这里可以添加处理新区块的逻辑
      // 例如：分析交易、更新市场数据等
    } catch (error) {
      console.error('Error processing new block:', error);
    }
  }
}