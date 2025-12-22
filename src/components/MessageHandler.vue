<template>
  <div class="message-handler">
    <!-- 消息处理组件 -->
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import eventEmitter from "../utils/EventEmitter.js";

// 定义消息处理相关的引用
const messageData = ref(null);
const isMessageReceived = ref(false);

/**
 * GeoJSON 网格分区：默认 key 和默认 geojson 路径
 * 你可以按你的实际文件放置路径调整：
 * 建议把 geojson 放到 public/geojson 下，然后用 /geojson/xxx.geojson
 */
const DEFAULT_GRID_KEY = "region-division";
const DEFAULT_GRID_URL = "/geojson/assinGrid.geojson"; // ✅ 改成你实际文件，比如 /geojson/yingchun_shequ.geojson

// 窗口消息处理函数
const handleWindowMessage = async (event) => {
  const message = event.data;

  try {
    // 消息来源验证（保留你的逻辑）
    if (
      event.source !== window.parent ||
      JSON.stringify(message).includes("cesiumMap")
    ) {
      return;
    }

    console.log("侦测到父页面消息");
    const data = message;
    const payload = data?.payload;

    isMessageReceived.value = true;
    messageData.value = data;

    console.log("解析父页面消息为:", data);

    // 消息类型处理逻辑
    switch (data.type) {
      case "info":
        console.log("侦测到获取相机位置需求");
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
        clearBorderLine("static/assinEdge.geojson");
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
        initBorderLine("static/assinEdge.geojson");
        break;

      case "clearElefence":
        console.log("侦测到清除电子围栏需求");
        clearBorderLine("static/assinEdge.geojson");
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

      /** ===================== 关键：GeoJSON 网格分区接口 ===================== */

      case "showRegionDivision": {
        console.log("侦测到显示微网格需求");

        // 允许父页面传：
        // payload = { key, geojson, zoomTo, options:{ fillAlpha, outlineAlpha, outlineWidth, ... } }
        // 兼容旧逻辑：如果 payload 为空，就走默认路径
        const p = payload || {};
        const key = p.key || DEFAULT_GRID_KEY;
        const geojson = p.geojson || DEFAULT_GRID_URL;

        await setGrid({
          key,
          geojson,
          zoomTo: !!p.zoomTo,
          // options 透传给 RegionDivisionLayer（里面用 fillAlpha/outlineAlpha 控制透明度）
          options: p.options || undefined,
          // replace：默认 true（每次 show 都重载）；如果你想只 show，不重载，传 replace:false
          replace: p.replace ?? true,
          show: p.show ?? true,
        });
        break;
      }

      case "hideRegionDivision": {
        console.log("侦测到隐藏微网格需求");
        const p = payload || {};
        const key = p.key || DEFAULT_GRID_KEY;
        removeGrid({ key, remove: false }); // 仅隐藏
        break;
      }

      case "removeRegionDivision": {
        console.log("侦测到移除微网格需求");
        const p = payload || {};
        const key = p.key || DEFAULT_GRID_KEY;
        await removeGrid({ key, remove: true }); // 真删除
        break;
      }

      case "setRegionDivisionStyle": {
        console.log("侦测到调整微网格样式/透明度需求");
        const p = payload || {};
        const key = p.key || DEFAULT_GRID_KEY;
        // payload.options: { fillAlpha, outlineAlpha, outlineWidth, ... }
        window.__regionDivisionApi?.setRegionDivisionStyle({
          key,
          options: p.options || {},
        });
        break;
      }

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

/** ===================== 原有占位/发布函数：保留 ===================== */

function getcameraPosInfo() {
  eventEmitter.publish("cameraPosMessage");
}
function handleFlyTo(payload) {
  eventEmitter.publish("FlyToMessage", payload);
}
function startRotation(payload) {}
function stopRotation() {}
function setLookDistance(payload) {}
function createPop(payload) {
  console.log("Hasinpop1");
  eventEmitter.publish("createPop", payload);
}
function addYuJing(payload) {}
function clearPopByType(payload) {
  eventEmitter.publish("clearPopByType", payload);
}
function clearYuJing(payload) {}
function clearBorderLine(geojsonPath) {}

/**
 * resetAll 原版会引用 viewer 变量（你这里未定义，会直接抛异常）
 * 这里改成更安全：如果你未来把 viewer 挂到 window（例如 window.__viewer），可以用它
 */
function resetAll() {
  const v = window.__viewer;
  if (!v) {
    console.warn("resetAll: window.__viewer 未设置，跳过 entities 清理");
    return;
  }
  v.entities.values.forEach(function (entity) {
    entity.show = false;
  });
}

function startFeiXing() {}
function paseFeiXing() {}
function stopFeiXing() {}
function initBorderLine(geojsonPath) {}

/** ===================== 新增：网格显示/隐藏/移除的实现 ===================== */

/**
 * 显示/加载 GeoJSON 网格
 * args: { key, geojson, zoomTo, options, replace, show }
 */
async function setGrid(args = {}) {
  const api = window.__regionDivisionApi;
  if (!api?.showRegionDivision) {
    console.error("RegionDivision API 未就绪：请确认已挂载 <RegionDivisionLayer />");
    return;
  }
  await api.showRegionDivision({
    key: args.key || DEFAULT_GRID_KEY,
    geojson: args.geojson || DEFAULT_GRID_URL,
    zoomTo: !!args.zoomTo,
    replace: args.replace ?? true,
    show: args.show ?? true,
    options: args.options, // 这里放 fillAlpha/outlineAlpha 等
  });
}

/**
 * 隐藏 or 移除网格
 * args: { key, remove:boolean }
 * remove=false => hide
 * remove=true  => remove
 */
async function removeGrid(args = {}) {
  const api = window.__regionDivisionApi;
  if (!api) {
    console.error("RegionDivision API 未就绪：请确认已挂载 <RegionDivisionLayer />");
    return;
  }
  const key = args.key || DEFAULT_GRID_KEY;
  if (args.remove) {
    await api.removeRegionDivision({ key });
  } else {
    api.hideRegionDivision({ key });
  }
}
</script>

<style scoped>
.message-handler {
  display: none;
}
</style>
