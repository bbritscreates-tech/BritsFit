/**
 * Notification & Reminder Service for BritsFit
 * Handles Web Notifications API, in-app audio chimes, and recurring reminder checks.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private inAppListeners: Set<(title: string, message: string, targetId?: string) => void> = new Set();
  private checkInterval: any = null;

  public getPermissionState(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionState;
  }

  public async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      return res as NotificationPermissionState;
    } catch (e) {
      console.warn('Could not request notification permission', e);
      return this.getPermissionState();
    }
  }

  public subscribeInApp(callback: (title: string, message: string, targetId?: string) => void): () => void {
    this.inAppListeners.add(callback);
    return () => this.inAppListeners.delete(callback);
  }

  public notify(title: string, message: string, targetId?: string) {
    // 1. Play subtle audio tone using Web Audio API (no external asset needed)
    this.playChime();

    // 2. Dispatch to in-app toast/banner listeners
    this.inAppListeners.forEach((fn) => {
      try {
        fn(title, message, targetId);
      } catch (e) {
        console.error(e);
      }
    });

    // 3. Web Notification API if granted
    if (this.getPermissionState() === 'granted') {
      try {
        const baseUrl = typeof window !== 'undefined' ? (window as any).__BASE_URL__ || '/' : '/';
        const iconUrl = `${baseUrl}assets/britsfit-icon.png`.replace(/\/\//g, '/');
        new Notification(title, {
          body: message,
          icon: iconUrl,
          badge: iconUrl,
          tag: targetId || 'britsfit-reminder',
        });
      } catch (e) {
        console.warn('Browser notification failed', e);
      }
    }
  }

  public playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy might restrict if not user-initiated
    }
  }
}

export const notifications = new NotificationService();
