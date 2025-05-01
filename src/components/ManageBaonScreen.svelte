<script>
    import { onMount, tick } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { quintOut } from 'svelte/easing';
    import { getAllMeals, addMeal, updateMeal, deleteMeal } from '../lib/storage.js';
    import { showToast } from "../lib/toast.js";
    import BaonForm from './BaonForm.svelte';
    import { getDisplayImageSrc } from '../lib/imageUtils.js';
    import BaonBuddyManageBaon from "/titles/BaonBuddyManageBaon.png";

    const dispatch = createEventDispatcher();

    let userMeals = [];
    let showForm = false;
    let editingMeal = null;
    let formMode = 'add';

    function loadUserMeals() {
        userMeals = getAllMeals();
        console.log("Loaded user meals:", userMeals);
    }

    onMount(() => {
        loadUserMeals();
    });

    function openAddForm() {
        editingMeal = null; // Ensure it's null for add mode
        formMode = 'add';
        showForm = true;
    }

    function openEditForm(mealToEdit) {
        // Pass a *structured copy* for editing
        // Ensure default recipe structure if missing
        editingMeal = {
            id: mealToEdit.id,
            name: mealToEdit.name || '',
            type: mealToEdit.type || 'custom',
            message: mealToEdit.message || '',
            emoji: mealToEdit.emoji || '',
            image: mealToEdit.image || '',
            recipe: {
                ingredients: Array.isArray(mealToEdit.recipe?.ingredients) ? [...mealToEdit.recipe.ingredients] : [],
                steps: Array.isArray(mealToEdit.recipe?.steps) ? [...mealToEdit.recipe.steps] : [],
                talaTip: mealToEdit.recipe?.talaTip || ''
            },
            isUserDefined: mealToEdit.isUserDefined // Keep the flag
        };
        formMode = 'edit';
        showForm = true;
    }

    function handleDelete(mealId, mealName) {
        // Add null check for mealId
        if (!mealId) {
            console.error("handleDelete called with invalid mealId");
            return;
        }
        if (confirm(`Are you sure you want to delete "${mealName || 'this Baon'}"? This cannot be undone.`)) {
            const deleted = deleteMeal(mealId);
            if (deleted) {
                loadUserMeals();
                dispatch('userMealsChanged');
            }
        }
    }

    function handleSave(event) {
        const mealData = event.detail;
        console.log("ManageBaonScreen handleSave received event. Detail:", JSON.stringify(mealData, null, 2));
        console.log("Current formMode:", formMode);
        let success = false;
        if (formMode === 'add') {
            success = addMeal(mealData);
        } else if (formMode === 'edit') {
            // Ensure mealData has the ID needed for update
            if (!mealData.id) {
                console.error("Cannot update meal, missing ID in saved data.", mealData);
                showToast("Error updating Baon: Missing ID.", "error");
                return; // Exit early
            }
            success = updateMeal(mealData);
        }

        if (success) {
            loadUserMeals();
            dispatch('userMealsChanged');
            showForm = false;
        }
        // Keep form open on failure
    }

    function handleCancel() {
        showForm = false;
        editingMeal = null; // Clear editing state
    }

    function closeScreen() {
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
        <button class="add-new-btn" on:click={openAddForm}>
            <span class="plus-icon">+</span> Add New
        </button>
    </header>

    <div class="content-area">
    {#if showForm}
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

    {#if userMeals.length > 0}
        <p class="instruction-text">Tap a Baon to edit, or use the buttons.</p>
        <div class="meals-list">
            {#each userMeals as meal (meal.id)}
                <!-- Make the whole item clickable for editing -->
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
                        <button class="edit-btn" on:click|stopPropagation={() => openEditForm(meal)} aria-label="Edit {meal.name}">✏️</button>
                        <button class="delete-btn" on:click|stopPropagation={() => handleDelete(meal.id, meal.name)} aria-label="Delete {meal.name}">🗑️</button>
                    </div>
                </div>
            {/each}
        </div>
    {:else if !showForm}
            <div class="no-meals-message" transition:fade>
                <p>You haven't created any custom Baon yet!</p>
                <button class="add-first-btn" on:click={openAddForm}>+ Add your first Baon</button>
            </div>
        {/if}
    </div>
</div>

<style>
    .manage-baon-page {
        height: 100%; width: 100%; display: flex; flex-direction: column;
        overflow: hidden; background-color: #1a163f; color: #fff5e1;
        box-sizing: border-box;
    }
    .page-header {
        display: flex; flex-direction: column; align-items: center;
        position: relative; padding: 1rem;
        padding-top: 2.5rem;
        border-bottom: 1px solid #4a4090; flex-shrink: 0;
        background-color: #231d52;
    }
    .header-close-btn {
        position: absolute; top: 10px; right: 10px;
        background: transparent; border: none; color: #fff5e1a8;
        cursor: pointer; padding: 0.5rem; margin: 0; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: color 0.2s ease, background-color 0.2s ease; z-index: 2;
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
        background-color: #2c2663; border: 1px solid #4a4090;
        border-radius: 8px; padding: 0.8rem 1rem; display: flex;
        justify-content: space-between; align-items: center; gap: 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        outline-offset: 3px;
    }
     .meal-item.default {
         /* Optional styling for default items */
         /* border-left: 3px solid #6a5acd; */
     }
     .meal-item:focus-visible { outline: 2px solid #b388eb; border-color: #b388eb; }
     .meal-item:hover { background-color: #3a3375; border-color: #6a5acd; transform: scale(1.015); }

     .meal-item-visual {
        width: 45px; height: 45px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background-color: #3a3375; border-radius: 6px; overflow: hidden;
    }
    .meal-item-image { display: block; width: 100%; height: 100%; object-fit: contain; }
    .meal-item-emoji { font-size: 1.8rem; line-height: 1; }

    .meal-details {
        flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem;
        user-select: none;
    }
    .meal-item-name {
        display: block; font-weight: 600; color: #fff; margin-bottom: 0.1rem;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .meal-item-type { font-size: 0.8rem; color: #fff5e1b3; text-transform: capitalize; }
    .default-tag {
         font-size: 0.7rem; background-color: #4a4090; color: #fff5e1b3;
         padding: 0.1rem 0.4rem; border-radius: 4px; margin-top: 0.2rem;
         align-self: flex-start; font-weight: 500;
     }

     .meal-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
     .meal-actions button {
        background: none; border: none; cursor: pointer; font-size: 1.1rem;
        padding: 0.3rem; border-radius: 50%; line-height: 1;
        width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
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
       background-color: #b388eb; color: #1a163f;
       border: none; padding: 0.6rem 1.2rem; border-radius: 2rem;
       font-weight: 600; cursor: pointer; font-size: 0.95rem;
       display: inline-flex; align-items: center; gap: 0.4rem;
       transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(179, 136, 235, 0.3);
   }
   .add-first-btn:hover {
       background-color: #c7a4ff; transform: translateY(-1px);
       box-shadow: 0 4px 8px rgba(179, 136, 235, 0.4);
    }

    /* Form Modal Styling */
    .form-modal-backdrop {
        position: fixed; inset: 0; background-color: rgba(10, 8, 30, 0.7);
        backdrop-filter: blur(4px); z-index: 10010;
        display: flex; justify-content: center; align-items: center; padding: 1rem;
    }
    .form-wrapper {
         width: 100%; max-width: 450px; max-height: 90vh;
         overflow-y: auto; scrollbar-width: thin; scrollbar-color: #6a5acd #3a3375;
    }
     .form-wrapper::-webkit-scrollbar { width: 8px; }
     .form-wrapper::-webkit-scrollbar-track { background: #3a3375; border-radius: 4px;}
     .form-wrapper::-webkit-scrollbar-thumb { background-color: #6a5acd; border-radius: 4px; }

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