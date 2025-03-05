<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import '../app.css';
  import { theme } from '$lib/stores/settings';

  let sidebarOpen = true;
  
  onMount(async () => {
    // Check if user is authenticated
    await authStore.checkAuth();
    
    // Redirect to login if not authenticated and not already on login page
    if (!$authStore.isAuthenticated && !$page.url.pathname.startsWith('/login')) {
      goto('/login');
    }

    // Apply theme
    if ($theme) {
      document.documentElement.classList.add($theme);
    }
  });

  // Update theme when it changes
  $: {
    if ($theme) {
      document.documentElement.classList.remove('light', 'dark', 'system');
      document.documentElement.classList.add($theme);
    }
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
</script>

<div class="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
  {#if $authStore.isAuthenticated}
    <!-- Sidebar -->
    <div class="hidden md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Sidebar />
      </div>
    </div>

    <!-- Mobile sidebar -->
    {#if sidebarOpen}
      <div class="md:hidden fixed inset-0 z-40 flex">
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75" on:click={toggleSidebar}></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              on:click={toggleSidebar}
            >
              <span class="sr-only">Close sidebar</span>
              <svg
                class="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <Sidebar />
        </div>
      </div>
    {/if}
  {/if}

  <!-- Main content -->
  <div class="flex flex-col w-0 flex-1 overflow-hidden">
    {#if $authStore.isAuthenticated}
      <div class="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
        <button
          type="button"
          class="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          on:click={toggleSidebar}
        >
          <span class="sr-only">Open sidebar</span>
          <svg
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    {/if}

    <main class="flex-1 relative overflow-y-auto focus:outline-none">
      <div class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <slot />
        </div>
      </div>
    </main>
  </div>
</div>
