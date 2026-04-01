/**
 * ═══════════════════════════════════════════════════════════════
 * DeepAR Face Swap Service — LiveStream Premium
 * Integrates DeepAR SDK for real-time face tracking & swapping.
 * Manages a library of hyper-realistic male and female face masks.
 * ═══════════════════════════════════════════════════════════════
 *
 * DEEPAR SDK NOTES:
 * ─────────────────
 * DeepAR provides the most realistic face-swapping technology
 * available for mobile apps. The SDK uses neural networks to
 * map textures onto tracked face landmarks in real-time.
 *
 * Setup Requirements:
 * 1. Register at https://developer.deepar.ai/
 * 2. Obtain a license key for your app
 * 3. Download .deepar format face mask files
 * 4. Place masks in src/assets/masks/male/ and src/assets/masks/female/
 *
 * Key Features:
 * - 468-point face landmark tracking
 * - Real-time texture mapping at 30-60 FPS
 * - Works with pre-made .deepar mask files
 * - Supports multiple simultaneous face tracking
 * - Sub-millisecond latency processing
 */

import { Platform, NativeModules } from 'react-native';
import type { FaceSwapMask, FaceSwapGender } from '../types';

// ─── DeepAR Native Module (bridged from native iOS/Android SDK) ────
const { DeepARModule } = NativeModules;

// ─── Configuration ────────────────────────────────────────────
const DEEPAR_CONFIG = {
  // Replace with your DeepAR license key from https://developer.deepar.ai
  licenseKey: Platform.select({
    ios: 'YOUR_DEEPAR_IOS_LICENSE_KEY',
    android: 'YOUR_DEEPAR_ANDROID_LICENSE_KEY',
  }),

  // Resolution settings for face tracking
  cameraResolution: {
    width: 1280,
    height: 720,
  },

  // Face detection parameters
  faceDetectionSensitivity: 0.75,
  maxFaces: 3,

  // Performance tuning
  gpuMode: true,          // Use GPU for faster processing
  sharedContext: true,    // Share GL context with camera preview
};

/**
 * Complete library of hyper-realistic face masks organized by gender.
 *
 * These masks are professional-grade 3D face models with photorealistic
 * textures that map seamlessly onto tracked faces. Each mask includes:
 * - High-resolution diffuse texture maps (2048x2048)
 * - Normal maps for lighting accuracy
 * - Subsurface scattering for skin realism
 * - Eye, teeth, and inner-mouth geometry
 *
 * Mask files (.deepar format) must be downloaded from the DeepAR
 * asset store or created using DeepAR Studio.
 *
 * NOTE: Replace the placeholder URLs below with actual .deepar file paths
 * after downloading from your DeepAR developer dashboard.
 */
