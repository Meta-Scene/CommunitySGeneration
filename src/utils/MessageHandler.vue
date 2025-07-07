<template>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { eventEmitter } from './eventEmitter.js'; // 引入事件发射器工具函数

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
    
    console.log("解析父页面消息为:", data);
    
    // 通过事件发射器分发消息（使用消息类型作为事件名）
    eventEmitter.publish(data.type, payload);
  } catch (e) {
    console.error("消息处理错误:", e);
  }
};

// 组件挂载时注册窗口消息监听
onMounted(() => {
  window.addEventListener("message", handleWindowMessage);
  console.log("[MessageHandler] 窗口消息监听已启动");
});

// 组件卸载时移除窗口消息监听
onUnmounted(() => {
  window.removeEventListener("message", handleWindowMessage);
  console.log("[MessageHandler] 窗口消息监听已停止");
  eventEmitter.clearAll(); // 可选：清除所有事件监听
});
</script>

<style scoped>
.message-handler {
  display: none; /* 组件不可见，仅用于生命周期管理 */
}
</style>