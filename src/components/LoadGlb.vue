<script setup>
import { inject, onMounted, ref } from 'vue';
import * as Cesium from 'cesium'
const viewer = inject('viewer');
const targetRef = ref(null);
const position = Cesium.Cartesian3.fromDegrees(120, 30, 0);
const heading = Cesium.Math.toRadians(90); // 朝向（绕Z轴旋转），单位为弧度
const pitch = 0; // 俯仰
const roll = 0;  // 翻滚
const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
onMounted(() => {
  viewer.entities.add({
      name: 'rayaway',
      position,
      orientation,
      model: {
        uri: '/GLB/rayaway.glb', // 或 .gltf，替换为你的实际路径
        scale: 1.0
      }
    });
    viewer.zoomTo(viewer.entities); // 自动定位到模型
});

</script>
<template>
</template>
<style scoped></style>