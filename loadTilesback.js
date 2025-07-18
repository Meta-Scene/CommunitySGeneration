import * as Cesium from "cesium";


export function loadTiles(viewer, tilesetUrl) {
  let heightOffset = 45.0;
  // 配置参数
  if (tilesetUrl === "/tiles2/tiles2/tileset.json") {
    heightOffset = 37.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles2/tiles3/tileset.json") {
    heightOffset = 67.0; // 偏移高度，根据需要调整nvm
  } else if (tilesetUrl === "/tiles4/tiles2/tileset.json") {
    heightOffset = 67.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles6/tiles1/tileset.json") {
    heightOffset = 54.3; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles5/tiles1/tileset.json") {
    heightOffset = 65.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles2/tiles4/tileset.json") {
    heightOffset = 132.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles3/tiles1/tileset.json") {
    heightOffset = 95.0; // 偏移高度，根据需要调整
  }
  /**
   * 速度
   */
  // const tilesetOptions = {
  //     url: tilesetUrl,
  //     maximumScreenSpaceError: 1024, // 使用更小的屏幕空间误差
  //     maximumMemoryUsage: 1024, // 设置更高的内存限制（例如 10GB）
  //     dynamicScreenSpaceError: true,
  //     skipLevelOfDetail: true, // 不跳过 LOD 层次
  //     baseScreenSpaceError: 1024,
  //     skipScreenSpaceErrorFactor: 1024,
  //     skipLevels: 1,
  // };

  /**
   * 精度
   */
  const tilesetOptions = {
    url: tilesetUrl,
    skipScreenSpaceErrorFactor: 5,
    // maximumScreenSpaceError: 5, // 更低的误差，提高模型精度
    dynamicScreenSpaceError: true, // 动态调整误差
    // dynamicScreenSpaceErrorDensity: 0.002, // 根据设备性能优化
    // dynamicScreenSpaceErrorFactor: 10, // 精度因子
    // skipLevelOfDetail: false, // 禁止跳过 LOD，确保高分辨率
    // // baseScreenSpaceError: 5, // 基础误差更低
    // skipLevels: 1,
    maximumScreenSpaceError: 16, // 增加误差值
    baseScreenSpaceError: 16, // 增加基础误差值
    dynamicScreenSpaceErrorDensity: 0.01, // 根据设备性能优化
    dynamicScreenSpaceErrorFactor: 16, // 精度因子
    skipLevelOfDetail: false, // 允许跳过 LOD
    skipLevels: 2, // 跳过更多级别
    cacheBytes: 1024 * 1024 * 1024, // 增加缓存大小到1GB
    maximumCacheOverflowBytes: 1024 * 1024 * 1024, // 允许缓存溢出1GB
  };

  // 加载3D Tiles数据
  Cesium.Cesium3DTileset.fromUrl(tilesetUrl, tilesetOptions)
    .then((tileset) => {
      // 将3D Tiles添加到场景中
      viewer.scene.primitives.add(tileset);

      // 计算 boundingSphere 中心位置
      const boundingSphere = tileset.boundingSphere;
      const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
      const surfaceHeight = viewer.scene.globe.getHeight(cartographic);

      // 计算偏移后的目标位置
      const position = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        surfaceHeight + heightOffset || heightOffset
      );

      // 计算并设置模型的变换矩阵
      const translation = Cesium.Cartesian3.subtract(position, boundingSphere.center, new Cesium.Cartesian3());
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

      // 确保视图聚焦到加载的 tileset
      return viewer.zoomTo(tileset);
    })
    .then(() => {
      // 输出数据加载完成的信息
      console.log("数据加载完成");
      // 通知父窗口，数据加载完成
      window.parent.postMessage({type: "engineFinished"}, "*");
    })
    .catch((error) => {
      // 错误处理
      console.error("加载3D Tiles数据集时发生错误：", error);
    });

}
