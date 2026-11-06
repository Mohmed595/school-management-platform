import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallResult {
  triggeredNativePrompt: boolean;
  accepted?: boolean;
  reason?: 'already_installed' | 'iframe' | 'no_prompt_available';
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const isStandaloneEnv = () => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('source=pwa') ||
        window.location.search.includes('mode=pwa')
      );
    } catch {
      return false;
    }
  };

  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneEnv);
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandaloneEnv);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    // Clean up any stale or false pwa_app_installed flag from localStorage
    try {
      localStorage.removeItem('pwa_app_installed');
    } catch {}

    const checkStandalone = () => {
      const standalone = isStandaloneEnv();
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mqlStandalone = window.matchMedia('(display-mode: standalone)');
    const mqlOverlay = window.matchMedia('(display-mode: window-controls-overlay)');
    const mqlMinimal = window.matchMedia('(display-mode: minimal-ui)');

    const handleDisplayModeChange = () => {
      checkStandalone();
    };

    mqlStandalone.addEventListener('change', handleDisplayModeChange);
    mqlOverlay.addEventListener('change', handleDisplayModeChange);
    mqlMinimal.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mqlStandalone.removeEventListener('change', handleDisplayModeChange);
      mqlOverlay.removeEventListener('change', handleDisplayModeChange);
      mqlMinimal.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Launch or focus the installed PWA
  const openApp = () => {
    try {
      const pwaUrl = new URL(window.location.origin);
      pwaUrl.searchParams.set('source', 'pwa');
      const newWin = window.open(pwaUrl.toString(), '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.href = pwaUrl.toString();
      }
    } catch {
      window.location.href = '/?source=pwa';
    }
  };

  const install = async (): Promise<InstallResult> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          return { triggeredNativePrompt: true, accepted: true };
        }
        return { triggeredNativePrompt: true, accepted: false };
      } catch (err) {
        console.error('Error invoking native PWA prompt:', err);
        setDeferredPrompt(null);
        return { triggeredNativePrompt: false, reason: 'no_prompt_available' };
      }
    }

    // Native beforeinstallprompt is not currently available (e.g. iframe or pending or browser UI)
    return {
      triggeredNativePrompt: false,
      reason: isIframe ? 'iframe' : 'no_prompt_available',
    };
  };

  return {
    isInstalled,
    isStandalone,
    canPromptNatively: !!deferredPrompt,
    isIframe,
    install,
    openApp,
  };
}
