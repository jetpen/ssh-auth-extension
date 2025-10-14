// Background service worker for SSH Auth Extension
// Handles network monitoring, key management, and authentication coordination

import { AuthCoordinator } from '@/shared/auth-coordinator';
import { KeyManager } from '@/shared/key-manager';
import { Logger } from '@/shared/logger';

class BackgroundService {
  private authCoordinator: AuthCoordinator;
  private keyManager: KeyManager;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BackgroundService');
    this.keyManager = new KeyManager();
    this.authCoordinator = new AuthCoordinator(this.keyManager);

    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info('Initializing SSH Auth Extension background service');

    // Set up network request monitoring
    this.setupNetworkMonitoring();

    // Set up message handling for popup and content scripts
    this.setupMessageHandling();

    // Initialize key manager
    await this.keyManager.initialize();

    this.logger.info('Background service initialized successfully');
  }

  private setupNetworkMonitoring(): void {
    // Monitor network requests for SSH authentication challenges
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        return this.authCoordinator.handleNetworkRequest(details);
      },
      { urls: ['<all_urls>'] },
      ['blocking', 'requestBody']
    );

    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        return this.authCoordinator.handleRequestHeaders(details);
      },
      { urls: ['<all_urls>'] },
      ['blocking', 'requestHeaders']
    );

    this.logger.debug('Network monitoring setup complete');
  }

  private setupMessageHandling(): void {
    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async responses
      }
    );

    this.logger.debug('Message handling setup complete');
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'GET_STATUS':
          sendResponse({
            success: true,
            status: await this.getExtensionStatus()
          });
          break;

        case 'CONFIGURE_KEY':
          await this.keyManager.configureKey(message.keyContent, message.passphrase, message.keyFileName);
          sendResponse({ success: true });
          break;

        case 'AUTH_CHALLENGE':
          const response = await this.authCoordinator.handleAuthChallenge(message.challenge);
          sendResponse({ success: true, response });
          break;

        default:
          this.logger.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      this.logger.error('Message handling error:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async getExtensionStatus(): Promise<any> {
    return {
      initialized: true,
      keyConfigured: await this.keyManager.isKeyConfigured(),
      version: chrome.runtime.getManifest().version
    };
  }
}

// Initialize the background service
new BackgroundService();

// Export for testing
export { BackgroundService };