const FACE_MASK_LIBRARY: FaceSwapMask[] = [
  // ═══════════════════════════════════════════════════════════
  // HYPER-REALISTIC MALE MASKS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'male-executive-01',
    name: 'Executive James',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-executive-01-thumb.jpg',
    modelUrl: 'masks/male/executive_james.deepar',
    isPremium: false,
    isNew: true,
    popularity: 98,
    tags: ['business', 'professional', 'mature', 'handsome'],
  },
  {
    id: 'male-young-02',
    name: 'Young Daniel',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-young-02-thumb.jpg',
    modelUrl: 'masks/male/young_daniel.deepar',
    isPremium: false,
    isNew: true,
    popularity: 95,
    tags: ['youthful', 'casual', 'friendly', 'beard'],
  },
  {
    id: 'male-asian-03',
    name: 'Kenji Park',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-asian-03-thumb.jpg',
    modelUrl: 'masks/male/kenji_park.deepar',
    isPremium: false,
    isNew: false,
    popularity: 91,
    tags: ['asian', 'clean-cut', 'modern', 'stylish'],
  },
  {
    id: 'male-athletic-04',
    name: 'Marcus Stone',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-athletic-04-thumb.jpg',
    modelUrl: 'masks/male/marcus_stone.deepar',
    isPremium: false,
    isNew: true,
    popularity: 89,
    tags: ['athletic', 'strong', 'confident', 'bald'],
  },
  {
    id: 'male-european-05',
    name: 'Liam Frost',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-european-05-thumb.jpg',
    modelUrl: 'masks/male/liam_frost.deepar',
    isPremium: true,
    isNew: false,
    popularity: 87,
    tags: ['european', 'fair', 'blue-eyes', 'formal'],
  },
  {
    id: 'male-vintage-06',
    name: 'Classic Robert',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-vintage-06-thumb.jpg',
    modelUrl: 'masks/male/classic_robert.deepar',
    isPremium: true,
    isNew: false,
    popularity: 82,
    tags: ['classic', 'mature', 'distinguished', 'vintage'],
  },
  {
    id: 'male-trendy-07',
    name: 'Trendy Alex',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-trendy-07-thumb.jpg',
    modelUrl: 'masks/male/trendy_alex.deepar',
    isPremium: false,
    isNew: true,
    popularity: 94,
    tags: ['trendy', 'hipster', 'young', 'glasses'],
  },
  {
    id: 'male-rugged-08',
    name: 'Rugged Chris',
    gender: 'male',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/male-rugged-08-thumb.jpg',
    modelUrl: 'masks/male/rugged_chris.deepar',
    isPremium: true,
    isNew: false,
    popularity: 86,
    tags: ['rugged', 'beard', 'outdoors', 'masculine'],
  },

  // ═══════════════════════════════════════════════════════════
  // HYPER-REALISTIC FEMALE MASKS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'female-elegant-01',
    name: 'Elegant Sophia',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-elegant-01-thumb.jpg',
    modelUrl: 'masks/female/elegant_sophia.deepar',
    isPremium: false,
    isNew: true,
    popularity: 99,
    tags: ['elegant', 'glamorous', 'professional', 'makeup'],
  },
  {
    id: 'female-cute-02',
    name: 'Cute Mina',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-cute-02-thumb.jpg',
    modelUrl: 'masks/female/cute_mina.deepar',
    isPremium: false,
    isNew: true,
    popularity: 97,
    tags: ['cute', 'korean', 'soft', 'youthful'],
  },
  {
    id: 'female-asian-03',
    name: 'Hana Tanaka',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-asian-03-thumb.jpg',
    modelUrl: 'masks/female/hana_tanaka.deepar',
    isPremium: false,
    isNew: false,
    popularity: 93,
    tags: ['asian', 'japanese', 'natural', 'smooth'],
  },
  {
    id: 'female-model-04',
    name: 'Model Victoria',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-model-04-thumb.jpg',
    modelUrl: 'masks/female/model_victoria.deepar',
    isPremium: false,
    isNew: true,
    popularity: 96,
    tags: ['model', 'fashion', 'striking', 'confident'],
  },
  {
    id: 'female-mediterranean-05',
    name: 'Isabella Roma',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-mediterranean-05-thumb.jpg',
    modelUrl: 'masks/female/isabella_roma.deepar',
    isPremium: true,
    isNew: false,
    popularity: 90,
    tags: ['mediterranean', 'exotic', 'dark-hair', 'warm'],
  },
  {
    id: 'female-scandinavian-06',
    name: 'Freya Nordström',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-scandinavian-06-thumb.jpg',
    modelUrl: 'masks/female/freya_nordstrom.deepar',
    isPremium: true,
    isNew: false,
    popularity: 88,
    tags: ['scandinavian', 'blonde', 'light-eyes', 'minimal'],
  },
  {
    id: 'female-bollywood-07',
    name: 'Priya Sharma',
    gender: 'female',
    category: 'realistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-bollywood-07-thumb.jpg',
    modelUrl: 'masks/female/priya_sharma.deepar',
    isPremium: false,
    isNew: true,
    popularity: 94,
    tags: ['indian', 'bollywood', 'exotic', 'ornate'],
  },
  {
    id: 'female-futuristic-08',
    name: 'Neo Luna',
    gender: 'female',
    category: 'artistic',
    thumbnailUrl: 'https://assets.example.com/masks/female-futuristic-08-thumb.jpg',
    modelUrl: 'masks/female/neo_luna.deepar',
    isPremium: true,
    isNew: true,
    popularity: 92,
    tags: ['futuristic', 'cyberpunk', 'glowing', 'artistic'],
  },
];

