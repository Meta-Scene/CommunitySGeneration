<script setup>
import { inject, onMounted, ref } from 'vue';
import * as Cesium from 'cesium'; 

const viewer = inject('viewer');
const tilesetRef = ref(null);

onMounted(() => {
  let heightOffset = 45.0; // 设置模型高度偏移
  
  // 3D Tileset配置选项
  const tilesetOptions = {
    url: "tiles/tileset.json",
    skipScreenSpaceErrorFactor: 5,
    maximumScreenSpaceError: 16,
    baseScreenSpaceError: 16,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.01,
    dynamicScreenSpaceErrorFactor: 16,
    skipLevelOfDetail: false,
    skipLevels: 2,
    cacheBytes: 1024 * 1024 * 1024,
    maximumCacheOverflowBytes: 1024 * 1024 * 1024,
  };

  // 检查viewer是否存在
  if (!viewer) {
    console.error('Viewer is not available');
    return;
  }

  // 创建并加载3D Tileset
  const tileset = new Cesium.Cesium3DTileset(tilesetOptions);
  tilesetRef.value = tileset;
  
  viewer.scene.primitives.add(tileset);

  // 等待tileset加载完成
  tileset.readyPromise
    .then(() => {
      // 计算 boundingSphere 中心位置
      const boundingSphere = tileset.boundingSphere;
      const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
      
      // 改进的地表高度获取方式
      return new Promise((resolve) => {
        // 使用sampleTerrainMostDetailed获取更精确的地表高度
        Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [cartographic])
          .then(() => {
            const surfaceHeight = cartographic.height || 0;
            resolve(surfaceHeight);
          })
          .catch(() => {
            // 如果获取失败，使用默认高度
            console.warn('无法获取精确地表高度，使用默认值');
            resolve(0);
          });
      }).then((surfaceHeight) => {
        // 计算偏移后的目标位置
        const position = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          surfaceHeight + heightOffset
        );
        console.log("模型位置:", position);
        // 计算并设置模型的变换矩阵
        const translation = Cesium.Cartesian3.subtract(position, boundingSphere.center, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

        // 确保视图聚焦到加载的 tileset
        return viewer.zoomTo(tileset);
      });
    })
    .then(() => {
      // 输出数据加载完成的信息
      console.log("模型数据加载完成");
      // 通知父窗口，数据加载完成
      window.parent.postMessage({type: "engineFinished"}, "*");
    })
    .catch((error) => {
      // 错误处理
      console.error("加载3D Tiles数据集时发生错误：", error);
      
      // 从场景中移除tileset
      if (tilesetRef.value) {
        viewer.scene.primitives.remove(tilesetRef.value);
      }
    });
});
</script>

<template>
</template>

<style scoped></style>