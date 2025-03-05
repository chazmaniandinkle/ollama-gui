import { writable, derived } from 'svelte/store';
import { apiClient } from '$lib/api';
import type { UserSettings } from '$lib/types';
import { browser } from '$app/environment';

// Default settings
const defaultSettings: UserSettings = {
  app: {
    theme: 'system',
    message_display: 'comfortable'
  },
  models: {},
  features: {
    enable_web_search: true,
    enable_code_interpreter: true,
    enable_image_generation: false
  }
};

// Initial state
const initialState = {
  settings: defaultSettings,
  isLoading: false,
  hasLoaded: false,
  error: null as string | null
};

function createSettingsStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    /**
     * Load user settings
     */
    loadSettings: async () => {
      // Skip if already loaded
      let alreadyLoaded = false;
      update(state => {
        alreadyLoaded = state.hasLoaded;
        return { ...state, isLoading: !state.hasLoaded };
      });
      
      if (alreadyLoaded) return true;
      
      try {
        const response = await apiClient.getSettings();
        
        if (response.status) {
          update(state => ({ 
            ...state, 
            settings: response.data || defaultSettings,
            isLoading: false,
            hasLoaded: true
          }));
          
          // Apply theme
          if (browser) {
            const theme = response.data.app.theme || 'system';
            applyTheme(theme);
          }
          
          return true;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to load settings',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        update(state => ({ 
          ...state, 
          error: 'Error loading settings', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Update settings
     */
    updateSettings: async (newSettings: Partial<UserSettings>) => {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        // Flatten settings for API
        const flattenedSettings: Record<string, any> = {};
        
        if (newSettings.app) {
          Object.entries(newSettings.app).forEach(([key, value]) => {
            flattenedSettings[`app.${key}`] = value;
          });
        }
        
        if (newSettings.models) {
          Object.entries(newSettings.models).forEach(([modelId, modelSettings]) => {
            Object.entries(modelSettings).forEach(([key, value]) => {
              flattenedSettings[`models.${modelId}.${key}`] = value;
            });
          });
        }
        
        if (newSettings.features) {
          Object.entries(newSettings.features).forEach(([key, value]) => {
            flattenedSettings[`features.${key}`] = value;
          });
        }
        
        const response = await apiClient.updateSettings(flattenedSettings);
        
        if (response.status) {
          // Update local settings
          update(state => {
            const updatedSettings = {
              app: { ...state.settings.app, ...(newSettings.app || {}) },
              models: { ...state.settings.models, ...(newSettings.models || {}) },
              features: { ...state.settings.features, ...(newSettings.features || {}) }
            };
            
            // Apply theme if changed
            if (newSettings.app?.theme && browser) {
              applyTheme(newSettings.app.theme);
            }
            
            return {
              ...state,
              settings: updatedSettings,
              isLoading: false
            };
          });
          
          return true;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to update settings',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error updating settings:', error);
        update(state => ({ 
          ...state, 
          error: 'Error updating settings', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Set theme
     */
    setTheme: async (theme: 'light' | 'dark' | 'system') => {
      if (browser) {
        applyTheme(theme);
      }
      
      return await this.updateSettings({
        app: { theme }
      });
    },
    
    /**
     * Toggle feature
     */
    toggleFeature: async (feature: keyof UserSettings['features']) => {
      let currentValue = false;
      
      update(state => {
        currentValue = !!state.settings.features[feature];
        return state;
      });
      
      return await this.updateSettings({
        features: { [feature]: !currentValue }
      });
    },
    
    /**
     * Reset to default settings
     */
    resetSettings: async () => {
      return await this.updateSettings(defaultSettings);
    }
  };
}

/**
 * Apply theme to the document
 */
function applyTheme(theme: string) {
  if (!browser) return;
  
  // Remove existing theme classes
  document.documentElement.classList.remove('light', 'dark');
  
  if (theme === 'system') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    // Use specified theme
    document.documentElement.classList.add(theme);
  }
}

// Create the settings store
const settingsStore = createSettingsStore();

// Derived store for theme
export const theme = derived(
  settingsStore,
  $settings => $settings.settings.app.theme
);

export { settingsStore };
