# 项目背景
想实现像 FomoX 一样的链上交易平台，但只有一个人独立开发，需要简化点技术栈，只会 ts。并且资金有限，数据使用 OKX OS、Jup、dexscreener 的免费 api。而且 rpc 只能使用节点服务商的免费版，先做出个大概出来，吸引投资人，有钱了再把三方数据替换成自己实现的。

# 技术方案要求
## 后端
1. 使用 nodejs 框架，但需要使用 ts 搭建项目。
2. 交易使用 okx 官方 sdk，但不要直接依赖，需要抽象出来，方便后续有钱了替换服务商。
3. 其他按照你的技术栈来，并且简化成独立开发者能能维护的程度。
4. 爬块的部分是重点，帮我实现
5. 使用 pnpm
6. 要支持 websocket
7. 支持 OKX OS 里的免费接口 
 
## 前端(先不做)
1. 前端框架：使用 react + ts，并且使用 antd 组件库。

## 三方服务
1. OKX OS 免费接口：https://web3.okx.com/build/docs/waas/okx-waas-what-is-waas
2. OKX dex sdk https://github.com/okx/okx-dex-sdk
3. jup api: https://dev.jup.ag/
4. 交易加速：https://bloxroute.com/
5. 交易防夹 MEV: https://docs.jito.wtf/lowlatencytxnsend/
6. 钱包管理：https://www.turnkey.com/
7. rpc 节点服务商：helius、quicknode
