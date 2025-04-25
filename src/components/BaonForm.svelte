<script>
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    import { createEventDispatcher, onMount } from 'svelte';
    import { tagStyles } from '../lib/tags.js'; // Adjust path if needed
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing'; // Import easing
    import { Capacitor } from '@capacitor/core';
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
  import { showToast } from '../lib/toast.js';

    // Props
    export let initialData = null; // Pass meal object when editing, null when adding
    export let formMode = 'add'; // 'add' or 'edit'

    const dispatch = createEventDispatcher();
    const mealTypes = tagStyles ? Object.keys(tagStyles) : ['custom'];

    // Form State
    let name = '';
    let type = mealTypes[0] || 'custom';
    let message = '';
    let emoji = '';
    let ingredientsStr = '';
    let stepsStr = '';
    let talaTip = '';
    let formTitle = 'Add New Baon';
    let internalId = null; // Store ID separately for edit mode
    let currentImageUrl = null; // To hold existing image URI during edit
    let imagePreviewUrl = null; // For displaying selected file preview (Data URL)
    let selectedFile = null;    // Holds the actual File object selected by user
    let imageAction = 'keep'; // 'keep', 'replace', 'remove' (for edit mode)

    // Function to generate a unique filename
    function generateUniqueFilename(originalName = 'image') { // Add default name
        const extensionMatch = originalName?.match(/\.([^.]+)$/);
        const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpeg'; // Default to jpeg
        return `baon_${Date.now()}_${Math.random().toString(16).slice(2)}.${extension}`;
    }

    // --- Initialize/Reset Form ---
    // @ts-ignore
    // @ts-ignore
     // @ts-ignore
       $: {
        // Reset relevant state on prop changes
        selectedFile = null; // Always clear selected file state
        imageAction = (formMode === 'add') ? 'add' : 'keep'; // Set initial action based on mode

        if (formMode === 'edit' && initialData) {
            // @ts-ignore
            internalId = initialData.id;
            // @ts-ignore
            name = initialData.name || '';
            // @ts-ignore
            type = initialData.type && mealTypes.includes(initialData.type) ? initialData.type : (mealTypes[0] || 'custom');
            // @ts-ignore
            message = initialData.message || '';
            // @ts-ignore
            emoji = initialData.emoji || '';
            // @ts-ignore
            currentImageUrl = initialData.image || null; // Store the persistent URI/URL
            // @ts-ignore
            ingredientsStr = initialData.recipe?.ingredients?.join(', ') || '';
            // @ts-ignore
            stepsStr = initialData.recipe?.steps?.join('\n') || '';
            // @ts-ignore
            talaTip = initialData.recipe?.talaTip || '';
            // @ts-ignore
            formTitle = `Edit "${initialData.name || 'Baon'}"`;

            // Set initial preview ONLY from currentImageUrl
            if (currentImageUrl) {
                if (Capacitor.isNativePlatform() && !currentImageUrl.startsWith('http') && !currentImageUrl.startsWith('data:')) {
                    try { imagePreviewUrl = Capacitor.convertFileSrc(currentImageUrl); } catch (e) { console.error("Error converting initial image URL:", e); imagePreviewUrl = null; }
                } else { imagePreviewUrl = currentImageUrl; }
            } else { imagePreviewUrl = null; }

        } else if (formMode === 'add') {
             // Clear fields for add mode
            internalId = null; name = ''; type = mealTypes[0] || 'custom'; message = ''; emoji = '';
            currentImageUrl = null; ingredientsStr = ''; stepsStr = ''; talaTip = '';
            formTitle = 'Add New Baon';
            imagePreviewUrl = null; // Ensure preview is clear
        }
    }

    function parseList(str, separator = ',') {
        if (!str || typeof str !== 'string') return [];
        return str.split(separator)
                  .map(item => item.trim())
                  .filter(item => item.length > 0);
    }

    // --- File Handling ---
    function handleFileSelect(event) {
        const file = event.target.files?.[0];
        const fileInput = event.target; // Keep reference to input

        if (!file) {
            // Selection cancelled or cleared by browser
            console.log("File selection cancelled or cleared.");
            selectedFile = null; // Clear the file state
            if (formMode === 'edit') {
                // Revert to showing the original image preview (if any)
                imageAction = 'keep';
                if (currentImageUrl) {
                    imagePreviewUrl = Capacitor.isNativePlatform() && !currentImageUrl.startsWith('http') && !currentImageUrl.startsWith('data:')
                                        ? Capacitor.convertFileSrc(currentImageUrl)
                                        : currentImageUrl;
                    console.log("Restored existing image preview.");
                } else {
                    imagePreviewUrl = null; // No existing image to restore
                }
            } else { // Add mode
                // Simply clear the preview
                imageAction = 'add'; // Still adding (nothing selected)
                imagePreviewUrl = null;
            }
            return;
        }

        // --- File is Selected ---
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (JPG, PNG, GIF, WebP, etc.).', "error");
            fileInput.value = ''; // Clear the invalid file selection visually
            selectedFile = null; // Clear state
            // Revert preview/action based on mode
            if (formMode === 'edit') {
                imageAction = 'keep';
                if(currentImageUrl) imagePreviewUrl = Capacitor.isNativePlatform() && !currentImageUrl.startsWith('http') && !currentImageUrl.startsWith('data:') ? Capacitor.convertFileSrc(currentImageUrl) : currentImageUrl;
                else imagePreviewUrl = null;
            } else {
                imageAction = 'add';
                imagePreviewUrl = null;
            }
            return;
        }

        console.log("File selected:", file.name, file.size);
        selectedFile = file; // Store the File object for later processing
        imageAction = 'replace'; // Set intent to replace/add

        // Generate temporary Data URL preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreviewUrl = e.target?.result; // Show Base64 preview
            console.log("Generated temporary image preview (Data URL).");
        };
        reader.onerror = (e) => {
            console.error("FileReader error reading selected file:", e);
            imagePreviewUrl = null; selectedFile = null;
            imageAction = formMode === 'edit' ? 'keep' : 'add'; // Revert action
            showToast("Error reading file for preview.", "error");
        }
        reader.readAsDataURL(file);
    }

    function handleRemoveImage() {
        console.log("User clicked remove image. Marking for removal.");
        selectedFile = null;       // Clear selected file state
        imagePreviewUrl = null;    // Clear preview visually
        imageAction = 'remove';    // Mark for removal action on save

        // Clear the file input visually
        const fileInput = document.getElementById(`baon-image-file-${internalId || 'add'}`);
        // @ts-ignore
        if (fileInput) fileInput.value = '';
    }
    // --- End File Handling ---

    // --- Form Submission ---
    async function handleSubmit() {
        console.log(`[BaonForm] Submit -> Mode: ${formMode}, Image Action: ${imageAction}`);
        if (!name.trim()) { showToast("Baon name is required!", "error"); return; }

        // 1. Determine the final image URL/URI to be saved
        let imageToSave = null; // Start assuming no image or removal

        // Determine initial value based on edit mode and action
        if (formMode === 'edit' && imageAction === 'keep') {
            imageToSave = currentImageUrl; // Keep the existing one
        }
        // If adding or replacing, it will be set below (or remain null if remove/no file)

        console.log(`[BaonForm] Initial imageToSave based on mode/action: ${imageToSave}`);


        // --- Handle Image Saving/Deleting based on Action ---
        if (imageAction === 'replace' && selectedFile) {
            console.log("[BaonForm] Action: Replace/Add selected image...");
            if (Capacitor.isNativePlatform()) {
                // --- Native: Save to Filesystem ---
                try {
                    const base64Data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result?.toString();
                            if (result && result.includes(',')) resolve(result.split(',')[1]);
                            else reject(new Error("Invalid file data from FileReader."));
                        };
                        reader.onerror = (e) => reject(e);
                        reader.readAsDataURL(selectedFile);
                    });
                    console.log("[BaonForm] Base64 read.");

                    const filename = generateUniqueFilename(selectedFile.name);
                    console.log("[BaonForm] Generated filename:", filename);

                    const writeResult = await Filesystem.writeFile({
                        path: filename, data: base64Data, directory: Directory.Data,
                    });
                    console.log("[BaonForm] Filesystem.writeFile result:", JSON.stringify(writeResult));

                    if (!writeResult?.uri) throw new Error("Filesystem.writeFile failed: No URI returned.");

                    imageToSave = writeResult.uri; // <<< Assign NATIVE URI
                    console.log("[BaonForm] Set imageToSave to NATIVE URI:", imageToSave);

                    // Delete OLD native image if REPLACING in edit mode
                    if (formMode === 'edit' && currentImageUrl && currentImageUrl !== imageToSave && !currentImageUrl.startsWith('http')) {
                        console.log("[BaonForm] Deleting old native image during replace:", currentImageUrl);
                        try { // Try deleting old file
                            try { await Filesystem.deleteFile({ path: currentImageUrl }); } // Try full path first
                            catch (e1) { // Fallback to filename
                                const oldFilename = currentImageUrl.substring(currentImageUrl.lastIndexOf('/') + 1);
                                if(oldFilename) await Filesystem.deleteFile({ path: oldFilename, directory: Directory.Data });
                            }
                            console.log("[BaonForm] Old replaced image file deleted (if existed).");
                        } catch(eDelete) { console.warn("[BaonForm] Could not delete old replaced image file:", eDelete); }
                    }

                } catch (error) {
                    console.error("[BaonForm] Error saving NATIVE image:", error);
                    showToast("Could not save image.", "error");
                    // On error, revert imageToSave to original if editing, null if adding
                    imageToSave = (formMode === 'edit') ? currentImageUrl : null;
                    console.log("[BaonForm] Reverted imageToSave on error to:", imageToSave);
                    // Consider stopping submission: return;
                }
            } else {
                // --- Web: Store Data URL (WARNING: NOT RECOMMENDED FOR PRODUCTION) ---
                console.warn("[BaonForm] Storing Data URL on Web.");
                imageToSave = imagePreviewUrl; // Use the temporary preview DataURL
            }
        }
        else if (imageAction === 'remove') {
            console.log("[BaonForm] Action: Remove image reference.");
            imageToSave = null; // Explicitly set to null

            // Delete the actual file ONLY if native and editing an existing image
            if (formMode === 'edit' && currentImageUrl && Capacitor.isNativePlatform() && !currentImageUrl.startsWith('http')) {
                console.log("[BaonForm] Deleting removed native image file:", currentImageUrl);
                try { // Try deleting file
                    try { await Filesystem.deleteFile({ path: currentImageUrl }); }
                    catch (e1) { // Fallback
                        const oldFilename = currentImageUrl.substring(currentImageUrl.lastIndexOf('/') + 1);
                        if(oldFilename) await Filesystem.deleteFile({ path: oldFilename, directory: Directory.Data });
                    }
                    console.log("[BaonForm] Removed image file deleted (if existed).");
                } catch(eDelete) { console.warn("[BaonForm] Could not delete removed image file:", eDelete); }
            }
        }
        // If action is 'keep' or 'add' (with no file selected), imageToSave retains its initial value


        console.log("[BaonForm] Final value being used for 'image' property:", imageToSave);

        // 2. Construct final meal data object
        const mealData = {
            ...(formMode === 'edit' && internalId && { id: internalId }),
            name: name.trim(),
            type: type,
            message: message.trim(),
            emoji: emoji.trim() || '🍽️',
            image: imageToSave, // <<< Use the final determined value
            recipe: {
                ingredients: parseList(ingredientsStr, ','),
                steps: parseList(stepsStr, '\n'),
                talaTip: talaTip.trim() || null
            },
            // Let storage functions handle isUserDefined flag on add/update
        };

        // 3. Dispatch the save event
        console.log("[BaonForm] Dispatching 'save' event with data:", JSON.stringify(mealData, null, 2));
        dispatch('save', mealData);
    }
    // --- End Form Submission ---

    function handleCancel() {
        console.log("BaonForm handleCancel called");
        dispatch('cancel');
    }

