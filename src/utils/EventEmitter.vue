<!-- EventEmitter.vue -->
<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, provide, inject } from 'vue';
/**
 * 监听器实例 reactive{} 类
 */
const listeners = reactive({});

const eventEmitter = {
  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 事件触发时执行的回调函数
   * @returns {Function} - 用于取消订阅的函数
   */
  subscribe(eventName, callback) {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(callback);
    return () => this.unsubscribe(eventName, callback);
  },
  
  /**
   * 取消订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 需要取消的回调函数
   */
  unsubscribe(eventName, callback) {
    if (listeners[eventName]) {
      listeners[eventName] = listeners[eventName].filter(
        listener => listener !== callback
      );
    }
  },
  
  /**
   * 发布事件（同步式）
   * @param {string} eventName - 事件名称
   * @param {...any} args - 传递给监听器的参数
   * @returns {Array} - 所有监听器的返回值数组
   */
  publish(eventName, ...args) {
    if (!listeners[eventName]) {
      return [];
    }
    
    // 执行所有监听器并收集结果
    return listeners[eventName].map(listener => {
      try {
        return listener(...args);
      } catch (error) {
        console.error(`执行事件监听器 "${eventName}" 时出错:`, error);
        return null;
      }
    });
  },
  
  /**
   * 发布事件（异步式）
   * @param {string} eventName - 事件名称
   * @param {...any} args - 传递给监听器的参数
   * @returns {Promise<Array>} - 所有监听器的返回值数组的Promise
   */
  async publishAsync(eventName, ...args) {
    if (!listeners[eventName]) {
      return [];
    }
    
    const results = [];
    for (const listener of listeners[eventName]) {
      try {
        const result = await listener(...args);
        results.push(result);
      } catch (error) {
        console.error(`执行异步事件监听器 "${eventName}" 时出错:`, error);
        results.push(null);
      }
    }
    
    return results;
  },
  
  /**
   * 清除特定事件的所有监听器
   * @param {string} eventName - 事件名称
   */
  clear(eventName) {
    if (listeners[eventName]) {
      delete listeners[eventName];
    }
  },
  
  /**
   * 清除所有事件的所有监听器
   */
  clearAll() {
    Object.keys(listeners).forEach(eventName => {
      delete listeners[eventName];
    });
  }
};


provide('eventEmitter', eventEmitter);

onMounted(() => {
  console.log('EventEmitter 组件已挂载');
});

onUnmounted(() => {
  eventEmitter.clearAll();
  console.log('EventEmitter 组件已卸载，所有事件监听器已清除');
});

export const useEventEmitter = () => inject('eventEmitter');
</script>