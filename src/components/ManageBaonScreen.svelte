<script>
  import { onMount, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  // Import ASYNC storage functions
  import { getAllMeals, addMeal, updateMeal, deleteMeal } from '../lib/storage.js';
  import { showToast } from "../lib/toast.js";
  import BaonForm from './BaonForm.svelte';
  import { getDisplayImageSrc } from '../lib/imageUtils.js';
  import BaonBuddyManageBaon from "/titles/BaonBuddyManageBaon.png";
  // If you need to react to the $allMeals store directly for updates from other places:
  import { allMeals as allMealsStore } from '../lib/mealStore.js';
  import { sfxClick } from '../lib/sfxClick.js';
  import { playSound } from '../lib/soundManager.js';

  const dispatch = createEventDispatcher();

  let allUserMealsFromFS = []; // Holds all meals loaded from filesystem
  let filteredUserMeals = [];
  let showForm = false;
  let editingMeal = null; // This is the meal data passed TO the BaonForm
  let formMode = 'add';
  let searchTerm = '';
  let isLoading = true; // Loading state

  async function loadUserMeals() {
    isLoading = true;
    console.log("[ManageBaonScreen] Loading user meals...");
    try {
      allUserMealsFromFS = await getAllMeals(); // ASYNC call
      console.log("[ManageBaonScreen] Meals loaded:", allUserMealsFromFS.length);
      filterMeals(); // Filter after loading
    } catch (error) {
      console.error("[ManageBaonScreen] Error loading meals:", error);
      showToast("Could not load meals.", "error");
      allUserMealsFromFS = []; // Fallback to empty
      filterMeals();
    } finally {
      isLoading = false;
    }
  }

  // Reactive filtering based on loaded meals and search term
  function filterMeals() {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      filteredUserMeals = [...allUserMealsFromFS];
    } else {
      filteredUserMeals = allUserMealsFromFS.filter(meal =>
        meal.name?.toLowerCase().includes(search) ||
        meal.type?.toLowerCase().includes(search) ||
        meal.message?.toLowerCase().includes(search)
      );
    }
  }

  // Re-filter when search term changes OR when the underlying list is reloaded
  $: if (searchTerm || allUserMealsFromFS) { // This will trigger when allUserMealsFromFS is set by loadUserMeals
    filterMeals();
  }

  // Alternative: Subscribe to $allMealsStore if you want live updates
  // without explicitly calling loadUserMeals after every save/delete from this screen.
  // The current `loadUserMeals()` after success in `handleSave` and `handleDelete` is fine too.
  // $: if ($allMealsStore) {
  //   console.log("[ManageBaonScreen] $allMealsStore updated, re-filtering.");
  //   allUserMealsFromFS = $allMealsStore; // This keeps it in sync
  //   filterMeals();
  // }


  onMount(() => {
    loadUserMeals(); // Load meals when component mounts
  });

  function openAddForm() {
    playSound('click');
    editingMeal = null;
    formMode = 'add';
    showForm = true;
  }

  function openEditForm(mealToEdit) {
    // Make a deep copy for the form
    editingMeal = JSON.parse(JSON.stringify(mealToEdit));
    // Ensure recipe structure (BaonForm does this too, but good for consistency)
    editingMeal.recipe = editingMeal.recipe || { ingredients: [], steps: [], talaTip: '' };
    editingMeal.recipe.ingredients = Array.isArray(editingMeal.recipe.ingredients) ? editingMeal.recipe.ingredients : [];
    editingMeal.recipe.steps = Array.isArray(editingMeal.recipe.steps) ? editingMeal.recipe.steps : [];
    editingMeal.recipe.talaTip = editingMeal.recipe.talaTip || '';
    
    playSound('click');
    formMode = 'edit';
    showForm = true;
  }

  async function handleDelete(mealId, mealName) {
    if (!mealId) { console.error("Invalid mealId for delete"); return; }
    if (confirm(`Are you sure you want to delete "${mealName || 'this Baon'}"?`)) {
      isLoading = true;
        playSound('click');
      try {
        const deleted = await deleteMeal(mealId); // ASYNC call
        if (deleted) {
          await loadUserMeals(); // Reload the list after deletion
          dispatch('userMealsChanged'); // Notify App.svelte if needed for other global state (e.g. favorites count)
        }
      } catch (error) {
        console.error("Error deleting meal:", error);
        showToast("Failed to delete Baon.", "error");
      } finally {
        isLoading = false;
      }
    }
  }

  async function handleSave(event) {
    playSound('click');
    const mealDataFromForm = event.detail; // Data from BaonForm
    isLoading = true;
    let success = false;
    try {
      if (formMode === 'add') {
        // mealDataFromForm already contains ID, isUserDefined, originalDefaultId (if any) from BaonForm
        // addMeal in storage.js will generate a new ID if mealDataFromForm.id is null or not user_
        // and will set isUserDefined = true
        success = await addMeal(mealDataFromForm); // ASYNC call
      } else if (formMode === 'edit') {
        if (!mealDataFromForm.id) {
          showToast("Error updating: Missing ID.", "error");
          isLoading = false;
          return;
        }
        // `editingMeal` here is the state *before* passing to BaonForm, used for context like originalDefaultId
        // `mealDataFromForm` has the latest edits from the form.
        const mealToUpdate = {
            ...mealDataFromForm, // Contains all fields from form, including the ID
            isUserDefined: true, // Ensure updates are marked as user-defined
            // BaonForm passes originalDefaultId back if it received one.
            // updateMeal in storage.js will use mealDataFromForm.id to find and update.
        };
        success = await updateMeal(mealToUpdate); // ASYNC call
      }

      if (success) {
        await loadUserMeals(); // Reload the list
        dispatch('userMealsChanged');
        showForm = false;
        editingMeal = null;
      }
    } catch (error) {
      console.error(`Error saving Baon in ${formMode} mode:`, error);
      showToast(`Failed to ${formMode} Baon.`, "error");
    } finally {
      isLoading = false;
    }
  }

  function handleCancel() {
    playSound('click');
    showForm = false;
    editingMeal = null;
  }

  function closeScreen() {
    playSound('click');
    dispatch('close');
  }
