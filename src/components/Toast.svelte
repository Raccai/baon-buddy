<script>
    import { toasts } from '../lib/toast';
    import { fly, fade } from 'svelte/transition';

    $: $toasts;

    function dismissToast(id) {
        toasts.update(all => all.filter (t => t.id !== id));
    }
</script>

<div class="toast-container">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    {#each $toasts as toast (toast.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div 
            class="toast {toast.type}" 
            in:fly={{ y: 20, duration: 200 }} 
            out:fade={{ duration: 200 }}
            on:click = {() => dismissToast(toast.id)}
            title="click to dismiss"
        >
            <span class="toast-message">{toast.message}</span>
            <div class="progress-bar"></div>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        top: 1rem;
        left: 1rem;
        display: flex;
        flex-direction: column;
        padding-top: env(safe-area-inset-top, 0rem);
        gap: 0.5rem;
        z-index: 99995;
        align-items: flex-start;
    }

    /* Base style */
    .toast {
		position: relative;
		background: #231F47;
		color: white;
		padding: 0.7rem 1.1rem;
		border-radius: 10px;
		font-size: 0.95rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
		animation: bounceIn 0.4s ease;
		overflow: hidden;
		min-width: 140px;
		text-align: left;
	}

    /* Variants */
    .toast.success {
        background: #36b37e;
    }

    .toast.error {
        background: #e84a5f;
    }

    .toast.info {
        background: #231F47;
    }

    .toast.faves {
        background: #502fad;
        color: #ffffff;
    }

    /* keyframe for tiny bounce */
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(10px); }
    }
    
    /* Entrance Bounce animation */
    @keyframes bounceIn {
		0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
		50% { opacity: 1; transform: translateY(0px) scale(1.05); }
		100% { transform: scale(1); }
	}

    /* Progress bar */
	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: rgba(255,255,255,0.3);
		transform-origin: left;
		animation: shrink 2.5s linear forwards;
	}

	@keyframes shrink {
		from { transform: scaleX(1); }
		to { transform: scaleX(0); }
	}

    /* Problem Screen 1: Large/Tall Tablets */
    @media (min-width: 700px) and (min-height: 1000px) {
        .toast {
            font-size: 1.4rem;
        }
    }

    /* Problem Screen 2: Very Large/Tall Tablets */
    @media (min-width: 900px) and (min-height: 1300px) {
        .toast {
            font-size: 2rem;
        }
    }
</style>
