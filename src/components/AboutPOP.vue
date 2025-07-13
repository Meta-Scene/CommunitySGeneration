<script setup>
import { inject, onMounted, onUnmounted, ref } from 'vue';
import * as Cesium from 'cesium'; 
const viewer = inject('viewer');
const camera=viewer.camera
eventEmitter.subscribe('createPop', (data) => {
    handleFlyTo(data)
});

onMounted(() => {
});

// 组件卸载时清理资源
onUnmounted(() => {
});
</script>

<template>
</template>

<style scoped>
</style>