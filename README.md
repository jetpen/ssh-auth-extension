# SSH Authentication Extension

A Chromium browser extension that enables seamless SSH key-based authentication with web sites.

## Overview

This extension allows users to authenticate with web applications using their existing SSH keys, eliminating the need for separate passwords or authentication tokens for web services that support SSH-based authentication.

## Features

- **SSH Key Integration**: Configure existing SSH private keys for web authentication
- **Automatic Challenge Detection**: Automatically detects SSH authentication challenges on web pages
- **Secure Key Storage**: Keys are securely managed within the browser extension context
- **Multi-Algorithm Support**: Supports RSA, ECDSA, and Ed25519 SSH key algorithms
- **Cross-Browser Compatibility**: Works with Chrome, Firefox, Safari, and other Chromium-based browsers

## Installation

### Development Setup

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load in Browser**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

### Development Workflow

- **Watch Mode**: `npm run dev` - Automatically rebuilds on file changes
- **Testing**: `npm test` - Run the test suite
- **Linting**: `npm run lint` - Check code style

## Usage

1. **Configure SSH Key**
   - Click the extension icon in the browser toolbar
   - Enter the path to your SSH private key file
   - Optionally enter the key passphrase
   - Click "Configure Key"

2. **Automatic Authentication**
   - Navigate to a web site that supports SSH authentication
   - The extension will automatically detect authentication challenges
   - Authentication happens seamlessly in the background

## Architecture

### Components

- **Background Service**: Network monitoring and key management
- **Content Script**: DOM observation and challenge detection
- **Popup Interface**: User configuration and status display
- **Shared Utilities**: Common functionality (logging, crypto, etc.)

### Security Model

- Private keys never leave the background service context
- Challenge-response authentication prevents key exposure
- Secure storage using browser extension APIs
- No external network communication of sensitive data

## Development

### Project Structure

```
ssh-auth-extension/
├── src/
│   ├── background/          # Background service worker
│   ├── content/            # Content scripts
│   ├── popup/              # Extension popup UI
│   ├── shared/             # Shared utilities and types
│   └── manifest.json       # Extension manifest
├── dist/                   # Built extension bundle
├── test/                   # Test files
├── memory-bank/            # Project documentation
└── package.json           # Node.js dependencies
```

### Key Files

- `src/manifest.json` - Extension manifest (Manifest V3)
- `src/background/index.ts` - Main background service
- `src/content/index.ts` - Content script for web pages
- `src/popup/index.ts` - Popup UI logic
- `webpack.config.js` - Build configuration
- `jest.config.js` - Test configuration

## API Reference

### Message Types

#### Background Service Messages

- `GET_STATUS` - Get extension status
- `CONFIGURE_KEY` - Configure SSH key
- `AUTH_CHALLENGE` - Handle authentication challenge

#### Response Format

```typescript
{
  success: boolean;
  error?: string;
  status?: any;
  response?: any;
}
```

## Testing

Run the test suite:

```bash
npm test
```

Tests include:
- Unit tests for utility functions
- Integration tests for component interactions
- Browser automation tests with Puppeteer

## Contributing

1. Follow the existing code style and architecture patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure security best practices are maintained

## Security Considerations

- SSH private keys are handled with extreme care
- Keys never transmitted over network
- Cryptographic operations isolated to secure contexts
- Regular security audits recommended

## License

MIT License - see LICENSE file for details

## Version History

See [CHANGELOG.md](memory-bank/changelog.md) for version history and changes.
