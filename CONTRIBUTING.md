# Contributing to VexiumVerse Bot

Thank you for your interest in contributing to VexiumVerse! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git
- Discord Bot Token (for testing)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/vexium-.git
   cd vexium-
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your test bot credentials
   ```

4. **Run setup**
   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

- Use ESLint and Prettier configurations provided
- Follow existing code patterns and naming conventions
- Write descriptive commit messages
- Add comments for complex logic

### File Structure

```
commands/
├── economy/     # Economy-related commands
├── bank/        # Banking commands
├── social/      # Social features
├── customization/ # Profile customization
└── admin/       # Administrative commands

database/
├── models/      # Data models
└── migrations/  # Database migrations

utils/
├── constants.js # Game constants
├── economics.js # Economic calculations
├── security.js  # Security utilities
└── progression.js # Level/achievement system
```

### Command Structure

All commands should follow this structure:

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const constants = require('../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commandname')
        .setDescription('Command description'),
    
    cooldown: 5, // seconds
    
    async execute(interaction) {
        // Command logic here
    },
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Writing Tests

- Write tests for new features
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies

Example test:

```javascript
const Economics = require('../utils/economics');

describe('Economics', () => {
    test('should calculate work pay correctly', () => {
        const pay = Economics.calculateWorkPay('cashier', 5, {});
        expect(pay).toBeGreaterThan(0);
        expect(pay).toBeLessThan(1000);
    });
});
```

## 🎯 Contributing Areas

### High Priority

- **Performance Optimization**: Database queries, memory usage
- **Security Enhancements**: Input validation, rate limiting
- **User Experience**: Better error messages, intuitive commands
- **Documentation**: Code comments, API documentation

### Medium Priority

- **New Features**: Additional games, investment types
- **Integrations**: External APIs, webhooks
- **Analytics**: Usage tracking, performance metrics
- **Localization**: Multi-language support

### Low Priority

- **UI Improvements**: Better embeds, formatting
- **Quality of Life**: Shortcuts, aliases
- **Easter Eggs**: Hidden features, special events

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create Pull Request**
   - Use the PR template
   - Describe your changes
   - Link related issues
   - Add screenshots if applicable

### PR Requirements

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Performance impact considered
- [ ] Security implications reviewed

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: Node.js version, OS, Discord.js version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Error logs**: Full error messages

Use this template:

```markdown
**Bug Description**
A clear description of the bug.

**To Reproduce**
1. Run command `/example`
2. Enter invalid input
3. See error

**Expected Behavior**
Should show helpful error message.

**Actual Behavior**
Bot crashes with unclear error.

**Environment**
- Node.js: 18.17.0
- Discord.js: 14.14.1
- OS: Ubuntu 20.04
```

## 💡 Feature Requests

When suggesting features:

- **Use case**: Why is this feature needed?
- **Description**: What should the feature do?
- **Implementation**: How might it work?
- **Alternatives**: Other solutions considered?

## 🔒 Security

- Report security vulnerabilities privately to security@vexiumverse.com
- Do not create public issues for security problems
- Follow responsible disclosure practices

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

### Enforcement

Instances of abusive behavior may be reported to the project maintainers.

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special Discord roles in our community server

## 📞 Getting Help

- **Discord**: [Join our server](https://discord.gg/vexiumverse)
- **Issues**: [GitHub Issues](https://github.com/Vexium963/vexium-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Vexium963/vexium-/discussions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to VexiumVerse! 🚀
