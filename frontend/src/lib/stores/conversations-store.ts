import { writable } from 'svelte/store';
import { apiClient } from '$lib/api';
import type { Conversation } from '$lib/types';

// Initial conversations state
const initialState = {
  conversations: [] as Conversation[],
  isLoading: false,
  currentConversation: null as Conversation | null,
  error: null as string | null
};

function createConversationsStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    /**
     * Load all conversations
     */
    loadConversations: async (refresh = false) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.getConversations();
        
        if (response.status) {
          const conversations = response.data.conversations || [];
          // Sort by updated_at date (newest first)
          conversations.sort((a, b) => {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
          
          update(state => ({ 
            ...state, 
            conversations,
            isLoading: false
          }));
          
          return true;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to load conversations',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        update(state => ({ 
          ...state, 
          error: 'Error loading conversations', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Load a specific conversation
     */
    loadConversation: async (conversationId: string) => {
      update(state => ({ 
        ...state, 
        currentConversation: null,
        isLoading: true,
        error: null
      }));
      
      try {
        const response = await apiClient.getConversation(conversationId);
        
        if (response.status) {
          update(state => ({ 
            ...state, 
            currentConversation: response.data,
            isLoading: false
          }));
          
          return true;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to load conversation',
            isLoading: false
          }));
          
          return false;
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        update(state => ({ 
          ...state, 
          error: 'Error loading conversation', 
          isLoading: false
        }));
        
        return false;
      }
    },
    
    /**
     * Create a new conversation
     */
    createConversation: async (title: string, modelId: string, systemPrompt?: string, tags?: string[]) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await apiClient.createConversation({
          title,
          model_id: modelId,
          system_prompt: systemPrompt,
          tags
        });
        
        if (response.status) {
          // Add to conversations list
          update(state => ({ 
            ...state, 
            conversations: [response.data, ...state.conversations],
            currentConversation: response.data,
            isLoading: false
          }));
          
          return response.data;
        } else {
          update(state => ({ 
            ...state, 
            error: response.error?.message || 'Failed to create conversation',
            isLoading: false
          }));
          
          return null;
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        update(state => ({ 
          ...state, 
          error: 'Error creating conversation', 
          isLoading: false
        }));
        
        return null;
      }
    },
    
    /**
     * Add a conversation to the store (for optimistic updates)
     */
    addConversation: (conversation: Conversation) => {
      update(state => ({
        ...state,
        conversations: [conversation, ...state.conversations]
      }));
    },
    
    /**
     * Update a conversation
     */
    updateConversation: async (conversationId: string, data: Partial<Conversation>) => {
      try {
        const response = await apiClient.updateConversation(conversationId, data);
        
        if (response.status) {
          // Update in store
          update(state => {
            // Update in conversations list
            const updatedConversations = state.conversations.map(conv => 
              conv.id === conversationId ? { ...conv, ...data } : conv
            );
            
            // Update current conversation if it's the one being updated
            const updatedCurrentConversation = state.currentConversation?.id === conversationId
              ? { ...state.currentConversation, ...data }
              : state.currentConversation;
            
            return {
              ...state,
              conversations: updatedConversations,
              currentConversation: updatedCurrentConversation
            };
          });
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error updating conversation:', error);
        return false;
      }
    },
    
    /**
     * Delete a conversation
     */
    deleteConversation: async (conversationId: string, permanent = false) => {
      try {
        const response = await apiClient.deleteConversation(conversationId, permanent);
        
        if (response.status) {
          // Remove from store
          update(state => ({
            ...state,
            conversations: state.conversations.filter(c => c.id !== conversationId),
            currentConversation: state.currentConversation?.id === conversationId 
              ? null 
              : state.currentConversation
          }));
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }
    },
    
    /**
     * Set the current active conversation
     */
    setCurrentConversation: (conversation: Conversation | null) => {
      update(state => ({
        ...state,
        currentConversation: conversation
      }));
    },
    
    /**
     * Add a message to the current conversation
     */
    addMessage: (message: any) => {
      update(state => {
        if (!state.currentConversation) {
          return state;
        }
        
        const updatedConversation = {
          ...state.currentConversation,
          messages: [...(state.currentConversation.messages || []), message]
        };
        
        return {
          ...state,
          currentConversation: updatedConversation
        };
      });
    },
    
    /**
     * Clear the error
     */
    clearError: () => {
      update(state => ({ ...state, error: null }));
    },
    
    /**
     * Reset the store
     */
    reset: () => {
      set(initialState);
    }
  };
}

export const conversationsStore = createConversationsStore();
