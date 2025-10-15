# Technical Context

## Technologies Used

### Core Technologies
- **Chromium Extension APIs**: WebExtensions API for browser integration
- **JavaScript/TypeScript**: Primary programming language
- **Web Cryptography API**: For cryptographic operations (where supported)
- **Node.js Cryptography**: Fallback crypto implementation for complex operations

### Browser Compatibility
- **Target Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Extension Manifest**: V3 (required for modern browsers)
- **API Compatibility**: WebExtensions standard with browser-specific fallbacks

## Development Setup

### Environment Requirements
- **Node.js**: v16+ for build tools and development
- **npm/yarn**: Package management
- **Git**: Version control
- **Chromium Browser**: For testing and development

### Development Tools
- **Build System**: Webpack for bundling and optimization
- **Testing Framework**: Jest for unit tests, Puppeteer for integration tests
- **Linting**: ESLint with extension-specific rules
- **Type Checking**: TypeScript compiler

### Project Structure
```
ssh-auth-extension/
├── src/
│   ├── background/
│   │   └── index.ts          # Background service worker
│   ├── content/
│   │   └── index.ts          # Content scripts for web pages
│   ├── icons/
│   │   ├── icon16.svg        # Extension icon (16×16)
│   │   ├── icon32.svg        # Extension icon (32×32)
│   │   ├── icon48.svg        # Extension icon (48×48)
│   │   └── icon128.svg       # Extension icon (128×128)
│   ├── popup/
│   │   ├── index.ts          # Popup UI logic
│   │   └── popup.html        # Extension popup interface
│   ├── shared/
│   │   ├── auth-coordinator.ts    # Authentication coordination
│   │   ├── challenge-detector.ts  # Challenge detection
│   │   ├── key-manager.ts         # SSH key management
│   │   └── logger.ts              # Logging utility
│   └── manifest.json         # Extension manifest (Manifest V3)
├── dist/                     # Built extension bundle
├── test/
│   ├── setup.ts             # Test configuration
│   └── logger.test.ts       # Sample test
├── memory-bank/             # Project documentation
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Build configuration
├── jest.config.js          # Test configuration
└── README.md               # Project documentation
```

## Technical Constraints

### Security Constraints
- **No External Dependencies**: Cannot rely on external crypto libraries in production
- **Key Isolation**: Private keys must remain in background context
- **Permission Minimalism**: Only request necessary browser permissions
- **CSP Compliance**: Must work within Content Security Policy restrictions

### Performance Constraints
- **Memory Limits**: Extensions have memory constraints in browsers
- **Execution Time**: Background operations must be efficient
- **Network Impact**: Minimal latency added to web requests
- **Bundle Size**: Keep extension size under reasonable limits

### Browser API Constraints
- **File System Access**: Limited direct file access in browsers
- **Cryptography**: Web Crypto API has algorithm limitations
- **Storage**: chrome.storage has quota limits
- **Networking**: Restricted cross-origin request capabilities

## Dependencies

### Runtime Dependencies
- **Chrome Extension APIs**: Built-in browser APIs
- **Web Crypto API**: For supported cryptographic operations
- **DOM APIs**: For content script interactions and API injection

### Extension-Webapp Integration
- **API Injection**: Content scripts inject SSHAuthExtension API into webapp window object
- **Message Mediation**: Content scripts handle all communication between webapps and extension
- **Security Boundaries**: Maintains isolation between extension and webapp contexts

### Development Dependencies
- **TypeScript**: ^4.9.0 - Type checking and compilation
- **Webpack**: ^5.75.0 - Module bundling and optimization
- **Jest**: ^29.0.0 - Testing framework
- **ESLint**: ^8.30.0 - Code linting
- **Puppeteer**: ^19.0.0 - Browser automation for testing

### Build Dependencies
- **webpack-cli**: Command line interface for webpack
- **ts-loader**: TypeScript loader for webpack
- **copy-webpack-plugin**: Copy static assets
- **clean-webpack-plugin**: Clean build directory

## Tool Usage Patterns

### Build Process
```bash
npm run build     # Production build
npm run dev       # Development build with watch
npm run test      # Run test suite
npm run lint      # Code linting
```

### Development Workflow
1. **Code Changes**: Modify source files in `src/`
2. **Build**: Run `npm run dev` for development builds
3. **Test**: Execute `npm run test` to verify functionality
4. **Load Extension**: Load `dist/` directory in browser developer mode
5. **Debug**: Use browser dev tools and extension debugger

### Testing Strategy
- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test component interactions
- **Browser Tests**: Automated tests using Puppeteer
- **Manual Testing**: Real-world browser testing scenarios

### Code Quality
- **TypeScript Strict Mode**: Enabled for type safety
- **ESLint Rules**: Extension-specific linting rules
- **Pre-commit Hooks**: Automated quality checks
- **Code Coverage**: Minimum 80% coverage requirement
