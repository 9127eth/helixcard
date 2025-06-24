// Source tracking utility for affiliate links
export interface SourceInfo {
  source?: string;
  timestamp: number;
}

const SOURCE_STORAGE_KEY = 'helix_source';
const SOURCE_EXPIRY_HOURS = 24; // Source expires after 24 hours

/**
 * Capture source from URL parameters and store in localStorage
 */
export function captureSource(): void {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('source');
  
  if (source) {
    const sourceInfo: SourceInfo = {
      source: source,
      timestamp: Date.now()
    };
    
    localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(sourceInfo));
    console.log('Source captured:', source);
  }
}

/**
 * Get stored source if it hasn't expired
 */
export function getStoredSource(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SOURCE_STORAGE_KEY);
    if (!stored) return null;
    
    const sourceInfo: SourceInfo = JSON.parse(stored);
    const now = Date.now();
    const expiryTime = sourceInfo.timestamp + (SOURCE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      // Source has expired, remove it
      localStorage.removeItem(SOURCE_STORAGE_KEY);
      return null;
    }
    
    return sourceInfo.source || null;
  } catch (error) {
    console.error('Error retrieving stored source:', error);
    return null;
  }
}

/**
 * Clear stored source (called after successful registration)
 */
export function clearStoredSource(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SOURCE_STORAGE_KEY);
}

/**
 * Get source for user registration (combines URL and stored sources)
 */
export function getSourceForRegistration(): string | null {
  // First check URL parameters (takes priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlSource = urlParams.get('source');
  
  if (urlSource) {
    return urlSource;
  }
  
  // Fallback to stored source
  return getStoredSource();
} 