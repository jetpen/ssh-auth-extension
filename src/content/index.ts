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

    this.logger.info('Content script initialized successfully');
  }

  private setupDOMObservation(): void {
    // Observe DOM changes to detect authentication challenges
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            this.checkForAuthChallenge(node);
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check the initial DOM
    this.checkForAuthChallenge(document.body);

    this.logger.debug('DOM observation setup complete');
  }

  private setupFormInterception(): void {
    // Intercept form submissions that might be authentication forms
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (this.isAuthForm(form)) {
        this.handleAuthFormSubmission(form, event);
      }
    });

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
      // For forms, add hidden input with response
      const responseInput = document.createElement('input');
      responseInput.type = 'hidden';
      responseInput.name = 'ssh_auth_response';
      responseInput.value = response.signature;
      target.appendChild(responseInput);

      // Submit the form
      target.submit();
    } else {
      // For other elements, inject response via script or other means
      this.logger.debug('Injecting auth response into DOM element');
      // Implementation depends on specific challenge format
    }
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    // Handle messages from background script
    switch (message.type) {
      case 'PING':
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
