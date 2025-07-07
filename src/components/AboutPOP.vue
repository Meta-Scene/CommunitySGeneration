<script setup>
import { inject, onMounted, onUnmounted, ref } from 'vue';
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

// 数据校验函数
const validatePopData = (data) => {
    const requiredFields = ['id', 'title', 'group', 'type'];
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
        console.error('数据缺失字段:', missing);
        return false;
    }
    return true;
};

// 示例数据
let poptest = [
    {
        "id": "66c2a24b1aa3b1f3dab70c05",
        "title": "九洲花园",
        "group": "space",
        "type": "onelevelspace",
        "SapacePopHadNoHoverColor": true,
        "visibleheight": 5000,
        "payload": "{\"type\":\"space\",\"item\":{\"name\":\"九洲花园\",\"townId\":\"25928\",\"_id\":\"66c2a24b1aa3b1f3dab70c04\",\"screenId\":\"66875a9ed036d900248da966\",\"spaceId\":\"66c2a0c51aa3b1f3dab70a6e\",\"__v\":0,\"createTime\":\"2024-08-19 09:39:23\",\"status\":1,\"updateTime\":\"2024-08-19 09:39:23\",\"hoverable\":false,\"clickable\":false}}",
        "item": {
            "name": "九洲花园",
            "townId": "25928",
            "_id": "66c2a24b1aa3b1f3dab70c05",
            "screenId": "66875a9ed036d900248da966",
            "spaceId": "66c2a0c51aa3b1f3dab70a6e",
            "__v": 0,
            "createTime": "2024-08-19 09:39:23",
            "status": 1,
            "updateTime": "2024-08-19 09:39:23",
            "hoverable": false,
            "clickable": false
        },
        "fronsize": 14,
        "hoverable": false,
        "clickable": false,
        "hadWebClick": false,
        "popSize": 10
    },
    {
        "id": "66c2a24b1aa3b1f3dab98c07",
        "location": "{\"x\":122.31167487160636,\"y\":29.962897275268837,\"z\":-1.3969838619232178e-9}",
        "title": "莲恒公寓",
        "group": "space",
        "type": "onelevelspace",
        "SapacePopHadNoHoverColor": false,
        "visibleheight": 5000,
        "payload": "{\"type\":\"space\",\"item\":{\"icon\":\"iconmorentubiao\",\"matrixPoint\":\"{\\\"x\\\":122.31167487160636,\\\"y\\\":29.962897275268837,\\\"z\\\":-1.3969838619232178e-9}\",\"name\":\"莲恒公寓\",\"townId\":\"25927\",\"_id\":\"66c2a24b1aa3b1f3dab70c099\",\"screenId\":\"66875a9ed036d900248da966\",\"spaceId\":\"66c2a0c51aa3b1f3dab70a6c\",\"__v\":0,\"createTime\":\"2024-08-19 09:39:23\",\"status\":1,\"updateTime\":\"2024-08-28 14:49:18\",\"hoverable\":false,\"clickable\":true}}",
        "item": {
            "icon": "iconmorentubiao",
            "matrixPoint": "{\"x\":122.31167487160636,\"y\":29.962897275268837,\"z\":-1.3969838619232178e-9}",
            "name": "莲恒公寓",
            "townId": "25927",
            "_id": "66c2a24b1aa3b1f3dab70c099",
            "screenId": "66875a9ed036d900248da966",
            "spaceId": "66c2a0c51aa3b1f3dab70a6c",
            "__v": 0,
            "createTime": "2024-08-19 09:39:23",
            "status": 1,
            "updateTime": "2024-08-28 14:49:18",
            "hoverable": false,
            "clickable": true
        },
        "fronsize": 14,
        "hoverable": false,
        "clickable": true,
        "hadWebClick": false,
        "popSize": 30
    }
];

// 存储创建的实体，用于组件卸载时清理
const entities = ref([]);

onMounted(() => {
    // 遍历数据创建实体
    poptest.forEach((popData) => {
        // 数据校验
        if (!validatePopData(popData)) {
            return;
        }
        
        // 解析位置数据
        let poplocation = popData.location || JSON.stringify(defaultPosition);
        if (typeof poplocation === 'string') {
            try {
                poplocation = JSON.parse(poplocation);
                // 兼容不同格式的坐标（支持longitude/latitude或x/y表示经纬度）
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
        let popicon = ICON_CONFIG[popData.item?.icon || 'default'];
        
        // 解析大小配置
        let popWidth = 8;
        let popHeight = 8;
        if (popData.popSize) {
            popHeight = popData.popSize;
            popWidth = popData.popSize;
        }
        
        // 计算Z轴偏移量
        let eyeOffsetZ = popData.eyeOffsetZ || -100;
        
        // 转换经纬度坐标为Cesium笛卡尔坐标
        const poPosition = Cesium.Cartesian3.fromDegrees(
            poplocation.x,
            poplocation.y,
            poplocation.z
        );
        
        // 创建实体
        const entity = new Cesium.Entity({
            name: popData.id,
            position: poPosition,
            category: popData.group,
            item: popData.item,
            label: {
                text: popData.title,
                font: '14pt Source Han Sans CN',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: Cesium.Color.BLACK.withAlpha(0.8),
                showBackground: true,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(15, 0),
                // 距离相关显示控制
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1000000),
                translucencyByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 1.5e6, 0.0)
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
                // 距离相关缩放和透明度
                scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.5, 1.5e6, 0.3),
                translucencyByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 1.5e6, 0.3),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1000000)
            },
            // 实体交互属性
            properties: {
                clickable: popData.clickable || false,
                hoverable: popData.hoverable || false
            }
        });
        
        // 添加实体到Viewer并缓存
        const addedEntity = viewer.entities.add(entity);
        entities.value.push(addedEntity);
        
        // 点击事件（直接打印日志，可扩展为自定义回调）
        if (popData.clickable) {
            viewer.screenSpaceEventHandler.setInputAction((click) => {
                const pickedObject = viewer.scene.pick(click.position);
                if (Cesium.defined(pickedObject) && 
                    pickedObject.id && 
                    pickedObject.id.name === popData.id) {
                    console.log(`点击实体: ${popData.title} (ID: ${popData.id})`);
                    // 可在此处添加自定义事件回调或数据传递
                    const eventData = {
                        id: popData.id,
                        title: popData.title,
                        data: popData.item
                    };
                    // 示例：触发自定义事件（需在父组件中监听）
                    // emit('entity-click', eventData);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
        
        // 悬停事件（图标放大效果）
        if (popData.hoverable) {
            let highlightedEntity = null;
            
            viewer.screenSpaceEventHandler.setInputAction((movement) => {
                // 恢复之前高亮的实体
                if (highlightedEntity) {
                    highlightedEntity.billboard.scale = 1.0;
                    highlightedEntity = null;
                }
                
                // 高亮当前实体
                const pickedObject = viewer.scene.pick(movement.endPosition);
                if (Cesium.defined(pickedObject) && 
                    pickedObject.id && 
                    pickedObject.id.name === popData.id) {
                    pickedObject.id.billboard.scale = 1.5;
                    highlightedEntity = pickedObject.id;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    });
});

// 组件卸载时清理资源
onUnmounted(() => {
    entities.value.forEach(entity => {
        viewer.entities.remove(entity);
    });
    // 移除所有事件监听
    viewer.screenSpaceEventHandler.removeAllEvents();
});
</script>

<template>
</template>

<style scoped>
</style>