/**
 * DeepARService — Manages the DeepAR face swap integration.
 *
 * This service handles:
 * 1. DeepAR SDK initialization with license key
 * 2. Loading/unloading face masks from the library
 * 3. Adjusting face swap parameters (intensity, smoothing)
 * 4. Managing the AR rendering pipeline
 *
 * The actual DeepAR rendering happens on the native side (iOS/Android).
 * This service communicates with the native DeepAR module via NativeModules.
 */
class DeepARService {
  private isInitialized: boolean = false;
  private currentMaskId: string | null = null;
  private isProcessing: boolean = false;
  private activeSlotIndex: number = 0;

  // Callbacks for UI updates
  private onFaceDetected: ((numberOfFaces: number) => void) | null = null;
  private onMaskLoaded: ((maskId: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  /**
   * Initialize the DeepAR SDK with the license key.
   * Must be called before any other DeepAR operations.
   *
   * @returns Promise<boolean> - Whether initialization was successful
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!DeepARModule) {
        console.warn(
          '[DeepAR] Native module not found. Running in demo mode.'
        );
        // In demo mode, we still provide the mask library for UI
        return true;
      }

      // Initialize native DeepAR with configuration
      await DeepARModule.initialize(DEEPAR_CONFIG.licenseKey, {
        resolutionWidth: DEEPAR_CONFIG.cameraResolution.width,
        resolutionHeight: DEEPAR_CONFIG.cameraResolution.height,
        faceDetectionSensitivity: DEEPAR_CONFIG.faceDetectionSensitivity,
        maxFaces: DEEPAR_CONFIG.maxFaces,
        gpuMode: DEEPAR_CONFIG.gpuMode,
        sharedContext: DEEPAR_CONFIG.sharedContext,
      });

      this.isInitialized = true;
      console.log('[DeepAR] SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('[DeepAR] Initialization failed:', error);
      this.onError?.(`DeepAR init failed: ${error}`);
      return false;
    }
  }

  /**
   * Load a face swap mask by its ID.
   * The mask must be available in the FACE_MASK_LIBRARY.
   *
   * @param maskId - The unique identifier of the mask to load
   */
  async loadMask(maskId: string): Promise<boolean> {
    const mask = FACE_MASK_LIBRARY.find((m) => m.id === maskId);
    if (!mask) {
      console.error(`[DeepAR] Mask not found: ${maskId}`);
      this.onError?.(`Mask not found: ${maskId}`);
      return false;
    }

    try {
      if (DeepARModule) {
        // Load the mask into DeepAR's slot system
        await DeepARModule.loadEffect(
          mask.modelUrl,           // Path to .deepar file
          this.activeSlotIndex,    // Slot index (0-3 for multiple masks)
          true                     // Use face swap mode
        );
      }

      this.currentMaskId = maskId;
      this.onMaskLoaded?.(maskId);
      console.log(`[DeepAR] Mask loaded: ${mask.name}`);
      return true;
    } catch (error) {
      console.error(`[DeepAR] Failed to load mask ${maskId}:`, error);
      this.onError?.(`Failed to load mask: ${error}`);
      return false;
    }
  }

  /**
   * Remove the currently active face swap mask.
   * Reverts to the user's natural face.
   */
  async removeMask(): Promise<void> {
    try {
      if (DeepARModule && this.currentMaskId !== null) {
        await DeepARModule.switchToEffect(0, ''); // Empty string = no effect
      }
      this.currentMaskId = null;
      console.log('[DeepAR] Mask removed');
    } catch (error) {
      console.error('[DeepAR] Error removing mask:', error);
    }
  }

  /**
   * Adjust the face swap intensity/blending amount.
   * 0.0 = Natural face, 1.0 = Full face swap
   *
   * @param intensity - Value between 0 and 1
   */
  async setIntensity(intensity: number): Promise<void> {
    const clampedValue = Math.max(0, Math.min(1, intensity));
    try {
      if (DeepARModule) {
        await DeepARModule.setParameter('maskIntensity', clampedValue);
      }
    } catch (error) {
      console.error('[DeepAR] Error setting intensity:', error);
    }
  }

  /**
   * Adjust the temporal smoothing for face tracking.
   * Higher values = smoother transitions but more latency.
   * Lower values = more responsive but may jitter.
   *
   * @param smoothing - Value between 0 and 1 (default 0.5)
   */
  async setSmoothing(smoothing: number): Promise<void> {
    const clampedValue = Math.max(0, Math.min(1, smoothing));
    try {
      if (DeepARModule) {
        await DeepARModule.setParameter('trackingSmoothing', clampedValue);
      }
    } catch (error) {
      console.error('[DeepAR] Error setting smoothing:', error);
    }
  }

  /**
   * Get all available face masks.
   * Optionally filter by gender, category, or premium status.
   */
  getMasks(filters?: {
    gender?: FaceSwapGender | 'all';
    category?: string;
    premiumOnly?: boolean;
    newOnly?: boolean;
    searchQuery?: string;
  }): FaceSwapMask[] {
    let masks = [...FACE_MASK_LIBRARY];

    if (filters) {
      if (filters.gender && filters.gender !== 'all') {
        masks = masks.filter((m) => m.gender === filters.gender);
      }
      if (filters.category) {
        masks = masks.filter((m) => m.category === filters.category);
      }
      if (filters.premiumOnly) {
        masks = masks.filter((m) => m.isPremium);
      }
      if (filters.newOnly) {
        masks = masks.filter((m) => m.isNew);
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        masks = masks.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.tags.some((t) => t.includes(query))
        );
      }
    }

    // Sort by popularity (highest first)
    return masks.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get masks grouped by gender for carousel display.
   */
  getMasksByGender(): { male: FaceSwapMask[]; female: FaceSwapMask[] } {
    return {
      male: FACE_MASK_LIBRARY.filter((m) => m.gender === 'male'),
      female: FACE_MASK_LIBRARY.filter((m) => m.gender === 'female'),
    };
  }

  /**
   * Get the currently active mask, if any.
   */
  getCurrentMask(): FaceSwapMask | null {
    if (!this.currentMaskId) return null;
    return FACE_MASK_LIBRARY.find((m) => m.id === this.currentMaskId) || null;
  }

  /**
   * Register callbacks for DeepAR events.
   */
  setCallbacks(callbacks: {
    onFaceDetected?: (numberOfFaces: number) => void;
    onMaskLoaded?: (maskId: string) => void;
    onError?: (error: string) => void;
  }): void {
    this.onFaceDetected = callbacks.onFaceDetected || null;
    this.onMaskLoaded = callbacks.onMaskLoaded || null;
    this.onError = callbacks.onError || null;
  }

  /**
   * Check if DeepAR is initialized and ready.
   */
  get ready(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if a face swap is currently active.
   */
  get isActive(): boolean {
    return this.currentMaskId !== null;
  }

  /**
   * Cleanup and release DeepAR resources.
   * Call this when the streaming screen is unmounted.
   */
  async destroy(): Promise<void> {
    try {
      if (DeepARModule) {
        await DeepARModule.destroy();
      }
      this.isInitialized = false;
      this.currentMaskId = null;
      this.onFaceDetected = null;
      this.onMaskLoaded = null;
      this.onError = null;
      console.log('[DeepAR] Service destroyed');
    } catch (error) {
      console.error('[DeepAR] Error during cleanup:', error);
    }
  }
}

// ─── Export Singleton ─────────────────────────────────────────
export const deepARService = new DeepARService();
export { FACE_MASK_LIBRARY };
export default deepARService;
