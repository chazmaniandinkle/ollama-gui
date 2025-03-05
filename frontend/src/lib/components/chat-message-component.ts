<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDistanceToNow } from 'date-fns';
  import { marked } from 'marked';
  import { markedHighlight } from 'marked-highlight';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github-dark.css';

  export let message: {
    role: string;
    content: string;
    created_at?: string;
    metadata?: any;
  };
  export let isStreaming = false;

  let renderedContent = '';
  let showRaw = false;

  // Set up marked with highlighting
  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      }
    })
  );

  // Custom renderer to handle code blocks
  const renderer = new marked.Renderer();
  
  renderer.code = (code, language) => {
    const langClass = language ? ` class="language-${language}"` : '';
    return `
      <div class="code-block relative rounded-md overflow-hidden">
        <div class="bg-gray-800 text-gray-400 px-4 py-1 flex justify-between items-center text-xs">
          <span>${language || 'code'}</span>
          <button class="copy-code-btn hover:text-white" data-code="${encodeURIComponent(code)}">
            Copy
          </button>
        </div>
        <pre class="rounded-b-md overflow-auto p-4 bg-gray-900"><code${langClass}>${
          hljs.highlightAuto(code, language ? [language] : undefined).value
        }</code></pre>
      </div>`;
  };

  marked.use({ renderer });

  onMount(() => {
    renderContent();
  });

  $: if (message.content) {
    renderContent();
  }

  function renderContent() {
    try {
      renderedContent = marked.parse(message.content);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      renderedContent = `<p>${message.content}</p>`;
    }
  }

  function toggleRawContent() {
    showRaw = !showRaw;
  }

  function handleCopyCode(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('copy-code-btn')) {
      const code = decodeURIComponent(target.getAttribute('data-code') || '');
      navigator.clipboard.writeText(code);
      
      // Show "Copied" text temporarily
      const originalText = target.textContent;
      target.textContent = 'Copied!';
      setTimeout(() => {
        target.textContent = originalText;
      }, 2000);
    }
  }

  // Format the timestamp
  $: formattedTime = message.created_at 
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
    : '';
</script>

<div 
  class="message-container my-4 flex {message.role === 'user' ? 'justify-end' : 'justify-start'}"
>
  <div 
    class="message max-w-3xl rounded-lg px-4 py-3 {
      message.role === 'user' 
        ? 'bg-indigo-100 dark:bg-indigo-900 text-gray-800 dark:text-gray-100' 
        : message.role === 'system'
          ? 'bg-yellow-100 dark:bg-yellow-900 text-gray-800 dark:text-gray-100'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
    } {isStreaming ? 'streaming' : ''}"
  >
    <div class="flex items-center">
      <div class="font-semibold">
        {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Assistant'}
      </div>
      {#if formattedTime && !isStreaming}
        <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {formattedTime}
        </div>
      {/if}
      {#if isStreaming}
        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-2">
          <div class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      {/if}
      {#if message.role === 'assistant' && message.metadata?.token_count}
        <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {message.metadata.token_count} tokens
        </div>
      {/if}
      {#if message.content && message.content.length > 0}
        <button 
          on:click={toggleRawContent} 
          class="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showRaw ? 'View formatted' : 'View raw'}
        </button>
      {/if}
    </div>

    <div class="prose dark:prose-invert prose-sm max-w-none mt-2" on:click={handleCopyCode}>
      {#if showRaw}
        <pre class="whitespace-pre-wrap">{message.content}</pre>
      {:else}
        {@html renderedContent}
      {/if}
    </div>

    {#if message.metadata?.context_source}
      <div class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Source: {message.metadata.context_source}
        {#if message.metadata.context_documents?.length > 0}
          <span class="ml-1">
            using {message.metadata.context_documents.length} document{message.metadata.context_documents.length !== 1 ? 's' : ''}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .typing-indicator {
    display: flex;
    align-items: center;
  }
  
  .dot {
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    margin-right: 3px;
    background: currentColor;
    animation: wave 1.3s linear infinite;
  }
  
  .dot:nth-child(2) {
    animation-delay: -1.1s;
  }
  
  .dot:nth-child(3) {
    animation-delay: -0.9s;
  }
  
  @keyframes wave {
    0%, 60%, 100% {
      transform: initial;
    }
    30% {
      transform: translateY(-4px);
    }
  }
  
  /* Apply a blinking cursor to streaming content */
  .streaming::after {
    content: "";
    display: inline-block;
    width: 6px;
    height: 15px;
    background: currentColor;
    animation: blink 1s steps(2) infinite;
    vertical-align: text-bottom;
    opacity: 0.7;
  }
  
  @keyframes blink {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  /* Style for code blocks */
  :global(.code-block) {
    margin: 1em 0;
  }
  
  :global(.copy-code-btn) {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  :global(.copy-code-btn:hover) {
    opacity: 0.8;
  }
</style>
