// ChallengeDetector identifies SSH authentication challenges in web content

import { Logger } from './logger';

export interface ChallengeData {
  type: string;
  challenge: string;
  algorithm?: string;
  publicKey?: string;
}

export class ChallengeDetector {
  private logger: Logger;

  // Patterns that indicate SSH authentication challenges
  private challengePatterns = [
    /ssh.*challenge/i,
    /authentication.*challenge/i,
    /ssh.*auth/i,
    /publickey.*challenge/i,
    /ssh-rsa.*challenge/i,
    /ecdsa.*challenge/i,
    /ed25519.*challenge/i
  ];

  // HTML attributes that might contain challenges
  private challengeAttributes = [
    'data-ssh-challenge',
    'data-auth-challenge',
    'data-challenge',
    'ssh-challenge',
    'auth-challenge'
  ];

  // Form field names that indicate SSH auth
  private challengeFields = [
    'ssh_challenge',
    'auth_challenge',
    'challenge',
    'ssh_auth_challenge'
  ];

  constructor() {
    this.logger = new Logger('ChallengeDetector');
  }

  isAuthChallenge(element: Element): boolean {
    // Check if element contains SSH authentication challenge indicators
    return this.checkElementContent(element) ||
           this.checkElementAttributes(element) ||
           this.checkFormFields(element);
  }

  extractChallenge(element: Element): ChallengeData | null {
    // Extract challenge data from element
    this.logger.debug('Extracting challenge from element');

    // Try different methods to extract challenge
    let challenge = this.extractFromAttributes(element);
    if (challenge) return challenge;

    challenge = this.extractFromContent(element);
    if (challenge) return challenge;

    challenge = this.extractFromForm(element);
    if (challenge) return challenge;

    this.logger.warn('Could not extract challenge from element');
    return null;
  }

  private checkElementContent(element: Element): boolean {
    const textContent = element.textContent || '';
    return this.challengePatterns.some(pattern => pattern.test(textContent));
  }

  private checkElementAttributes(element: Element): boolean {
    for (const attr of this.challengeAttributes) {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        if (value && this.challengePatterns.some(pattern => pattern.test(value))) {
          return true;
        }
      }
    }
    return false;
  }

  private checkFormFields(element: Element): boolean {
    if (element.tagName.toLowerCase() === 'form') {
      const form = element as HTMLFormElement;
      const inputs = Array.from(form.querySelectorAll('input, textarea, select'));

      for (const input of inputs) {
        const name = (input as HTMLInputElement).name.toLowerCase();
        if (this.challengeFields.includes(name)) {
          return true;
        }

        const value = (input as HTMLInputElement).value || '';
        if (this.challengePatterns.some(pattern => pattern.test(value))) {
          return true;
        }
      }
    }
    return false;
  }

  private extractFromAttributes(element: Element): ChallengeData | null {
    for (const attr of this.challengeAttributes) {
      const value = element.getAttribute(attr);
      if (value) {
        return this.parseChallengeString(value);
      }
    }
    return null;
  }

  private extractFromContent(element: Element): ChallengeData | null {
    const textContent = element.textContent || '';
    if (this.challengePatterns.some(pattern => pattern.test(textContent))) {
      return this.parseChallengeString(textContent);
    }
    return null;
  }

  private extractFromForm(element: Element): ChallengeData | null {
    if (element.tagName.toLowerCase() === 'form') {
      const form = element as HTMLFormElement;
      const inputs = Array.from(form.querySelectorAll('input[name], textarea[name]'));

      for (const input of inputs) {
        const name = (input as HTMLInputElement).name.toLowerCase();
        if (this.challengeFields.includes(name)) {
          const value = (input as HTMLInputElement).value;
          if (value) {
            return this.parseChallengeString(value);
          }
        }
      }
    }
    return null;
  }

  private parseChallengeString(challengeStr: string): ChallengeData | null {
    // Parse challenge string into structured data
    this.logger.debug('Parsing challenge string:', challengeStr.substring(0, 50) + '...');

    try {
      // Try to parse as JSON first
      const jsonChallenge = JSON.parse(challengeStr);
      if (jsonChallenge.challenge || jsonChallenge.data) {
        return {
          type: jsonChallenge.type || 'ssh',
          challenge: jsonChallenge.challenge || jsonChallenge.data,
          algorithm: jsonChallenge.algorithm,
          publicKey: jsonChallenge.publicKey
        };
      }
    } catch (e) {
      // Not JSON, continue with other parsing
    }

    // Parse as plain challenge string
    // Look for algorithm indicators
    let algorithm = 'ssh-rsa'; // default
    if (challengeStr.includes('ecdsa')) {
      algorithm = 'ecdsa-sha2-nistp256';
    } else if (challengeStr.includes('ed25519')) {
      algorithm = 'ssh-ed25519';
    }

    return {
      type: 'ssh',
      challenge: challengeStr.trim(),
      algorithm
    };
  }
}