</script>

<div class="manage-baon-page">
    <header class="page-header">
        <button class="header-close-btn" on:click={closeScreen} aria-label="Close Manage Baon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
        <img src={BaonBuddyManageBaon} alt="Manage Baon" id="manage-baon-title" class="title-image">
        <button use:sfxClick class="add-new-btn" on:click={openAddForm}>
            <span class="plus-icon">+</span> Add New
        </button>
    </header>

    <div class="content-area">
        {#if isLoading}
            <div class="loading-message">Loading Baon...</div>
        {:else if showForm}
            <!-- Form Modal Overlay -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="form-modal-backdrop" on:click|self={handleCancel} transition:fade={{duration: 200}}>
                <!-- Form Wrapper -->
                <div class="form-wrapper" transition:fly={{y: 30, duration: 250, easing: quintOut }}>
                    <BaonForm
                        formMode={formMode}
                        initialData={editingMeal}
                        on:save={handleSave}
                        on:cancel={handleCancel}
                    />
                </div>
            </div>
        {/if}

        <!-- Search Bar Area -->
        <div class="search-wrapper-manage">
            <input
                type="search"
                placeholder="Search your Baon..."
                bind:value={searchTerm}
                aria-label="Search Your Baon List"
            />
            {#if searchTerm}
                <button class="clear-search-btn-manage" on:click={() => searchTerm = ''} aria-label="Clear search">×</button>
            {/if}
        </div>

        {#if allUserMealsFromFS.length > 0}
            {#if filteredUserMeals.length > 0}
                <p class="instruction-text">Tap a Baon to edit, or use the buttons.</p>
                <div class="meals-list">
                    {#each filteredUserMeals as meal (meal.id)} <!-- Loop over FILTERED list -->
                        {@const displaySrc = getDisplayImageSrc(meal.image)}
                        <div
                            class="meal-item"
                            on:click={() => openEditForm(meal)}
                            role="button"
                            tabindex="0"
                            aria-label="Edit {meal.name}"
                            on:keydown={(e) => {if (e.key === 'Enter' || e.key === ' ') openEditForm(meal)}}
                            animate:flip={{duration: 300}}
                        >
                            <!-- ADDED: Image/Emoji Column -->
                            <div class="meal-item-visual">
                                {#if displaySrc}
                                    <img src={displaySrc} alt="" class="meal-item-image" loading="lazy"/>
                                {:else if meal.emoji}
                                    <span class="meal-item-emoji">{meal.emoji}</span>
                                {:else}
                                    <span class="meal-item-emoji">🍽️</span> <!-- Default -->
                                {/if}
                            </div>
                            <div class="meal-details">
                                <span class="meal-item-name">{meal.name}</span>
                                <span class="meal-item-type">{meal.type}</span>
                            </div>
                            <div class="meal-actions">
                                <button 
                                    class="edit-btn" 
                                    on:click|stopPropagation={() => openEditForm(meal)} 
                                    aria-label="Edit {meal.name}"
                                >
                                    ✏️
                                </button>
                                <button 
                                    class="delete-btn" 
                                    on:click|stopPropagation={() => handleDelete(meal.id, meal.name)} 
                                    aria-label="Delete {meal.name}"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <!-- Show only if filtering produced no results -->
                <div class="no-meals-message" transition:fade>
                    <p>No Baon found matching "{searchTerm}"!</p>
                </div>
            {/if}
        {:else if !showForm}
            <!-- Show only if the user has NO meals AT ALL -->
            <div class="no-meals-message" transition:fade>
                <p>You haven't created any custom Baon yet!</p>
                <button class="add-first-btn" use:sfxClick on:click={openAddForm}>+ Add your first Baon</button>
            </div>
        {/if}
    </div>

    <footer class="page-footer">
        <button class="back-btn" on:click={closeScreen}>Back</button>
    </footer>
</div>

<style>
    .manage-baon-page {
        height: 100%;
        width: 100%; 
        display: flex; 
        flex-direction: column;
        overflow: hidden; 
        background-color: #1a163f; color: #fff5e1;
        box-sizing: border-box;
        padding-top: calc(var(--custom-safe-area-top));
        padding-bottom: calc(var(--custom-safe-area-bottom, env(safe-area-inset-bottom, 0px)));
    }
    .page-header {
        display: flex; 
        flex-direction: column; 
        align-items: center;
        position: relative; 
        padding: 1rem;
        padding-top: 2.5rem;
        border-bottom: 1px solid #4a4090; 
        flex-shrink: 0;
        background-color: #231d52;
    }
    .header-close-btn {
        position: absolute; 
        top: 10px; 
        right: 10px;
        background: transparent; 
        border: none; 
        color: #fff5e1a8;
        cursor: pointer; 
        padding: 0.5rem; 
        margin: 0; 
        border-radius: 50%;
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease; 
        z-index: 2;
    }
    .header-close-btn:hover, .header-close-btn:focus-visible { color: #fff; background-color: #4a409060; outline: none; }
    .header-close-btn svg { width: 22px; height: 22px; }

    .title-image { width: 100%; max-width: 200px; margin-bottom: 1rem; display: block; }

    .add-new-btn {
        background-color: #b388eb; color: #1a163f;
        border: none; padding: 0.6rem 1.2rem; border-radius: 2rem;
        font-weight: 600; cursor: pointer; font-size: 0.95rem;
        display: inline-flex; align-items: center; gap: 0.4rem;
        transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(179, 136, 235, 0.3);
    }
    .add-new-btn:hover {
        background-color: #c7a4ff; transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(179, 136, 235, 0.4);
    }
    .plus-icon { font-weight: bold; font-size: 1.2em; line-height: 1; }

    .content-area {
        flex-grow: 1; overflow-y: auto; padding: 1.5rem;
        scrollbar-width: thin; scrollbar-color: #6a5acd #3a3375;
    }
    .content-area::-webkit-scrollbar { width: 8px; }
    .content-area::-webkit-scrollbar-track { background: #3a3375; border-radius: 4px;}
    .content-area::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius: 4px; }

    .instruction-text {
        text-align: center; font-size: 0.9rem; color: #fff5e1a8;
        margin: 0 0 1.5rem 0; font-style: italic;
    }
    .meals-list { display: flex; flex-direction: column; gap: 0.8rem; }

    .meal-item {
        background-color: #2c2663; 
        border: 1px solid #4a4090;
        border-radius: 8px; 
        padding: 0.8rem 1rem; 
        display: flex;
        justify-content: space-between; 
        align-items: center; 
        gap: 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        outline-offset: 3px;
    }
    .meal-item:focus-visible { outline: 2px solid #b388eb; border-color: #b388eb; }
    .meal-item:hover { background-color: #3a3375; border-color: #6a5acd; transform: scale(1.015); }

    .meal-item-visual {
        width: 45px; 
        height: 45px; 
        flex-shrink: 0;
        display: flex; 
        align-items: center; 
        justify-content: center;
        background-color: #3a3375; 
        border-radius: 6px; 
        overflow: hidden;
    }
    .meal-item-image { display: block; width: 100%; height: 100%; object-fit: contain; }
    .meal-item-emoji { font-size: 1.8rem; line-height: 1; }

    .meal-details {
        flex-grow: 1; 
        min-width: 0; 
        display: flex; 
        flex-direction: column; 
        gap: 0.1rem;
        user-select: none;
    }
    .meal-item-name {
        display: block; 
        font-weight: 600; 
        color: #fff; 
        margin-bottom: 0.1rem;
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis;
    }
    .meal-item-type { font-size: 0.8rem; color: #fff5e1b3; text-transform: capitalize; }

    .meal-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .meal-actions button {
        background: none; 
        border: none; 
        cursor: pointer; 
        font-size: 1.1rem;
        padding: 0.3rem; 
        border-radius: 50%; 
        line-height: 1;
        width: 30px; 
        height: 30px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: background-color 0.2s ease, transform 0.15s ease;
        color: #fff5e1b3;
    }
    .meal-actions button:hover { background-color: rgba(255, 245, 225, 0.1); transform: scale(1.1);}
    .meal-actions button:active { transform: scale(0.95); }
    .edit-btn:hover { color: #b388eb; }
    .delete-btn:hover { color: #e74c3c; }

    .no-meals-message {
        text-align: center; padding: 3rem 1rem; color: #fff5e1a8;
    }
    .no-meals-message p { margin-bottom: 1.5rem; font-size: 1.1em; }
    .add-first-btn { /* Style like add-new-btn */
        background-color: #b388eb; 
        color: #1a163f;
        border: none; 
        padding: 0.6rem 1.2rem; 
        border-radius: 2rem;
        font-weight: 600; 
        cursor: pointer; font-size: 0.95rem;
        display: inline-flex; 
        align-items: center; gap: 0.4rem;
        transition: all 0.2s ease; 
        box-shadow: 0 2px 5px rgba(179, 136, 235, 0.3);
    }
    .add-first-btn:hover {
        background-color: #c7a4ff; 
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(179, 136, 235, 0.4);
    }

    /* Form Modal Styling */
    .form-modal-backdrop {
        position: fixed; 
        inset: 0; 
        background-color: rgba(10, 8, 30, 0.7);
        backdrop-filter: blur(4px); 
        z-index: 10010;
        display: flex; 
        justify-content: center; 
        align-items: center; 
        padding: 1rem;
    }
    .form-wrapper {
        width: 100%; 
        max-width: 450px; 
        max-height: 90vh;
        overflow-y: auto; 
        scrollbar-width: thin; 
        scrollbar-color: #6a5acd #3a3375;
    }
    .form-wrapper::-webkit-scrollbar { width: 8px; }
    .form-wrapper::-webkit-scrollbar-track { background: #3a3375; border-radius: 4px;}
    .form-wrapper::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius: 4px; }

    /* Search Bar Styles (similar to BaonList) */
    .search-wrapper-manage {
        padding: 0 0 1.5rem 0; /* Padding below search */
        position: relative;
        max-width: 600px; /* Limit search bar width */
        width: 100%;
        margin-left: auto; /* Center search bar */
        margin-right: auto;
    }
    .search-wrapper-manage input[type="search"] {
        width: 100%; padding: 0.7rem 1rem; padding-right: 2.5rem;
        border-radius: 1.5rem; border: 1px solid #4a4090;
        background-color: #2c2663; color: #fff5e1; font-size: 1rem;
        box-sizing: border-box;
    }
    .search-wrapper-manage input[type="search"]::placeholder { color: #fff5e199; }
    .search-wrapper-manage input[type="search"]:focus {
        outline: none; border-color: #b388eb;
        box-shadow: 0 0 0 2px rgba(179, 136, 235, 0.3);
    }
    .search-wrapper-manage input[type="search"]::-webkit-search-cancel-button { -webkit-appearance:none; }
    .clear-search-btn-manage {
        position: absolute; right: 0.5rem; top: 28%;
        transform: translateY(-50%); background: none; border: none;
        color: #fff5e1a8; font-size: 1.5rem; line-height: 1;
        padding: 0.2rem; cursor: pointer;
    }
    .clear-search-btn-manage:hover { color: #fff; }

    /* Ensure list has some top margin */
    .meals-list { margin-top: 0.5rem; }

    .page-footer {
        flex-shrink: 0;
        padding: 1rem;
        border-top: 1px solid #4a4090;
        background-color: #231d52;
        display: flex;
        justify-content: center;
    }

    /* Large, tappable Back button */
    .back-btn {
        background-color: #b388eb;
        color: #1a163f;
        border: none;
        padding: 0.8rem 2rem;
        border-radius: 2rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .back-btn:hover {
        background-color: #c7a4ff;
        transform: translateY(-1px);
    }

    .loading-message { text-align: center; padding: 2rem; font-style: italic; color: #fff5e1a8; }

    /* Responsive adjustments */
    @media (min-width: 768px) {
        .page-header { padding: 1.5rem; padding-top: 3rem;}
        .add-new-btn { padding: 0.7rem 1.5rem; font-size: 1.05rem;}
        .content-area { padding: 2rem;}
        .meal-item { padding: 1rem 1.5rem; border-radius: 10px; gap: 1.2rem;}
        .meal-item-visual { width: 60px; height: 60px; border-radius: 8px; }
        .meal-item-emoji { font-size: 2.2rem; }
        .meal-item-name { font-size: 1.1rem; }
        .meal-item-type { font-size: 0.9rem; }
        .meal-actions button { font-size: 1.4rem; width: 38px; height: 38px;}
        .form-wrapper { max-width: 550px; }
        .search-wrapper-manage input[type="search"] { font-size: 1.1rem; padding: 0.8rem 1.2rem; padding-right: 2.8rem;}
        .clear-search-btn-manage { right: 0.8rem; }
    }

    /* Further adjustments for very large screens if desired */
    @media (min-width: 900px) and (min-height: 1300px) {
        .meal-item-visual {
            width: 70px;
            height: 70px;
            border-radius: 10px;
        }
        .meal-item-emoji {
            font-size: 2.5rem;
        }
    }
</style>