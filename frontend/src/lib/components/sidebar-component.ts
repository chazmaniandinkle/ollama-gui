<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { conversationsStore } from '$lib/stores/conversations';
  import { authStore } from '$lib/stores/auth';
  import { modelsStore } from '$lib/stores/models';
  import { formatDistanceToNow } from 'date-fns';
  import ConversationSearch from './ConversationSearch.svelte';
  import TagList from './TagList.svelte';

  let loading = true;
  let searchQuery = '';

  onMount(async () => {
    // Load conversations and models
    await Promise.all([
      conversationsStore.loadConversations(),
      modelsStore.loadModels()
    ]);
    loading = false;
  });

  function createNewChat() {
    goto('/chat/new');
  }

  function goToConversation(id: string) {
    goto(`/chat/${id}`);
  }

  function goToSettings() {
    goto('/settings');
  }

  function handleSearchInput(event: CustomEvent) {
    searchQuery = event.detail;
  }

  // Filter conversations based on search query
  $: filteredConversations = searchQuery.trim() 
    ? $conversationsStore.conversations.filter(
        conv => conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : $conversationsStore.conversations;
</script>

<div class="h-full flex flex-col">
  <!-- Sidebar header with logo/title -->
  <div class="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
    <h1 class="text-lg font-bold text-gray-800 dark:text-white">Ollama GUI</h1>
  </div>

  <!-- New chat button -->
  <div class="px-4 py-3">
    <button
      on:click={createNewChat}
      class="w-full flex items-center justify-center px-4 py-2 border border-transparent 
             rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Chat
    </button>
  </div>

  <!-- Search -->
  <div class="px-4 py-2">
    <ConversationSearch on:search={handleSearchInput} />
  </div>

  <!-- Conversations list -->
  <div class="px-3 mt-2">
    <h2 class="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Recent Conversations
    </h2>
  </div>

  <!-- Scrollable conversations -->
  <div class="mt-2 flex-1 overflow-y-auto">
    {#if loading}
      <div class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        Loading conversations...
      </div>
    {:else if filteredConversations.length === 0}
      <div class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        {searchQuery ? 'No matching conversations' : 'No conversations yet'}
      </div>
    {:else}
      <ul class="space-y-1 px-2">
        {#each filteredConversations as conversation (conversation.id)}
          <li>
            <button
              on:click={() => goToConversation(conversation.id)}
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full 
                    {$page.url.pathname === `/chat/${conversation.id}` 
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
            >
              <div class="flex-shrink-0 w-2.5 h-2.5 rounded-full mr-3 
                        {conversation.model_id.includes('ollama') 
                          ? 'bg-blue-500' 
                          : conversation.model_id.includes('openai') 
                            ? 'bg-green-500' 
                            : 'bg-purple-500'}"></div>
              <div class="flex-1 flex flex-col overflow-hidden">
                <span class="truncate">{conversation.title}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                </span>
              </div>
              {#if conversation.is_pinned}
                <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 10.5a.5.5 0 01-.5.5H3.5A.5.5 0 013 10.5V3.5A.5.5 0 013.5 3h3.879a.5.5 0 01.354.146l3.122 3.122a.5.5 0 01.146.354V10.5z"/>
                </svg>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Tags section -->
  <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
    <h2 class="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Tags
    </h2>
    <div class="mt-2 px-2">
      <TagList />
    </div>
  </div>

  <!-- Models section -->
  <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
    <h2 class="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Models
    </h2>
    <div class="mt-2 px-2">
      <button
        class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
               rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
      >
        <div class="flex-shrink-0 h-4 w-4 mr-3 text-blue-500">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
          </svg>
        </div>
        <span class="flex-1 truncate">
          {$modelsStore.selectedModel ? $modelsStore.selectedModel.display_name : 'Select a model'} 
        </span>
        <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Settings button -->
  <div class="px-3 py-3 mt-auto border-t border-gray-200 dark:border-gray-700">
    <button
      on:click={goToSettings}
      class="flex items-center px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
             rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
    >
      <svg class="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
      </svg>
      Settings
    </button>
  </div>
</div>
