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
    return Cesium.Color.fromCssColorString(css).withAlpha(alpha);
  } catch {
    return fallback.withAlpha(alpha);
  }
}

function hashInt(n) {
  // 稳定散列（32-bit）
  let x = Number(n) | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function colorFromId(id, fillAlpha, outlineAlpha) {
  // 让不同 id 映射到不同 hue（0~1），并固定饱和度/亮度
  const h = (hashInt(id) % 360) / 360; // hue
  const s = 0.75;
  const l = 0.50;

  const fill = Cesium.Color.fromHsl(h, s, l).withAlpha(clamp01(fillAlpha));
  const outline = Cesium.Color.fromHsl(h, s, Math.max(0.30, l - 0.08)).withAlpha(
    clamp01(outlineAlpha)
  );
  return { fill, outline };
}

function applyPerFeatureStyle(ds, options) {
  // options：整体配置 + 每格不同色
  const {
    fillAlpha = 0.5,
    outlineAlpha = 0.95,
    outlineWidth = 2,
    clampToGround = true,
    useDistinctColorPerFeature = true,
    // 如果你不想每格不同色，也可以设 false，然后用统一颜色
    uniformFillColor = "#00FFFF",
    uniformOutlineColor = "#00FFFF",
  } = options || {};

  const uniformFill = toColor(uniformFillColor, fillAlpha);
  const uniformOutline = toColor(uniformOutlineColor, outlineAlpha);

  for (const e of ds.entities.values) {
    // 取 id（你的 properties 里是 id）
    const idVal =
      e.properties?.id?.getValue?.() ??
      e.properties?.ID?.getValue?.() ??
      e.id; // 兜底

    const { fill, outline } =
      useDistinctColorPerFeature && idVal != null
        ? colorFromId(idVal, fillAlpha, outlineAlpha)
        : { fill: uniformFill, outline: uniformOutline };

    // Polygon / MultiPolygon
    if (e.polygon) {
      e.polygon.material = fill;
      e.polygon.outline = true;
      e.polygon.outlineColor = outline;

      // ✅ 去掉编号：不设置 label；如果已有 label，主动清掉
      e.label = undefined;

      // 可选：立体围栏
      // if (typeof options.extrudedHeight === "number") e.polygon.extrudedHeight = options.extrudedHeight;
    }

    // LineString（如果你的 geojson 未来有线）
    if (e.polyline) {
      e.polyline.material = outline;
      e.polyline.width = outlineWidth;
      e.polyline.clampToGround = clampToGround;
      e.label = undefined;
    }

    // Point（未来可能用到）
    if (e.point) {
      e.point.color = outline;
      e.point.pixelSize = options.pointSize ?? 6;
      e.point.outlineColor = Cesium.Color.BLACK.withAlpha(0.6);
      e.point.outlineWidth = 1;
      e.label = undefined;
    }
  }
}

async function removeRegionDivision({ key = "region-division" } = {}) {
  if (!viewer) return;
  const info = layers.get(key);
  if (!info) return;
  layers.delete(key);
  viewer.dataSources.remove(info.ds, true);
}

function hideRegionDivision({ key = "region-division" } = {}) {
  const info = layers.get(key);
  if (info) info.ds.show = false;
}

async function showRegionDivision({
  key = "region-division",
  geojson, // ✅ 推荐 "/geojson/xxx.geojson" 或 GeoJSON 对象
  show = true,
  zoomTo = false,
  replace = true,
  options = {
    // 默认：每格不同色 + 无编号
    useDistinctColorPerFeature: true,
    fillAlpha: 0.18,
    outlineAlpha: 0.95,
    outlineWidth: 2,
    clampToGround: true,
  },
} = {}) {
  if (!viewer) throw new Error("viewer not ready");
  if (!geojson) throw new Error("geojson is required");

  if (replace) await removeRegionDivision({ key });

  const ds = await Cesium.GeoJsonDataSource.load(geojson, {
    clampToGround: options?.clampToGround ?? true,
  });

  // 每格不同色 + 清掉 label
  applyPerFeatureStyle(ds, options);

  ds.show = !!show;
  viewer.dataSources.add(ds);
  layers.set(key, { ds, options });

  if (zoomTo) await viewer.flyTo(ds);

  return { key };
}

function setRegionDivisionStyle({
  key = "region-division",
  options = {},
} = {}) {
  const info = layers.get(key);
  if (!info) return;

  // 合并 options 并重新应用
  info.options = { ...(info.options || {}), ...(options || {}) };
  applyPerFeatureStyle(info.ds, info.options);
}

function clearAll() {
  if (!viewer) return;
  for (const [key, info] of layers.entries()) {
    viewer.dataSources.remove(info.ds, true);
    layers.delete(key);
  }
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
});

onBeforeUnmount(() => clearAll());
</script>

<template><div style="display:none" /></template>
