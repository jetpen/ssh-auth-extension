// Content script for SSH Auth Extension
// Runs in web page context to detect and handle authentication challenges

import { ChallengeDetector } from '@/shared/challenge-detector';
import { Logger } from '@/shared/logger';

class ContentScript {
  private challengeDetector: ChallengeDetector;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ContentScript');
    this.challengeDetector = new ChallengeDetector();

    this.initialize();
  }

  private initialize(): void {
    this.logger.info('Initializing content script');

    // Set up DOM observation for authentication challenges
    this.setupDOMObservation();

    // Set up form submission interception
    this.setupFormInterception();

    // Listen for messages from background script
    this.setupMessageHandling();

    // Set up extension API injection for webapp compatibility
    this.setupExtensionAPIInjection();

    // Wake the background service worker (MV3 is event-driven)
    try {
      chrome.runtime.sendMessage({ type: 'PING' }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          this.logger.warn('Background ping error:', err.message);
        } else {
          this.logger.debug('Background service pinged');
        }
      });
    } catch (e) {
      this.logger.warn('Failed to ping background:', e);
    }

    this.logger.info('Content script initialized successfully');
  }

  private setupDOMObservation(): void {
    // Observe DOM changes to detect authentication challenges
    const target = document.body || document.documentElement;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.checkForAuthChallenge(node);
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              const forms = el.querySelectorAll('form');
              forms.forEach((form) => {
                this.checkForAuthChallenge(form);
              });
            }
          });
        }
      });
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });

    // Also check the initial DOM if body exists
    if (document.body) {
      // Check the entire document body
      this.checkForAuthChallenge(document.body);

      // Find all form elements and check each one for auth challenges
      const forms = document.body.querySelectorAll('form');
      forms.forEach((form) => {
        this.logger.info('Checking form: ', form.name);
        this.checkForAuthChallenge(form);
      });
    }

    this.logger.debug('DOM observation setup complete');
  }

  private setupFormInterception(): void {
    // Intercept form submissions that might be authentication forms
    document.addEventListener('submit', (event) => {
      const targetEl = event.target as Element | null;
      const form =
        (targetEl && typeof (targetEl as any).closest === 'function'
          ? (targetEl as Element).closest('form') as HTMLFormElement | null
          : null) || (event.target as HTMLFormElement);

      if (form && this.isAuthForm(form)) {
        this.handleAuthFormSubmission(form, event);
      }
    }, true);

    this.logger.debug('Form interception setup complete');
  }

  private setupMessageHandling(): void {
    // Handle messages from background script
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      }
    );

    this.logger.debug('Message handling setup complete');
  }

  private checkForAuthChallenge(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Check for SSH authentication challenge patterns
      if (this.challengeDetector.isAuthChallenge(element)) {
        this.handleAuthChallenge(element);
      }
    }
  }

  private isAuthForm(form: HTMLFormElement): boolean {
    // Check if form appears to be an authentication form
    const inputs = form.querySelectorAll('input');
    const hasUsername = Array.from(inputs).some(input =>
      input.type === 'text' || input.name.toLowerCase().includes('user')
    );
    const hasPassword = Array.from(inputs).some(input =>
      input.type === 'password' || input.name.toLowerCase().includes('pass')
    );

    return hasUsername && hasPassword;
  }

  private handleAuthFormSubmission(form: HTMLFormElement, event: Event): void {
    this.logger.debug('Intercepted authentication form submission');

    // Check if we should handle this with SSH authentication
    event.preventDefault();

    // Send challenge to background script for processing
    chrome.runtime.sendMessage({
      type: 'AUTH_CHALLENGE',
      challenge: {
        type: 'form',
        formData: new FormData(form),
        url: window.location.href
      }
    }, (response) => {
      if (response.success && response.response) {
        // Inject the authentication response
        this.injectAuthResponse(form, response.response);
      } else {
        // Fall back to normal form submission
        form.submit();
      }
    });
  }

  private handleAuthChallenge(element: Element): void {
    this.logger.debug('Detected authentication challenge in DOM');

    const challenge = this.challengeDetector.extractChallenge(element);

    chrome.runtime.sendMessage({
      type: 'AUTH_CHALLENGE',
      challenge: {
        type: 'dom',
        element: challenge,
        url: window.location.href
      }
    }, (response) => {
      if (response.success && response.response) {
        this.injectAuthResponse(element, response.response);
      }
    });
  }

  private injectAuthResponse(target: Element | HTMLFormElement, response: any): void {
    // Inject the decrypted authentication response into the page
    if (target instanceof HTMLFormElement) {
      // For forms, try to find existing ssh_auth_response input first
      let responseInput = target.querySelector('input[name="ssh_auth_response"]') as HTMLInputElement;

      if (!responseInput) {
        // Create the element if it cannot be found
        responseInput = document.createElement('input');
        responseInput.type = 'hidden';
        responseInput.name = 'ssh_auth_response';
        target.appendChild(responseInput);
      }

      // Set the response value
      responseInput.value = response.signature;

      // Submit the form
      target.submit();
    } else {
      // For other elements, inject response via script or other means
      this.logger.debug('Injecting auth response into DOM element');
      // Implementation depends on specific challenge format
    }
  }

  private setupExtensionAPIInjection(): void {
    // Inject extension API functions into window for webapp compatibility
    if (!(window as any).SSHAuthExtension) {
      (window as any).SSHAuthExtension = {
        // Function to check if extension is available
        checkAvailability: (callback: (available: boolean) => void) => {
          this.logger.info('ContentScript: Sending PING');
          chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
            callback(response && response.success);
          });
        },

        // Function to send messages to extension
        sendMessage: (message: any, callback?: (response: any) => void) => {
          chrome.runtime.sendMessage(message, callback);
        },

        // Function to listen for messages from extension
        onMessage: (callback: (message: any) => void) => {
          const listener = (
            message: any,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: any) => void
          ) => {
            // Handle webapp-specific messages
            if (message.type && ['AUTH_SUCCESS', 'AUTH_FAILED', 'CHALLENGE_READY'].includes(message.type)) {
              callback(message);
            }
            // Always respond to keep the message channel open
            sendResponse();
          };
          chrome.runtime.onMessage.addListener(listener);
          // Store listener for potential cleanup
          (window as any).SSHAuthExtension._listener = listener;
        },

        // Function to check extension support
        isSupported: () => {
          return true; // Since we're running as content script, extension is supported
        }
      };
    }

    this.logger.debug('Extension API injection setup complete');
  }

  private handleWebappMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    // Handle messages from background script that are for webapp consumption
    switch (message.type) {
      case 'PING':
        this.logger.info('PING message detected');
        sendResponse({ success: true, status: 'alive' });
        break;

      case 'AUTH_SUCCESS':
        this.showToast('Authentication successful!', 'success');
        if (message.redirect) {
          window.location.href = message.redirect;
        }
        break;

      case 'AUTH_FAILED':
        this.showToast('Authentication failed', 'error');
        break;

      case 'CHALLENGE_READY':
        this.showToast('Challenge ready for extension', 'info');
        break;

      default:
        this.logger.warn('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  private showToast(message: string, type: string = 'info'): void {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: '10000',
      fontWeight: '500',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });

    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    // Handle internal extension messages (not for webapp)
    switch (message.type) {
      case 'PING':
        this.logger.info('PING message detected');
        sendResponse({ success: true, status: 'alive' });
        break;

      default:
        this.logger.warn('Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }
}

// Initialize the content script
new ContentScript();

// Export for testing
export { ContentScript };