</script>

<!-- Form Structure -->
<div class="baon-form-container" transition:fly={{ y: 20, duration: 300, easing: quintOut }}>
    <h3 class="form-title">{formTitle}</h3>
    {#key formMode + internalId}
    <form class="baon-form" on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="baon-name-{formMode}">Name*</label> <!-- Unique ID per instance -->
            <input type="text" id="baon-name-{formMode}" bind:value={name} required placeholder="e.g., Chicken Adobo">
        </div>

        <div class="form-group">
            <label for="baon-type-{formMode}">Type</label>
            <select id="baon-type-{formMode}" bind:value={type}>
                {#each mealTypes as typeOption}
                    {#if tagStyles[typeOption]} <!-- Ensure tag exists -->
                       <option value={typeOption}>{tagStyles[typeOption].label || typeOption}</option>
                    {/if}
                {/each}
                 <option value="custom">Custom</option>
            </select>
        </div>

         <div class="form-group">
            <label for="baon-emoji-{formMode}">Emoji</label>
            <input type="text" id="baon-emoji-{formMode}" bind:value={emoji} placeholder="e.g., 🍗 (Optional)">
        </div>

        <!-- Image Input -->
        <div class="form-group">
            <label for="baon-image-file-{internalId || 'add'}">Image (Optional)</label>
            <input type="file" id="baon-image-file-{internalId || 'add'}" accept="image/*" on:change={handleFileSelect} />
            {#if imagePreviewUrl}
                <div class="image-preview-container">
                    <img src={imagePreviewUrl} alt="Preview" class="image-preview"/>
                    <button type="button" class="btn-remove-img" on:click={handleRemoveImage} title="Remove Image">×</button>
                </div>
            {:else if formMode === 'edit' && currentImageUrl}
                <p class="current-image-note">(Keeping current image)</p>
            {/if}
        </div>

        <div class="form-group">
            <label for="baon-message-{formMode}">Short Message/Tagline</label>
            <input type="text" id="baon-message-{formMode}" bind:value={message} placeholder="e.g., A classic favorite!">
        </div>

        <hr class="separator">
        <h4 class="recipe-title">Recipe Details (Optional)</h4>

        <div class="form-group">
            <label for="baon-ingredients-{formMode}">Ingredients (comma-separated)</label>
            <textarea id="baon-ingredients-{formMode}" rows="3" bind:value={ingredientsStr} placeholder="e.g., Chicken, Soy Sauce, Vinegar, Garlic"></textarea>
        </div>

        <div class="form-group">
            <label for="baon-steps-{formMode}">Steps (one step per line)</label>
            <textarea id="baon-steps-{formMode}" rows="5" bind:value={stepsStr} placeholder="1. Marinate chicken...{'\n'}2. Sauté garlic..."></textarea>
        </div>

         <div class="form-group">
            <label for="baon-tala-tip-{formMode}">Tala's Tip</label>
            <input type="text" id="baon-tala-tip-{formMode}" bind:value={talaTip} placeholder="e.g., Add a bit of sugar!">
        </div>

        <div class="form-actions">
            <button type="button" class="btn-cancel" on:click={handleCancel}>Cancel</button>
            <button type="submit" class="btn-save">{formMode === 'edit' ? 'Update Baon' : 'Add Baon'}</button> <!-- Dynamic button text -->
        </div>
    </form>
    {/key}
</div>

<style>
    .baon-form-container {
        background-color: #2c2663;
        padding: 1.5rem 1.8rem;
        border-radius: 12px;
        border: 1px solid #4a4090;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        color: #fff5e1;
        width: 100%;
        box-sizing: border-box;
        /* --- ADD THESE --- */
        overflow-y: auto; /* Allow vertical scroll INSIDE the container if needed */
        max-height: 100%; /* Ensure it doesn't try to be taller than its wrapper */
        display: flex; /* Use flexbox */
        flex-direction: column; /* Stack title and form */
        /* --- End Adds --- */
    }

     /* Add specific class to form for potential scroll */
    .baon-form {
         display: flex;
         flex-direction: column;
         gap: 0.8rem; /* Space between groups */
    }

    .form-title {
        text-align: center;
        color: #fff;
        margin: 0 0 1.5rem 0;
        font-size: 1.4rem;
        font-weight: 600;
    }
    .form-group {
        margin-bottom: 0.5rem; /* Reduced margin */
    }
    label {
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #fff5e1b3; /* Dimmer labels */
    }
    input[type="text"],
    input[type="url"],
    textarea,
    select {
        width: 100%;
        padding: 0.7rem 0.8rem;
        border-radius: 6px;
        border: 1px solid #4a4090;
        background-color: #1a163f; /* Darker input bg */
        color: #fff5e1;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: #b388eb;
        box-shadow: 0 0 0 2px rgba(179, 136, 235, 0.3);
    }
     textarea {
        resize: vertical;
        min-height: 60px;
        line-height: 1.5;
    }
    select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff5e1b3' height='24' viewBox='0 0 24 24' width='24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.7rem center;
        background-size: 1.2em;
        padding-right: 2.5rem;
        cursor: pointer;
    }
     input::placeholder, textarea::placeholder {
         color: #fff5e170;
         opacity: 1;
     }

     .separator {
         border: none;
         border-top: 1px dashed #4a4090;
         margin: 1.5rem 0;
     }
     .recipe-title {
         font-size: 1.1rem;
         color: #b388eb;
         margin-bottom: 1rem;
         text-align: center;
     }

    .form-actions {
        margin-top: 1.8rem; /* More space before actions */
        display: flex;
        justify-content: space-between; /* Spread buttons */
        gap: 1rem;
    }
    button {
        padding: 0.8rem 1.2rem; /* Slightly larger buttons */
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        flex-grow: 1; /* Make buttons take equal width */
    }
    .btn-cancel {
        background-color: transparent;
        color: #fff5e1a8;
        border: 1px solid #4a4090;
    }
    .btn-cancel:hover {
        background-color: #4a409060;
        color: #fff5e1;
    }
    .btn-save {
        background-color: #b388eb; /* Accent color */
        color: #1a163f; /* Dark text */
        box-shadow: 0 2px 5px rgba(179, 136, 235, 0.3);
    }
    .btn-save:hover {
        background-color: #c7a4ff;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(179, 136, 235, 0.4);
    }

    /* --- Styles for File Input & Preview --- */
    input[type="file"] {
        background-color: #1a163f;
        color: #fff5e1b3;
        padding: 0.5rem; /* Adjust padding */
        border-radius: 6px;
        border: 1px solid #4a4090;
        font-size: 0.9rem; /* Adjust font size */
        cursor: pointer;
        width: 100%;
    }
    input[type="file"]::file-selector-button {
        /* Style the button part */
        background-color: #4a4090;
        color: #fff5e1;
        border: none;
        padding: 0.5rem 0.8rem;
        border-radius: 4px;
        margin-right: 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    input[type="file"]::file-selector-button:hover {
         background-color: #6a5acd;
    }

    .image-preview-container {
        margin-top: 0.8rem;
        position: relative; /* For positioning remove button */
        max-width: 150px; /* Limit preview size */
        border: 1px solid #4a4090;
        border-radius: 8px;
        overflow: hidden; /* Clip image to border radius */
    }
    .image-preview {
        display: block;
        width: 100%;
        height: auto;
    }
    .btn-remove-img {
         position: absolute;
         top: 4px;
         right: 4px;
         background-color: rgba(255, 0, 0, 0.7); /* Red semi-transparent */
         color: white;
         border: none;
         border-radius: 50%;
         width: 24px;
         height: 24px;
         font-size: 1rem;
         font-weight: bold;
         line-height: 1;
         cursor: pointer;
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0;
         box-shadow: 0 1px 3px rgba(0,0,0,0.3);
         transition: background-color 0.2s ease;
    }
    .btn-remove-img:hover {
         background-color: rgba(200, 0, 0, 0.9);
    }

    .current-image-note {
        font-size: 0.8rem;
        color: #fff5e199;
        font-style: italic;
        margin-top: 0.5rem;
    }

    /* Responsive adjustments for form on larger screens if needed */
    @media (min-width: 768px) {
         .baon-form-container {
              padding: 2rem;
         }
         .form-title { font-size: 1.6rem; margin-bottom: 2rem;}
         label { font-size: 1rem; }
         input, textarea, select { font-size: 1.1rem; padding: 0.8rem 1rem; }
         textarea { min-height: 80px; }
         button { padding: 0.9rem 1.5rem; font-size: 1.05rem; }
         .recipe-title { font-size: 1.25rem; }
    }

</style>