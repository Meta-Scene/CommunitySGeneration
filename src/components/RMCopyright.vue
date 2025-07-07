<script setup>
import { inject, onMounted, ref } from 'vue';
const viewer = inject('viewer');
const targetRef = ref(null);
onMounted(() => {
  if (viewer) {
    // 获取版权信息
    targetRef.value = document.querySelectorAll('.cesium-viewer-bottom');
    // 隐藏版权信息
    hideElements();
  } else {
    console.error('Viewer is not available');
  }
});
// 定义隐藏版权信息的方法
const hideElements = () => {
  if (targetRef.value) {
    targetRef.value.forEach(element => {
      element.style.display = 'none';
    });
  }
};
</script>
<template>
</template>
<style scoped></style>