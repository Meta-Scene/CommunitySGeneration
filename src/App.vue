<script setup>
import { onMounted, provide, ref } from 'vue'
import * as Cesium from 'cesium'
import { TOKEN } from './stores/token.js'
import RMCopyright from './components/RMCopyright.vue'
import Load3DT from './components/Load3DT.vue'
import MessageHandler from './components/MessageHandler.vue'
import AboutCamera from './components/AboutCamera.vue'
import AboutPOP from './components/AboutPOP.vue'
import RegionDivisionLayer from './components/RegionDivisionLayer.vue'



const viewerReady = ref(false);
let viewer;
onMounted(async () => {
  // 使用Cesium的Ion服务进行认证
  Cesium.Ion.defaultAccessToken = TOKEN;

  // 创建一个Viewer实例
  viewer = new Cesium.Viewer('cesiumContainer', {
    // 使用全球地形数据，启用水面反射和水下地形渲染
  terrainProvider: Cesium.createWorldTerrain({ requestWaterMask: true }),
  animation: false,            // 隐藏动画控制器
  baseLayerPicker: false,      // 隐藏底图选择器
  fullscreenButton: false,     // 隐藏全屏按钮
  geocoder: false,             // 隐藏地理编码器
  homeButton: false,           // 隐藏主页按钮
  infoBox: false,              // 隐藏信息框
  sceneModePicker: false,      // 隐藏场景模式选择器
  selectionIndicator: false,   // 隐藏选择指示器
  timeline: false,             // 隐藏时间轴
  navigationHelpButton: false, // 隐藏导航帮助按钮
  terrainExaggeration: 1.0,    // 地形夸张比例
    infoBox: true,
  })

  // 限制滚轮缩放的范围（最小/最大可视距离，按需调整数值）
  const ssc = viewer.scene.screenSpaceCameraController
  ssc.minimumZoomDistance = 100.0
  // ssc.maximumZoomDistance = 5000.0
  // 可选：减小滚轮缩放的惯性，感觉更“稳”
  // ssc.inertiaZoom = 0.2

  provide('viewer', viewer);
  viewerReady.value = true;
})
</script>

<template>
  <div id="app">
    <div id="cesiumContainer"></div>
  </div>
   <RMCopyright v-if="viewerReady" />
   <Load3DT v-if="viewerReady" />
   <MessageHandler v-if="viewerReady" />
   <RegionDivisionLayer v-if="viewerReady" />
</template>

<style scoped>
#cesiumContainer {
  width: 98vw;
  height: 98vh;
  overflow: hidden;
}
.cesium-viewer-bottom {
  display: none !important;
}
.cesium-widget-credits {
  display: none !important;
}
</style>