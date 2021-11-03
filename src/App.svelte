<script>
    import Button from "./Button.svelte";

    export let name;
    let audios = [
        {
            name: 'Musica de fondo',
            reset: false,
            loop: true,
            from: 0,
            to: null,
            src: 'bg.mp3',
            color: '#dba7ef'
        },
        {
            name: 'Payaso plin plin',
            reset: true,
            loop: false,
            from: 0,
            to: null,
            src: 'payaso.mp3',
            color: '#cd6f6f'
        },
        {
            name: 'Disco rayado',
            reset: true,
            loop: false,
            from: 0,
            to: null,
            src: 'disco.mp3',
            color: '#90cb8a'
        }
    ]
    let bg;
</script>

<main>
    <div class="container">
        <div class="row">
            <div class="col-12 title">
                <h1>Música Luch</h1>
            </div>
            <Button bind:this={bg} audio={audios[0]}/>
            {#each audios.slice(1) as audio}
                <Button audio={audio} on:volumedown={()=>{bg.volumeDown()}} on:volumeup={()=>{bg.volumeUp()}}/>
            {/each}
        </div>
        <div class="col-12 reload">
            <button on:click={()=>{location.reload(true)}}>Recargar</button>
        </div>
    </div>
</main>

<style>
    .title {
        margin-bottom: 50px;
        font-weight: bold;
    }
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }
    .reload {
        margin-top:150px;
    }
    .reload button {
        width: 200px;
        height: 200px;
        background-color: orange;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>