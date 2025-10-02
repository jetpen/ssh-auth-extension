// KeyManager handles SSH key loading, storage, and basic validation

import { Logger } from './logger';

export interface SSHKeyConfig {
  keyPath: string;
  passphrase?: string;
  publicKey?: string;
  privateKey?: string;
}

export class KeyManager {
  private logger: Logger;
  private config: SSHKeyConfig | null = null;

  constructor() {
    this.logger = new Logger('KeyManager');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing key manager');

    // Load saved configuration
    try {
      const result = await chrome.storage.local.get(['sshKeyConfig']);
      if (result.sshKeyConfig) {
        this.config = result.sshKeyConfig;
        this.logger.info('Loaded saved key configuration');
      }
    } catch (error) {
      this.logger.error('Failed to load key configuration:', error);
    }
  }

  async configureKey(keyPath: string, passphrase?: string): Promise<void> {
    this.logger.info('Configuring SSH key:', keyPath);

    // Validate key path exists and is readable
    const keyData = await this.readKeyFile(keyPath);

    if (!keyData) {
      throw new Error('Unable to read SSH key file');
    }

    // Basic validation of key format
    if (!this.isValidSSHKey(keyData)) {
      throw new Error('Invalid SSH key format');
    }

    // Store configuration (without storing private key content for security)
    this.config = {
      keyPath,
      passphrase,
      publicKey: await this.extractPublicKey(keyData)
    };

    // Save to storage
    await chrome.storage.local.set({
      sshKeyConfig: this.config
    });

    this.logger.info('SSH key configured successfully');
  }

  async isKeyConfigured(): Promise<boolean> {
    return this.config !== null;
  }

  getKeyConfig(): SSHKeyConfig | null {
    return this.config;
  }

  async getPrivateKey(): Promise<string | null> {
    if (!this.config) {
      return null;
    }

    // Read private key from file
    const keyData = await this.readKeyFile(this.config.keyPath);
    return keyData;
  }

  private async readKeyFile(filePath: string): Promise<string | null> {
    // Note: In a real extension, this would use chrome.fileSystem API
    // For now, this is a placeholder that would need to be implemented
    // with proper file access permissions
    this.logger.warn('readKeyFile not implemented - requires file system access');

    // Placeholder implementation
    return null;
  }

  private isValidSSHKey(keyData: string): boolean {
    // Basic validation for SSH key format
    const lines = keyData.trim().split('\n');
    if (lines.length === 0) {
      return false;
    }

    const firstLine = lines[0].trim();

    // Check for common SSH key prefixes
    return firstLine.startsWith('-----BEGIN') &&
           (firstLine.includes('PRIVATE KEY') ||
            firstLine.includes('RSA PRIVATE KEY') ||
            firstLine.includes('EC PRIVATE KEY') ||
            firstLine.includes('OPENSSH PRIVATE KEY'));
  }

  private async extractPublicKey(privateKeyData: string): Promise<string | undefined> {
    // Extract public key from private key
    // This is a simplified implementation - in reality, this would need
    // proper cryptographic operations to derive the public key
    this.logger.debug('Public key extraction not fully implemented');

    // Placeholder - would need crypto implementation
    return undefined;
  }
}
