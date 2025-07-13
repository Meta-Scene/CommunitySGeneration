<template>
  <div class="message-handler">
    <!-- 消息处理组件 -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import eventEmitter from "../utils/EventEmitter.js"
// 定义消息处理相关的引用
const messageData = ref(null);
const isMessageReceived = ref(false);

// 窗口消息处理函数
const handleWindowMessage = (event) => {
  const message = event.data;
  const origin = event.origin;
  
  try {
    // 消息来源验证
    if (event.source !== window.parent || JSON.stringify(message).includes("cesiumMap")) {
      return;
    }
    
    console.log("侦测到父页面消息");
    const data = message;
    const payload = data.payload;
    isMessageReceived.value = true;
    messageData.value = data;
    
    console.log("解析父页面消息为:", data);
    
    // 消息类型处理逻辑
    switch (data.type) {
      case "info":
        console.log("侦测到获取相机位置需求");
        // sendCameraInfo();
        getcameraPosInfo();
        break;
      case "flyTo":
        console.log("侦测到设置相机位置需求");
        handleFlyTo(payload);
        break;
      case "startRoate":
        console.log("侦测到开始旋转需求");
        startRotation(payload);
        break;
      case "flyTow":
        console.log("侦测到停止旋转需求");
        stopRotation();
        break;
      case "setLookDistance":
        console.log("侦测到设置可视高度需求");
        setLookDistance(payload);
        break;
      case "lookAt":
        console.log("侦测到飞向对象需求");
        console.log("错误,项目中未指定ID");
        break;
      case "createPop":
        console.log("侦测到根据GSI坐标创建气泡需求");
        createPop(payload);
        break;
      case "createEffect":
        console.log("侦测到根据GSI坐标创建动效需求");
        addYuJing(payload);
        break;
      case "clearPopByType":
        console.log("侦测到删除指定类型气泡需求");
        clearPopByType(payload);
        break;
      case "clearAllEffect":
        console.log("侦测到清空所有动效需求");
        clearYuJing(payload);
        break;
      case "reset":
        console.log("侦测到清空场景需求");
        clearBorderLine('static/assinEdge.geojson');
        resetAll();
        break;
      case "beginFly":
        console.log("侦测到开始飞行需求");
        startFeiXing();
        break;
      case "pauseFly":
        console.log("侦测到暂停飞行需求");
        paseFeiXing();
        break;
      case "resumeFly":
        console.log("侦测到继续飞行需求");
        startFeiXing();
        break;
      case "stopFly":
        console.log("侦测到停止飞行需求");
        stopFeiXing();
        break;
      case "startElefence":
        console.log("侦测到启动电子围栏需求");
        initBorderLine('static/assinEdge.geojson');
        break;
      case "clearElefence":
        console.log("侦测到清除电子围栏需求");
        clearBorderLine('static/assinEdge.geojson');
        break;
      case "marker.clearEffectByType":
        console.log("侦测到删除指定类型通用事件告警动效需求");
        console.log("未完成");
        break;
      case "marker.clearAllEffect":
        console.log("侦测到清空所有通用事件告警动效需求");
        console.log("未完成");
        break;
      case "SetRes":
        console.log("侦测到设置分辨率需求");
        console.log("未完成");
        break;
      case "showRegionDivision":
        console.log("侦测到显示微网格需求");
        setGrid("static/assinGrid.geojson");
        break;
      case "hideRegionDivision":
        console.log("侦测到隐藏微网格需求");
        removeGrid("static/assinGrid.geojson");
        break;
      default:
        console.log("未知指令:", data);
    }
  } catch (e) {
    console.error("消息处理错误:", e);
  }
};

// 组件挂载时注册窗口消息监听
onMounted(() => {
  window.addEventListener("message", handleWindowMessage);
  console.log("窗口消息监听已启动");
});

// 组件卸载时移除窗口消息监听
onUnmounted(() => {
  window.removeEventListener("message", handleWindowMessage);
  console.log("窗口消息监听已停止");
});

// 以下为占位函数，实际功能需在其他地方实现
function getcameraPosInfo() {
  eventEmitter.publish('cameraPosMessage');
}
function handleFlyTo(payload) {
  eventEmitter.publish('FlyToMessage', payload);
}
function startRotation(payload) {}
function stopRotation() {}
function setLookDistance(payload) {}
function createPop(payload) {
  console.log("Hasinpop1")
  eventEmitter.publish('createPop', payload);
}
function addYuJing(payload) {}
function clearPopByType(payload) {
  eventEmitter.publish('clearPopByType', payload);
}
function clearYuJing(payload) {}
function clearBorderLine(geojsonPath) {}
function resetAll() {
  viewer.entities.values.forEach(function (entity) {
    entity.show = false
  })
}
function startFeiXing() {}
function paseFeiXing() {}
function stopFeiXing() {}
function initBorderLine(geojsonPath) {}
function setGrid(geojsonPath) {}
function removeGrid(geojsonPath) {}
</script>

<style scoped>
.message-handler {
  /* 组件样式 */
  display: none;
}
</style>