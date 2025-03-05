<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { conversationsStore } from '$lib/stores/conversations';
  import { modelsStore } from '$lib/stores/models';
  import ChatThread from '$lib/components/ChatThread.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import ChatHeader from '$lib/components/ChatHeader.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { apiClient } from '$lib/api';
  import { socket } from '$lib/api/websocket';
  import type { Message } from '$lib/types';

  // Get conversation ID from route params
  const conversationId = $page.params.id;
  const isNewChat = conversationId === 'new';

  let conversation: any = null;
  let messages: Message[] = [];
  let loading = true;
  let error: string | null = null;
  let streaming = false;
  let streamedMessage = '';
  let activeSocketId: string | null = null;

  // Connect to socket for real-time updates
  onMount(async () => {
    if (!isNewChat) {
      // Load existing conversation
      try {
        const response = await apiClient.getConversation(conversationId);
        if (response.status) {
          conversation = response.data;
          messages = response.data.messages || [];
        } else {
          error = response.error?.message || 'Failed to load conversation';
        }
      } catch (err) {
        error = 'Error loading conversation';
        console.error(err);
      }
    } else {
      // Initialize new conversation
      conversation = {
        id: 'new',
        title: 'New Chat',
        model_id: $modelsStore.selectedModel?.id || '',
        system_prompt: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_pinned: false,
        is_archived: false
      };
    }

    // Set up socket listeners for real-time updates
    socket.on('chat:message', handleNewMessage);
    socket.on('chat:update', handleConversationUpdate);
    socket.on('chat:typing', handleTypingIndicator);

    loading = false;
  });

  onDestroy(() => {
    // Clean up socket listeners
    socket.off('chat:message', handleNewMessage);
    socket.off('chat:update', handleConversationUpdate);
    socket.off('chat:typing', handleTypingIndicator);
    
    // Close streaming connection if active
    if (activeSocketId) {
      socket.emit('chat:cancel', { conversationId, socketId: activeSocketId });
    }
  });

  function handleNewMessage(data: any) {
    if (data.conversationId === conversationId) {
      messages = [...messages, data.message];
    }
  }

  function handleConversationUpdate(data: any) {
    if (data.conversationId === conversationId) {
      conversation = { ...conversation, ...data.updates };
    }
  }

  function handleTypingIndicator(data: any) {
    // Handle typing indicator if needed
  }

  async function handleSendMessage(event: CustomEvent) {
    const message = event.detail.message;

    if (!message.trim()) return;

    if (isNewChat) {
      // Create a new conversation first
      try {
        const title = message.length > 30 ? `${message.substring(0, 30)}...` : message;
        const response = await apiClient.createConversation({
          title,
          model_id: conversation.model_id,
          system_prompt: conversation.system_prompt
        });
        
        if (response.status) {
          conversation = response.data;
          // Navigate to the new conversation URL
          goto(`/chat/${conversation.id}`, { replaceState: true });
          // Update the conversation store
          conversationsStore.addConversation(conversation);
        } else {
          error = response.error?.message || 'Failed to create conversation';
          return;
        }
      } catch (err) {
        error = 'Error creating conversation';
        console.error(err);
        return;
      }
    }

    // Add user message to the UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };
    
    messages = [...messages, userMessage];

    // Indicate that we're waiting for a response
    streaming = true;
    streamedMessage = '';

    try {
      // If streaming is requested
      if (event.detail.stream) {
        // Set up streaming
        activeSocketId = await apiClient.streamChatResponse(
          conversation.id,
          message,
          event.detail.parameters,
          (token) => {
            streamedMessage += token;
          },
          () => {
            // On complete, add the full message to the messages array
            const assistantMessage: Message = {
              id: `stream-${Date.now()}`,
              role: 'assistant',
              content: streamedMessage,
              created_at: new Date().toISOString()
            };
            messages = [...messages, assistantMessage];
            streaming = false;
            streamedMessage = '';
            activeSocketId = null;
          }
        );
      } else {
        // Non-streaming request
        const response = await apiClient.sendChatMessage(
          conversation.id,
          message,
          event.detail.parameters
        );
        
        if (response.status) {
          // Replace the temporary user message with the actual one
          messages = messages.filter(m => m.id !== userMessage.id);
          messages = [
            ...messages, 
            response.data.user_message,
            response.data.assistant_message
          ];
        } else {
          error = response.error?.message || 'Failed to send message';
        }
        streaming = false;
      }
    } catch (err) {
      error = 'Error sending message';
      console.error(err);
      streaming = false;
    }
  }
</script>

<div class="h-full flex flex-col overflow-hidden">
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-red-500 text-center">
        <p class="text-lg font-semibold">Error</p>
        <p>{error}</p>
        <button 
          class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          on:click={() => goto('/chat/new')}
        >
          Go to New Chat
        </button>
      </div>
    </div>
  {:else}
    <!-- Chat Header -->
    <ChatHeader 
      conversation={conversation} 
      onUpdateTitle={(title) => {
        conversation = { ...conversation, title };
      }} 
    />

    <!-- Chat Messages -->
    <div class="flex-1 overflow-y-auto px-4 pb-4">
      <ChatThread 
        messages={messages} 
        streamingMessage={streaming ? { role: 'assistant', content: streamedMessage } : null} 
      />
    </div>

    <!-- Chat Input -->
    <div class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
      <ChatInput
        disabled={streaming || isNewChat && !$modelsStore.selectedModel}
        conversationId={conversation?.id}
        on:send={handleSendMessage}
      />
    </div>
  {/if}
</div>
