# RushX 项目技术方案

## 1. 概述

本项目旨在构建一个受 FomoX 启发的链上交易平台，但针对独立开发者进行了大幅简化。后端将完全基于 Node.js 和 TypeScript，优先实现 Solana 链的实时区块监控（爬块）和基础交易功能，确保架构清晰、易于维护和扩展。

## 2. 后端架构

我们将采用一个模块化、面向服务的架构。

*   **核心框架**: **Express.js**
    *   选择 Express 是因为它轻量、灵活且拥有庞大的社区支持，非常适合快速搭建 API 服务。
*   **语言**: **TypeScript**
    *   遵循您的要求，使用 TypeScript 可以提供强大的类型检查，减少运行时错误，提升代码质量和可维护性。
*   **实时通信**: **WebSocket (`ws` 库)**
    *   为了实现实时数据推送（如新区块信息、交易状态更新），我们将集成 `ws` 库。它性能优异，能与 Express 服务器轻松结合。

## 3. 核心服务模块

这是后端的心脏，我们将业务逻辑拆分为独立的服务。

1.  **爬块服务 (`BlockCrawler Service`) - 重点实现**
    *   **目的**: 实时监控 Solana 链上的新区块。
    *   **技术栈**: 使用 `@solana/web3.js` 库。
    *   **实现**: 创建一个 `BlockCrawler` 类，它会通过 WebSocket 连接到您选择的 RPC 节点服务商（如 Helius 或 QuickNode）。通过调用 `connection.onSlotChange()` 或类似方法，我们可以实时获取最新的区块信息。一旦监听到新块，该服务将通过 WebSocket 将信息广播给所有连接的前端客户端。

2.  **交易服务 (`Trading Service`) - 抽象化设计**
    *   **目的**: 处理所有交易逻辑，并确保服务商的可替换性。
    *   **实现**: 
        *   首先，定义一个抽象的 `TradingProvider` 接口，其中包含如 `swap`、`getQuote` 等标准方法。
        *   然后，创建一个 `OkxProvider` 类来实现这个接口，该类内部封装 OKX DEX SDK 的所有调用逻辑。
        *   在应用的其他部分，我们只依赖 `TradingProvider` 接口，而不是具体的 `OkxProvider`。这样，未来当您资金充足时，只需创建一个新的 Provider（例如 `JupProvider`），并在配置中切换即可，无需改动大量业务代码。

## 4. 建议项目结构

一个清晰的目录结构是项目成功的一半。

```
/meme-server
├── src/
│   ├── services/         # 核心业务逻辑
│   │   ├── blockCrawler.ts # 爬块服务
│   │   └── tradingService.ts # 交易服务
│   ├── types/            # 全局 TypeScript 类型定义
│   └── index.ts          # 应用入口：Express 和 WebSocket 服务器启动
├── .env.example        # 环境变量示例文件
├── package.json          # 项目依赖和脚本
└── tsconfig.json         # TypeScript 配置文件
```

## 5. 数据库

根据“简化”原则，在项目初期，**我们可以暂时不使用数据库**。对于爬块这种实时性要求高的功能，数据是即时广播的，无需持久化。交易历史等可以暂时依赖第三方服务查询。当后续需要实现用户系统、限价单等功能时，推荐使用 **PostgreSQL** 搭配 **Prisma ORM**，它们与 TypeScript 的集成非常出色。

## 6. 开发与部署

*   **包管理器**: **pnpm** (遵从您的要求)。
*   **开发环境**: 使用 `ts-node-dev` 或 `nodemon` 配合 `ts-node`，可以在代码变更后自动重启服务，提升开发效率。
*   **部署方案**: 对于独立开发者，推荐以下简化方案：
    *   **Render**: 对 Node.js 应用支持非常友好，提供免费套餐，部署流程简单，基本是 Git-push-to-deploy。
    *   **Docker**: 将应用容器化，然后可以部署到任何支持 Docker 的云平台（如 DigitalOcean, Linode 的低成本 VPS），灵活性更高。

## 7. 下一步实施计划

1.  初始化项目，创建 `package.json` 和 `tsconfig.json`。
2.  安装所有必要的依赖 (`express`, `ws`, `@solana/web3.js`, `dotenv` 等)。
3.  搭建基础的 Express 和 WebSocket 服务器。
4.  **优先实现 `BlockCrawler` 服务**，并验证其功能。
5.  实现抽象的 `TradingService` 及 `OkxProvider`。