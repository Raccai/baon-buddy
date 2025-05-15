<script>
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintIn, quintOut } from 'svelte/easing';

  export let visible = false;
  export let title = 'Confirm Action';
  export let message = 'Are you sure you want to proceed?';
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let confirmClasses = 'btn-danger'; // e.g., 'btn-primary', 'btn-danger'
  export let cancelClasses = 'btn-secondary';
  export let isLoading = false; // To show a loading state on the confirm button

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    if (isLoading) return;
    dispatch('confirm');
    // The parent component will typically set visible=false after handling confirm
  }

  function handleCancel() {
    if (isLoading) return;
    dispatch('cancel');
    // The parent component will typically set visible=false
  }

  // Handle Escape key to cancel
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if visible}
  <h3 id="confirm-title" class="modal-title">{title}</h3>
  <p id="confirm-message" class="modal-message">{@html message}</p> 
  <!-- Learned to use @html if message might contain simple HTML like <br>, so why noy -->
  
  <div class="modal-actions">
    <button
      type="button"
      class="btn {cancelClasses}"
      on:click={handleCancel}
      disabled={isLoading}
    >
      {cancelText}
    </button>
    <button
      type="button"
      class="btn {confirmClasses}"
      on:click={handleConfirm}
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="spinner"></span> Processing...
      {:else}
        {confirmText}
      {/if}
    </button>
  </div>
{/if}

<style>
  .modal-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fff;
    margin-top: 0;
    margin-bottom: 0.8rem;
  }

  .modal-message {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    color: #fff5e1b3; /* Slightly dimmer for message */
  }
  .modal-message strong { /* For emphasis if using <strong> in message */
      color: #fff5e1;
      font-weight: 600;
  }

  .modal-actions {
    display: flex;
    justify-content: space-around; /* Or space-between, flex-end */
    gap: 1rem;
  }

  .btn {
    padding: 0.7rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    flex-grow: 1; /* Make buttons take equal space if desired */
    max-width: 150px; /* Prevent buttons from getting too wide */
  }
  .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
  }
  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  .btn-danger {
    background-color: #e74c3c;
    color: white;
    box-shadow: 0 2px 5px rgba(231, 76, 60, 0.3);
  }
  .btn-danger:hover:not(:disabled) { background-color: #c0392b; }

  .btn-primary { /* Example for a primary action */
    background-color: #b388eb;
    color: #1a163f;
    box-shadow: 0 2px 5px rgba(179, 136, 235, 0.3);
  }
  .btn-primary:hover:not(:disabled) { background-color: #c7a4ff; }
  
  .btn-secondary {
    background-color: transparent;
    color: #fff5e1a8;
    border: 1px solid #4a4090;
  }
  .btn-secondary:hover:not(:disabled) {
    background-color: #4a409060;
    color: #fff5e1;
  }

  .spinner { /* Simple CSS spinner */
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s ease-in-out infinite;
    margin-right: 0.5em;
    vertical-align: middle;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>