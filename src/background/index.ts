// Background service worker for SSH Auth Extension
// Handles network monitoring, key management, and authentication coordination

import { AuthCoordinator } from '@/shared/auth-coordinator';
import { KeyManager } from '@/shared/key-manager';
import { Logger } from '@/shared/logger';

class BackgroundService {
  private authCoordinator: AuthCoordinator;
  private keyManager: KeyManager;
  private logger: Logger;
  private ready: Promise<void>;
  private isReady = false;
  private networkMonitoringSetup = false;

  constructor() {
    this.logger = new Logger('BackgroundService');
    this.keyManager = new KeyManager();
    this.authCoordinator = new AuthCoordinator(this.keyManager);

    // Kick off async initialization and capture the Promise to avoid unhandled rejections
    this.ready = this.initialize().catch((error) => {
      // Ensure initialization errors are captured and logged to avoid unhandled promise rejections
      this.logger.error('Background service initialization failed during constructor', error);
    });
  }

  private async initialize(): Promise<void> {
    this.logger.debug('initialize() called');
    this.logger.info('Initializing SSH Auth Extension background service');

    try {
      // Set up network request monitoring
      this.logger.debug('Setting up network monitoring');
      this.setupNetworkMonitoring();

      // Message handling is attached at global scope (see bottom bootstrap)
      this.logger.debug('Message handling attached globally');

      // Initialize key manager
      this.logger.debug('Initializing key manager');
      await this.keyManager.initialize();

      this.isReady = true;
      this.logger.info('Background service initialized successfully');
    } catch (error) {
      this.logger.error('Background service initialization failed', error);
      // Re-throw to allow constructor's catch to capture and keep "ready" rejected
      throw error;
    }
  }

  private setupNetworkMonitoring(): void {
    if (this.networkMonitoringSetup) {
      this.logger.debug('Network monitoring already set up; skipping');
      return;
    }

    // Monitor network requests for SSH authentication challenges
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        try {
          this.authCoordinator.handleNetworkRequest(details);
        } catch (err) {
          this.logger.error('Error in handleNetworkRequest', err);
        }
      },
      { urls: ['<all_urls>'] },
      ['requestBody']
    );

    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        try {
          this.authCoordinator.handleRequestHeaders(details);
        } catch (err) {
          this.logger.error('Error in handleRequestHeaders', err);
        }
      },
      { urls: ['<all_urls>'] },
      // Include extraHeaders to reliably access certain headers in MV3
      ['requestHeaders', 'extraHeaders']
    );

    this.networkMonitoringSetup = true;
    this.logger.debug('Network monitoring setup complete');
  }

  private setupMessageHandling(): void {
    // Message handling is attached globally to ensure service construction; no per-instance listener required.
    this.logger.debug('Message handling attached globally; no instance listener needed');
  }

  public async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      // Ensure service is ready before handling most messages
      if (message?.type !== 'PING') {
        await this.ready;
      }
      switch (message.type) {
        case 'GET_STATUS':
          this.logger.info('Responding to GET_STATUS');
          sendResponse({
            success: true,
            status: await this.getExtensionStatus()
          });
          break;

        case 'CONFIGURE_KEY':
          await this.keyManager.configureKey(message.keyContent, message.passphrase, message.keyFileName);
          this.logger.info('Responding to CONFIGURE_KEY');
          sendResponse({ success: true });
          break;

        case 'AUTH_CHALLENGE':
          const response = await this.authCoordinator.handleAuthChallenge(message.challenge);
          this.logger.info('Responding to AUTH_CHALLENGE');
          sendResponse({ success: true, response });
          break;

        case 'PING':
          this.logger.info('Responding to PING');
          sendResponse({ success: true, status: 'alive' });
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
      initialized: this.isReady,
      keyConfigured: await this.keyManager.isKeyConfigured(),
      version: chrome.runtime.getManifest().version
    };
  }
}

// Singleton bootstrap to ensure construction in MV3 event-driven lifecycle
let __backgroundService__: BackgroundService | null = null;
function ensureBackgroundService() {
  if (!__backgroundService__) {
    __backgroundService__ = new BackgroundService();
  }
}

// Eager ensure on worker start (when Chrome spins up the worker)
ensureBackgroundService();

// Also ensure on key lifecycle events to guarantee listeners are registered early
chrome.runtime.onInstalled.addListener(() => {
  ensureBackgroundService();
});
chrome.runtime.onStartup.addListener(() => {
  ensureBackgroundService();
});

// Ensure on first message as well (e.g., from content script PING)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ensureBackgroundService();
  // Delegate to service message handler
  __backgroundService__!.handleMessage(message, sender, sendResponse);
  return true;
});

// Export for testing
export { BackgroundService };
