# Contributing to Voice-First AI Learning Assistant

Thank you for your interest in contributing to this project! This is a hackathon project for AWS AI for Bharat, and we welcome contributions that help make quality AI-powered education accessible to Indian students.

## 🎯 Project Goals

- Make AI-powered learning accessible at ₹49-99/month (vs ₹1,650 for ChatGPT Plus)
- Achieve 98% cost reduction through smart architecture
- Support multilingual learning (English, Hindi, Hinglish)
- Provide voice-first interaction for distraction-free learning

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/beadyks/ai-learning-productivity-hackathon.git
   cd ai-learning-productivity-hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS credentials**
   ```bash
   aws configure
   ```

4. **Deploy infrastructure (optional for development)**
   ```bash
   ./infrastructure/deploy.sh
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📝 Code Style

### TypeScript
- Use TypeScript for all Lambda functions and infrastructure code
- Follow the existing code style (ESLint configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Lambda Functions
- Keep functions small and focused (single responsibility)
- Use async/await for asynchronous operations
- Implement proper error handling
- Add CloudWatch logging for debugging

### Infrastructure
- Use AWS CDK constructs
- Follow AWS best practices for security and cost optimization
- Document all infrastructure changes

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run property-based tests
npm run test:property
```

### Writing Tests
- Write unit tests for all new functions
- Add integration tests for end-to-end flows
- Use property-based testing for universal properties
- Ensure tests are deterministic and fast

## 📚 Documentation

### Required Documentation
- Update README.md if adding new features
- Add JSDoc comments to functions
- Update architecture diagrams if changing infrastructure
- Document API endpoints and data models

### Documentation Files
- `README.md` - Main project documentation
- `infrastructure/ARCHITECTURE.md` - Architecture details
- `.kiro/specs/voice-first-ai-learning-assistant/` - Requirements and design

## 🔄 Pull Request Process

1. **Fork the repository**
   - Click "Fork" on GitHub
   - Clone your fork locally

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write code following the style guide
   - Add tests for new functionality
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   ```
   
   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a pull request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Submit for review

## 🐛 Reporting Bugs

### Before Reporting
- Check if the bug has already been reported
- Verify it's reproducible
- Collect relevant information (logs, screenshots, etc.)

### Bug Report Template
```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- AWS Region: [e.g., us-east-1]

**Logs**
```
Paste relevant logs here
```
```

## 💡 Feature Requests

We welcome feature requests! Please:
1. Check if the feature has already been requested
2. Describe the feature and its use case
3. Explain how it aligns with project goals
4. Consider implementation complexity and cost impact

## 🔐 Security

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## 📋 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose:
- Maintainers will review your code
- Address any feedback or requested changes
- Once approved, your PR will be merged

## 🎓 Learning Resources

### AWS Services Used
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [Amazon DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [Amazon S3](https://docs.aws.amazon.com/s3/)
- [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Amazon Cognito](https://docs.aws.amazon.com/cognito/)

### Development Tools
- [AWS CDK](https://docs.aws.amazon.com/cdk/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Jest Testing](https://jestjs.io/docs/getting-started)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Focus on constructive feedback

## 📞 Questions?

- Open an issue for general questions
- Check existing documentation first
- Join discussions in pull requests
- Contact maintainers for specific concerns

## 🙏 Acknowledgments

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to making quality AI-powered education accessible to Indian students! 🇮🇳

---

**Happy Coding!** 🚀
