// Google OAuth service using Google Identity Services
class GoogleAuthService {
  constructor() {
    this.isInitialized = false;
    this.google = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.google) {
        this.google = window.google;
        this.isInitialized = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if (window.google) {
          this.google = window.google;
          this.isInitialized = true;
          resolve();
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async signInWithPopup() {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Use the One Tap API
      this.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is not available, reject to allow manual button handling
          reject(new Error('One Tap not available'));
        }
      });
    });
  }

  renderSignInButton(elementId, config = {}) {
    return this.initialize().then(() => {
      const buttonConfig = {
        theme: 'outline',
        size: 'large',
        width: 250,
        logo_alignment: 'left',
        ...config
      };

      this.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: config.callback || (() => {}),
        auto_select: false
      });

      this.google.accounts.id.renderButton(
        document.getElementById(elementId),
        buttonConfig
      );
    });
  }

  signOut() {
    if (this.google && this.google.accounts.id) {
      this.google.accounts.id.disableAutoSelect();
    }
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}

export const googleAuthService = new GoogleAuthService();
