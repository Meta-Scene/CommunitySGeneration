<template>
  <div>
    <!-- 气泡管理组件 - 无UI展示 -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, inject } from 'vue';
import { eventEmitter } from '../utils/eventEmitter.js'; // 引入事件发射器
import * as Cesium from 'cesium'; 

// 注入Cesium Viewer实例
const viewer = inject('viewer');

// 配置常量
const ICON_CONFIG = {
  default: 'markers/marker2.png',
  moren: 'markers/moren.png'
};

const defaultPosition = {
  longitude: 122.311675,
  latitude: 29.962897,
  height: 100
};

// 存储创建的实体和事件处理器
const entities = ref([]);
const screenSpaceEventHandler = ref(null);

// 数据校验函数，返回处理后的数据
const processPopData = (data) => {
  // 数据默认值
  const defaultPopData = {
    id: 'default-id-' + Date.now(),
    title: '默认气泡',
    group: 'space',
    type: 'onelevelspace',
    location: JSON.stringify(defaultPosition),
    popSize: 10,
    clickable: false,
    hoverable: false,
    firstLevel: '',
    secondLevel: ''
  };
  
  // 数据合并与校验
  const popData = { ...defaultPopData, ...data };
  
  // 检查必要字段
  const requiredFields = ['id', 'group', 'type'];
  const missing = requiredFields.filter(field => !popData[field]);
  
  if (missing.length > 0) {
    console.warn('数据缺失必要字段，使用默认值:', missing);
  }
  
  // 智能处理popName字段：优先使用popName，其次title，最后id
  popData.popName = popData.popName || popData.title || popData.id;
  
  return popData;
};

// 创建气泡实体
const createPopEntity = (popData) => {
  const processedData = processPopData(popData);
  
  // 解析位置数据
  let poplocation = processedData.location;
  if (typeof poplocation === 'string') {
    try {
      poplocation = JSON.parse(poplocation);
      // 兼容不同格式的坐标
      if (poplocation.longitude !== undefined) {
        poplocation.x = poplocation.longitude;
        poplocation.y = poplocation.latitude;
        poplocation.z = poplocation.height || 0;
      }
    } catch (e) {
      console.error('解析位置数据失败，使用默认坐标:', e);
      poplocation = {
        x: defaultPosition.longitude,
        y: defaultPosition.latitude,
        z: defaultPosition.height
      };
    }
  }
  
  // 解析图标配置
  let popicon = ICON_CONFIG[processedData.item?.icon || 'default'];
  
  // 解析大小配置
  let popWidth = 8;
  let popHeight = 8;
  if (processedData.popSize) {
    popHeight = processedData.popSize;
    popWidth = processedData.popSize;
  }
  
  // 计算Z轴偏移量
  let eyeOffsetZ = processedData.eyeOffsetZ || -100;
  
  // 转换经纬度坐标为Cesium笛卡尔坐标
  const poPosition = Cesium.Cartesian3.fromDegrees(
    poplocation.x,
    poplocation.y,
    poplocation.z
  );
  
  // 创建实体
  const entity = new Cesium.Entity({
    name: processedData.id,
    position: poPosition,
    category: processedData.group,
    firstLevel: processedData.firstLevel,
    secondLevel: processedData.secondLevel,
    item: processedData.item,
    label: {
      text: processedData.popName, // 使用处理后的popName
      font: '14pt Source Han Sans CN',
      fillColor: Cesium.Color.WHITE,
      backgroundColor: Cesium.Color.BLACK,
      showBackground: true,
      style: Cesium.LabelStyle.FILL,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      pixelOffset: new Cesium.Cartesian2(0, -10)
    },
    billboard: {
      image: popicon,
      width: popWidth,
      height: popHeight,
      eyeOffset: new Cesium.Cartesian3(0.0, 0.0, eyeOffsetZ),
      pixelOffset: new Cesium.Cartesian2(0, 0),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      scale: 1.0,
      scaleByDistance: new Cesium.NearFarScalar(1.0, 0.5, 1000000.0, 0.1)
    },
    // 实体交互属性
    properties: {
      clickable: processedData.clickable || false,
      hoverable: processedData.hoverable || false
    }
  });
  
  // 添加实体到Viewer并缓存
  const addedEntity = viewer.entities.add(entity);
  entities.value.push(addedEntity);
  
  return addedEntity;
};

// 处理接收到的创建气泡消息
const handleCreatePop = (popData) => {
  console.log("接收到创建气泡消息:", popData);
  createPopEntity(popData);
};

// 气泡点击事件处理
const handlePopClick = (movement) => {
  const pick = viewer.scene.pick(movement.position);
  if (Cesium.defined(pick) && pick.id) {
    // 获取实体位置
    let position;
    if (pick.id.position) {
      // 尝试获取动态位置
      if (pick.id.position.getValue) {
        position = pick.id.position.getValue(viewer.clock.currentTime);
      } else {
        // 静态位置
        position = pick.id.position._value;
      }
    }
    
    // 转换为窗口坐标
    let windowPosition = { x: 0, y: 0 };
    if (position) {
      // 兼容不同版本的Cesium
      if (Cesium.SceneTransforms && Cesium.SceneTransforms.wgs84ToWindowCoordinates) {
        windowPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          viewer.scene,
          position
        );
      } else if (viewer.scene.cartesianToCanvasCoordinates) {
        windowPosition = viewer.scene.cartesianToCanvasCoordinates(position);
      }
    }
    
    // 构建消息数据
    const message = {
      type: "popClick",
      payload: {
        source: "cesiumMap",
        id: pick.id.name,
        firstLevel: pick.id.firstLevel || "",
        secondLevel: pick.id.secondLevel || "",
        item: pick.id.item || {},
        senceVector2D: {
          x: windowPosition.x || 0,
          y: windowPosition.y || 0
        }
      }
    };
    
    // 发送消息给父窗口
    console.log("将向父类发送：", JSON.stringify(message));
    window.parent.postMessage(JSON.stringify(message), "*");
    
    // 通过事件发射器发布事件
    eventEmitter.publish("popClick", message.payload);
    console.log("通过事件发射器发布popClick事件");
  }
};

// 订阅事件
let unsubscribeCreatePop;

onMounted(() => {
  // 订阅createPop事件
  unsubscribeCreatePop = eventEmitter.subscribe('createPop', handleCreatePop);
  
  // 初始化屏幕空间事件处理器
  screenSpaceEventHandler.value = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  
  // 绑定气泡点击事件
  screenSpaceEventHandler.value.setInputAction(
    handlePopClick,
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
  
  console.log("气泡管理组件已启动，等待接收createPop消息");
});

// 组件卸载时清理资源
onUnmounted(() => {
  // 取消订阅
  if (unsubscribeCreatePop) {
    unsubscribeCreatePop();
  }
  
  // 移除所有实体
  entities.value.forEach(entity => {
    viewer.entities.remove(entity);
  });
  entities.value = [];
  
  // 移除事件处理器
  if (screenSpaceEventHandler.value) {
    screenSpaceEventHandler.value.removeAllEvents();
    screenSpaceEventHandler.value = null;
  }
  
  console.log("气泡管理组件已卸载，资源清理完成");
});
</script>

<style scoped>
/* 组件样式 */
</style>