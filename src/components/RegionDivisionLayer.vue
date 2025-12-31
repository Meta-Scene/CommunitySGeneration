<script setup>
import { inject, onMounted, onBeforeUnmount } from "vue";
import * as Cesium from "cesium";

/**
 * RegionDivisionLayer
 * - 加载 GeoJSON 网格分区（你的数据：FeatureCollection + MultiPolygon）
 * - 不显示编号/label
 * - 每个格子（feature）颜色不同：用 properties.id 映射到稳定色
 * - 暴露 window.__regionDivisionApi 给 MessageHandler / 控制台 / 父页面调用
 */

const viewer = inject("viewer");
const layers = new Map(); // key -> { ds, options }

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function toColor(css, alpha = 1.0, fallback = Cesium.Color.WHITE) {
  try {
    return Cesium.Color.fromCssColorString(css).withAlpha(clamp01(alpha));
  } catch {
    return fallback.withAlpha(clamp01(alpha));
  }
}

// 根据 id 生成稳定颜色（HSLA -> Cesium.Color）
function stableColorFromId(id) {
  const s = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;

  const hue = hash % 360;
  const sat = 60;   // %
  const light = 55; // %
  return Cesium.Color.fromHsl(hue / 360, sat / 100, light / 100, 1.0);
}

function applyStyleToDataSource(ds, options = {}) {
  const fillAlpha = options.fillAlpha ?? 0.35;
  const outlineAlpha = options.outlineAlpha ?? 1.0;
  const outlineWidth = options.outlineWidth ?? 2;

  ds.entities.values.forEach((entity) => {
    if (entity.polygon) {
      const id = entity.properties?.id?.getValue?.() ?? entity.id;
      const base = stableColorFromId(id);
      entity.polygon.material = base.withAlpha(clamp01(fillAlpha));
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Cesium.Color.BLACK.withAlpha(clamp01(outlineAlpha));
      entity.polygon.outlineWidth = outlineWidth;

      // 不显示 label
      if (entity.label) entity.label.show = false;
      if (entity.billboard) entity.billboard.show = false;
    }
  });
}

async function showRegionDivision({
  key = "region-division",
  geojson,
  zoomTo = true,
  replace = true,
  show = true,
  options = {},
} = {}) {
  if (!viewer) throw new Error("Viewer not ready");

  if (!geojson) throw new Error("geojson is required (url string or GeoJSON object)");

  if (replace) {
    await removeRegionDivision({ key });
  }

  const ds = await Cesium.GeoJsonDataSource.load(geojson, {
    clampToGround: true,
  });

  applyStyleToDataSource(ds, options);

  viewer.dataSources.add(ds);
  ds.show = !!show;

  layers.set(key, { ds, options });

  if (zoomTo) {
    try {
      await viewer.zoomTo(ds);
    } catch (e) {
      console.warn("zoomTo failed:", e);
    }
  }

  return ds;
}

function hideRegionDivision({ key = "region-division" } = {}) {
  const layer = layers.get(key);
  if (layer?.ds) layer.ds.show = false;
}

function setRegionDivisionStyle({ key = "region-division", options = {} } = {}) {
  const layer = layers.get(key);
  if (!layer?.ds) return;
  layer.options = { ...layer.options, ...options };
  applyStyleToDataSource(layer.ds, layer.options);
}

async function removeRegionDivision({ key = "region-division" } = {}) {
  const layer = layers.get(key);
  if (layer?.ds && viewer) {
    viewer.dataSources.remove(layer.ds, true);
    layers.delete(key);
  }
}

function clearAll() {
  if (!viewer) return;
  for (const [key] of layers) removeRegionDivision({ key });
}

onMounted(() => {
  // 暴露给 MessageHandler / 控制台 / 父页面
  window.__regionDivisionApi = {
    showRegionDivision,
    hideRegionDivision,
    removeRegionDivision,
    setRegionDivisionStyle,
    clearAll,
  };

  // B：通知外部：RegionDivision API 已就绪（Console 可监听）
  window.dispatchEvent(new Event('region-division-api-ready'));
});

onBeforeUnmount(() => clearAll());
</script>

<template><div style="display:none" /></template>
