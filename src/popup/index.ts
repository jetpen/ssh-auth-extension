// Popup UI for SSH Auth Extension
// Handles user interface for key configuration and status display

class PopupUI {
  private keyPathInput: HTMLInputElement;
  private passphraseInput: HTMLInputElement;
  private configureBtn: HTMLButtonElement;
  private statusBtn: HTMLButtonElement;
  private statusDiv: HTMLDivElement;

  constructor() {
    this.keyPathInput = document.getElementById('keyPath') as HTMLInputElement;
    this.passphraseInput = document.getElementById('passphrase') as HTMLInputElement;
    this.configureBtn = document.getElementById('configureBtn') as HTMLButtonElement;
    this.statusBtn = document.getElementById('statusBtn') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;

    this.initialize();
  }

  private initialize(): void {
    // Load saved configuration
    this.loadConfiguration();

    // Set up event handlers
    this.setupEventHandlers();

    // Check initial status
    this.checkStatus();
  }

  private setupEventHandlers(): void {
    this.configureBtn.addEventListener('click', () => this.configureKey());
    this.statusBtn.addEventListener('click', () => this.checkStatus());
  }

  private async configureKey(): Promise<void> {
    const keyPath = this.keyPathInput.value.trim();
    const passphrase = this.passphraseInput.value;

    if (!keyPath) {
      this.showStatus('Please enter a valid SSH key path', 'error');
      return;
    }

    try {
      this.setLoading(true);

      const response = await this.sendMessage({
        type: 'CONFIGURE_KEY',
        keyPath,
        passphrase: passphrase || undefined
      });

      if (response.success) {
        this.showStatus('SSH key configured successfully', 'success');
        // Save configuration locally
        await this.saveConfiguration(keyPath, !!passphrase);
      } else {
        this.showStatus(`Configuration failed: ${response.error}`, 'error');
      }
    } catch (error) {
      this.showStatus(`Configuration error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private async checkStatus(): Promise<void> {
    try {
      this.setLoading(true);

      const response = await this.sendMessage({ type: 'GET_STATUS' });

      if (response.success) {
        const status = response.status;
        if (status.keyConfigured) {
          this.showStatus(
            `Extension ready - Version ${status.version}`,
            'success'
          );
        } else {
          this.showStatus(
            'Extension initialized but no SSH key configured',
            'warning'
          );
        }
      } else {
        this.showStatus(`Status check failed: ${response.error}`, 'error');
      }
    } catch (error) {
      this.showStatus(`Status check error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['sshKeyPath', 'hasPassphrase']);
      if (result.sshKeyPath) {
        this.keyPathInput.value = result.sshKeyPath;
        // Don't load passphrase for security reasons
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  private async saveConfiguration(keyPath: string, hasPassphrase: boolean): Promise<void> {
    try {
      await chrome.storage.local.set({
        sshKeyPath: keyPath,
        hasPassphrase
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'warning'): void {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.classList.remove('hidden');

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.statusDiv.classList.add('hidden');
      }, 5000);
    }
  }

  private setLoading(loading: boolean): void {
    this.configureBtn.disabled = loading;
    this.statusBtn.disabled = loading;

    if (loading) {
      this.configureBtn.textContent = 'Configuring...';
      this.statusBtn.textContent = 'Checking...';
    } else {
      this.configureBtn.textContent = 'Configure Key';
      this.statusBtn.textContent = 'Check Status';
    }
  }

  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the popup UI
new PopupUI();

// Export for testing
export { PopupUI };
