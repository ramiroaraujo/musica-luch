<svelte:options accessors/>
<script>
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    export let audio;
    export let volume = 1;
    export let volumeDown = () => {
        paused = true
    }
    export let volumeUp = () => {
        volume = 1;
    }
    let paused = true;
    let currentTime = 0;
    let onClick = () => {
        if (!paused) {
            paused = true;
            dispatch('volumeup')
        } else {
            paused = false;
            if (audio.reset) {
                dispatch('volumedown')
                currentTime = 0;
            }

        }
    }
    let finished = () => {
        paused = true;
        currentTime = 0;
        dispatch('volumeup')
    }
</script>
<div class="col-4">
    <button style='--color: {audio.color}' on:mouseup={onClick}>{audio.name}</button>
    <audio sty src={audio.src} loop={audio.loop} bind:paused={paused} bind:currentTime={currentTime}
           bind:volume={volume}
           on:ended={finished}></audio>
</div>
<style>
    div.col-4 {
        display: flex;
        justify-content: center;
    }

    button {
        border-radius: 50%;
        display: block;
        width: 200px;
        height: 200px;
        background-color: var(--color);
    }
</style>