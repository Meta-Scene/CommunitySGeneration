<script setup>
import { inject, onMounted, ref } from 'vue';
import * as Cesium from 'cesium'
const viewer = inject('viewer');
const targetRef = ref(null);

// 固定的模型位置（经度、纬度、高程）
const position = Cesium.Cartesian3.fromDegrees(121.53544495955902, 29.865098239559977, 46.178579032492934);
const heading = Cesium.Math.toRadians(90); // 朝向（绕Z轴旋转），单位为弧度
const pitch = 0; // 俯仰
const roll = 0;  // 翻滚
const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);

onMounted(() => {
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  const entity = viewer.entities.add({
    name: 'rayaway',
    position,
    orientation,
    model: {
      uri: '/GLB/rayaway.glb', // 或 .gltf，替换为你的实际路径
      scale: 1.0
    }
  });

  viewer.zoomTo(entity); // 自动定位到模型
});

</script>
<template>
</template>
<style scoped></style>