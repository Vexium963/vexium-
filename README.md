# VexiumVerse Discord Bot 🚀

<div align="center">
  <img src="./docs/images/logo.png" alt="VexiumVerse Logo" width="200" height="200">

**The Ultimate Discord Economy Bot with Immersive Features**

[![Discord.js](https://img.shields.io/badge/discord.js-v14.14.1-blue.svg)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/node.js-18.0.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/Vexium963/vexium-.svg)](https://github.com/Vexium963/vexium-/graphs/contributors)
[![Stars](https://img.shields.io/github/stars/Vexium963/vexium-.svg)](https://github.com/Vexium963/vexium-/stargazers)
[![Issues](https://img.shields.io/github/issues/Vexium963/vexium-.svg)](https://github.com/Vexium963/vexium-/issues)

[📖 Documentation](https://vexiumverse.github.io/docs) •
[🤖 Invite Bot](https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=274877906944&scope=bot%20applications.commands) •
[💬 Support Server](https://discord.gg/vexiumverse) •
[🔗 Website](https://vexiumverse.com)

</div>

-----

## 🎮 Demo

<div align="center">
  <img src="./docs/images/demo.gif" alt="VexiumVerse Demo" width="600">
</div>

## ✨ Features

### 🏦 **Advanced Economy System**

- 💰 **Multi-layered Banking**: Wallet + Bank with interest rates up to 6% daily
- 📈 **Investment Portfolio**: Crypto, stocks, bonds, real estate with real-time tracking
- 💼 **Dynamic Work System**: 15+ job types with skill progression
- 🎁 **Daily Rewards**: Streak bonuses and randomized rewards

### 🛍️ **Comprehensive Marketplace**

- 🏪 **Multi-category Shop**: Tools, consumables, cosmetics with 20+ items
- 📦 **Smart Inventory**: Item stacking, usage tracking, and auto-organization
- ⚡ **Consumable Effects**: Energy drinks, luck potions, XP boosters
- 🔧 **Equipment System**: Unlocks new jobs and improves earnings

### 🎰 **Entertainment Hub**

- 🎲 **Skill-Based Entertainment Games**: Slots, coin flip, dice with strategic elements (21+ verification required)
- 📊 **Advanced Statistics**: Win rates, profit tracking, responsible limits
- 🏆 **Achievement System**: 50+ achievements with progression rewards

### 👥 **Social Features**

- 🤝 **Secure Trading**: Player-to-player item and coin exchange
- 🎁 **Gift System**: Send items/coins to friends with messages
- 🏅 **Dynamic Leaderboards**: 8 ranking categories with pagination
- 🎯 **Random Acts**: Anonymous gift system for community building

### 🎨 **Deep Customization**

- 🖼️ **Profile System**: Custom colors, bios, status messages
- 👑 **Avatar Frames**: Unlock premium borders and effects
- 🏅 **Badge Collection**: Display achievements and special status
- 💎 **Crypto Integration**: Link MetaMask, Coinbase, Trust Wallet, Phantom

### 🛡️ **Enterprise Security**

- 📋 **Complete Audit Trail**: Every transaction logged with timestamps
- 🔒 **Anti-abuse Protection**: Rate limiting, validation, and monitoring
- 🛠️ **Admin Dashboard**: User management, statistics, announcements
- 💾 **Auto-backup System**: Scheduled data protection

-----

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **Discord Bot Token** ([Get one here](https://discord.com/developers/applications))
- **Git** for version control

### ⚡ One-Click Deploy

[![Deploy on Replit](https://replit.com/badge/github/Vexium963/vexium-)](https://replit.com/@Vexium963/vexium-)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Vexium963/vexium-)
[![Run on Railway](https://railway.app/button.svg)](https://railway.app/new/template/VexiumVerse)

### 🔧 Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/Vexium963/vexium-.git
cd vexium-

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your bot token and settings

# 4. Deploy slash commands
npm run deploy

# 5. Start the bot
npm start
```

### 🐳 Docker Deployment

```bash
# Using Docker Compose (Recommended)
docker-compose up -d

# Or build manually
docker build -t vexiumverse-bot .
docker run -d --env-file .env vexiumverse-bot
```

-----

## 📊 Commands Overview

<details>
<summary><b>💰 Economy Commands</b></summary>

| Command  | Description                              | Usage                    |
|----------|------------------------------------------|--------------------------|
| `/start` | Begin your VexiumVerse journey           | `/start`                 |
| `/daily` | Claim daily rewards (up to 7-day streaks)| `/daily`                 |
| `/work`  | Work various jobs to earn VexCoins       | `/work [job]`            |
| `/wallet`| Check balance and statistics             | `/wallet [user]`         |
| `/invest`| Manage investment portfolio              | `/invest buy crypto 1000`|
| `/entertainment`| Play skill-based games: slots, dice, coinflip | `/entertainment slots 100` |

</details>

<details>
<summary><b>🏦 Banking Commands</b></summary>

| Command    | Description                        | Usage                 |
|------------|------------------------------------|-----------------------|
| `/deposit` | Deposit coins with interest options| `/deposit 5000 1month`|
| `/withdraw`| Withdraw from bank account         | `/withdraw 2000`      |
| `/bank`    | View detailed bank information     | `/bank status`        |

</details>

<details>
<summary><b>🛍️ Shopping Commands</b></summary>

| Command | Description              | Usage                    |
|---------|--------------------------|--------------------------|
| `/shop` | Browse and purchase items| `/shop browse tools`     |
| `/use`  | Use items from inventory | `/use energy_drink 2`    |
| `/trade`| Trade with other players | `/trade offer @user 1000`|

</details>

<details>
<summary><b>👥 Social Commands</b></summary>

| Command       | Description                | Usage                         |
|---------------|----------------------------|-------------------------------|
| `/profile`    | View and customize profiles| `/profile customize`          |
| `/gift`       | Send gifts to friends      | `/gift send @user 500`        |
| `/leaderboard`| View various rankings      | `/leaderboard networth`       |
| `/linkwallet` | Connect crypto wallets     | `/linkwallet connect metamask`|

</details>

<details>
<summary><b>🛡️ Admin Commands</b></summary>

| Command | Description             | Usage                          |
|---------|-------------------------|--------------------------------|
| `/admin`| Manage users and economy| `/admin balance @user add 1000`|
| `/logs` | View system logs        | `/logs transactions`           |

</details>

-----

## 📸 Screenshots

<div align="center">
  <img src="./docs/images/screenshots/economy.png" alt="Economy System" width="400">
  <img src="./docs/images/screenshots/trading.png" alt="Trading System" width="400">
  <img src="./docs/images/screenshots/profile.png" alt="Profile Customization" width="400">
  <img src="./docs/images/screenshots/leaderboard.png" alt="Leaderboards" width="400">
</div>

-----

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord API   │────│  Command Layer  │────│   Game Logic    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│  Event System   │────│   Database      │
└─────────────────┘    └─────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│   Utilities     │────│    Security     │
└─────────────────┘    └─────────────────┘
```

### 🔧 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Discord.js v14
- **Database**: JSON-based (PostgreSQL/MongoDB ready)
- **Security**: Custom audit logging, rate limiting
- **Deployment**: Docker, Heroku, Railway, Replit

-----

## 🤝 Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🚀 Quick Contribution Steps

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### 🎯 Areas We Need Help

- 🌐 Multi-language support
- 📱 Mobile-responsive embeds
- 🔌 Third-party integrations
- 🧪 Test coverage improvements
- 📚 Documentation enhancements

-----

## 📖 Documentation

- **[API Reference](docs/API.md)** - Complete function documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup instructions
- **[Command Reference](docs/COMMANDS.md)** - Detailed command usage
- **[Security Guide](SECURITY.md)** - Security best practices

-----

## 🗺️ Roadmap

### 🔮 Upcoming Features (v2.0)

- [ ] **Guild Wars**: Server vs server competitions
- [ ] **NFT Integration**: Mint and trade unique items
- [ ] **DeFi Features**: Yield farming, liquidity pools
- [ ] **Mobile App**: React Native companion
- [ ] **AI Trading**: Automated investment strategies

### 📈 Current Version (v1.0)

- [x] Complete economy system
- [x] Advanced trading platform
- [x] Profile customization
- [x] Crypto wallet integration
- [x] Admin dashboard

-----

## 📊 Statistics

<div align="center">

![GitHub language count](https://img.shields.io/github/languages/count/Vexium963/vexium-)
![GitHub top language](https://img.shields.io/github/languages/top/Vexium963/vexium-)
![GitHub code size](https://img.shields.io/github/languages/code-size/Vexium963/vexium-)
![GitHub repo size](https://img.shields.io/github/repo-size/Vexium963/vexium-)

</div>

-----

## 💝 Support the Project

If VexiumVerse has helped your Discord community, consider supporting us:

- ⭐ **Star this repository**
- 🐛 **Report bugs and suggest features**
- 📢 **Share with your friends**
- ☕ **[Buy us a coffee](https://ko-fi.com/vexiumverse)**
- 💎 **[Become a sponsor](https://github.com/sponsors/Vexium963)**

-----

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

-----

## 🙏 Acknowledgments

- **[Discord.js](https://discord.js.org/)** for the amazing Discord API wrapper
- **Community Contributors** who helped shape VexiumVerse
- **Beta Testers** from our Discord server
- **Open Source Projects** that inspired our features

-----

## 📞 Support

- **📧 Email**: support@vexiumverse.com
- **💬 Discord**: [Join our server](https://discord.gg/vexiumverse)
- **🐛 Issues**: [GitHub Issues](https://github.com/Vexium963/vexium-/issues)
- **💡 Features**: [GitHub Discussions](https://github.com/Vexium963/vexium-/discussions)

-----

<div align="center">
  <b>Made with ❤️ by the VexiumVerse Team</b><br>
  <i>Creating immersive Discord experiences since 2024</i>

[![GitHub followers](https://img.shields.io/github/followers/Vexium963?style=social)](https://github.com/Vexium963)
[![Twitter Follow](https://img.shields.io/twitter/follow/VexiumVerse?style=social)](https://twitter.com/VexiumVerse)

</div>
