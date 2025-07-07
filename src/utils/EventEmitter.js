// utils/eventEmitter.js
import { reactive } from 'vue';

/**
 * 事件发射器工具函数 - 实现发布-订阅模式
 * @module eventEmitter
 */

/**
 * 监听器存储对象
 * @type {Object.<string, Function[]>}
 */
const listeners = reactive({});

/**
 * 事件发射器实例
 * @type {Object}
 */
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

/**
 * 初始化事件发射器（可选，用于生命周期管理）
 * @param {Object} [options] - 初始化选项
 * @param {Function} [options.onMount] - 挂载时的回调
 * @param {Function} [options.onUnmount] - 卸载时的回调
 */
const initEventEmitter = (options = {}) => {
  if (options.onMount) {
    options.onMount();
    console.log('事件发射器已初始化');
  }
  
  return {
    destroy() {
      eventEmitter.clearAll();
      if (options.onUnmount) {
        options.onUnmount();
      }
      console.log('事件发射器已销毁，所有事件监听器已清除');
    }
  };
};

export {
  eventEmitter,
  initEventEmitter
};