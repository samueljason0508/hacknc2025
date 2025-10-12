<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
       <div className="app">
        <h1 className="main-title">Sadness</h1>
        <button className="main-button">Feel the Pain</button>
      </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
