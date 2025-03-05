import { writable } from 'svelte/store';
import { apiClient } from '$lib/api';
import type { Model } from '$lib/types';
import { browser } from '$app/environment';

// Initial state
const initialState = {
  models: [] as Model[],
  isLoading: false,
  selectedModel: null as Model | null,
  error: null as string | null
};

function createModelsStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    /**
     * Load all models
     */
    loadModels: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.getModels();
        
        if (response.status) {
          const models = response.data.models || [];
          // Sort by availability and provider
          models.sort((a, b) => {
            // Available models first
            if (a.available !== b.available) {
              return a.available ? -1 : 1;
            }
            // Then by provider (ollama first)
            if (a.provider !== b.provider) {
              return a.provider === 'ollama' ? -1 : 1;
            }
            // Then by name
            return a.display_name.localeCompare(b.display_name);
          });
          
          // Get the selected model from localStorage or select the first available
          let selectedModel = null;
          
          if (browser) {
            const savedModelId = localStorage.getItem('selected_model_id');
            if (savedModelId) {
              selectedModel = models.find(m => m.id === savedModelId) || null;
            }
          }
          
          // If no saved model or the saved model doesn't exist, select the first available one
          if (!selectedModel && models.length > 0) {
            selectedModel = models.find(m => m.available) || models[0];
          }
          
          update(state => ({ 
            ...state, 
            models,
            selectedModel,
            isLoading: false
          }));
          
          // Save selected model to localStorage
          if (browser && selectedModel) {
            localStorage.setItem('selected_model_id', selectedModel.id);
          }
          
          return true;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to load models',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error loading models:', error);
        update(state => ({ 
          ...state, 
          error: 'Error loading models', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Refresh models from providers
     */
    refreshModels: async () => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.refreshModels();
        
        if (response.status) {
          // Reload models
          return await this.loadModels();
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to refresh models',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error refreshing models:', error);
        update(state => ({ 
          ...state, 
          error: 'Error refreshing models', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Select a model
     */
    selectModel: (modelId: string) => {
      update(state => {
        const selectedModel = state.models.find(m => m.id === modelId) || null;
        
        // Save to localStorage
        if (browser && selectedModel) {
          localStorage.setItem('selected_model_id', selectedModel.id);
        }
        
        return {
          ...state,
          selectedModel
        };
      });
    },
    
    /**
     * Update model parameters
     */
    updateModelParameters: async (modelId: string, parameters: any) => {
      try {
        const response = await apiClient.updateModelParameters(modelId, parameters);
        
        if (response.status) {
          // Update the model in the store
          update(state => {
            const updatedModels = state.models.map(model => {
              if (model.id === modelId) {
                return {
                  ...model,
                  parameters: {
                    ...model.parameters,
                    ...Object.entries(parameters).reduce((acc, [key, value]) => {
                      if (model.parameters[key]) {
                        acc[key] = {
                          ...model.parameters[key],
                          default: value
                        };
                      }
                      return acc;
                    }, {} as any)
                  }
                };
              }
              return model;
            });
            
            // Update selected model if it's the one being updated
            const updatedSelectedModel = state.selectedModel?.id === modelId
              ? updatedModels.find(m => m.id === modelId) || state.selectedModel
              : state.selectedModel;
            
            return {
              ...state,
              models: updatedModels,
              selectedModel: updatedSelectedModel
            };
          });
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error updating model parameters:', error);
        return false;
      }
    },
    
    /**
     * Get a model by ID
     */
    getModel: (modelId: string) => {
      let foundModel = null;
      
      update(state => {
        foundModel = state.models.find(m => m.id === modelId) || null;
        return state;
      });
      
      return foundModel;
    },
    
    /**
     * Clear errors
     */
    clearError: () => {
      update(state => ({ ...state, error: null }));
    },
    
    /**
     * Reset store
     */
    reset: () => {
      set(initialState);
    }
  };
}

export const modelsStore = createModelsStore();
