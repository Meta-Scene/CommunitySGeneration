<script setup>
import { inject ,onMounted} from 'vue';
import eventEmitter from "../utils/EventEmitter.js"
import * as Cesium from 'cesium'; 
const viewer = inject('viewer');
const camera=viewer.camera
eventEmitter.subscribe('createPop', (data) => {
    createPop(data)
});
eventEmitter.subscribe('clearPopByType', (data) => {
    clearPopByType(data)
});
function createPop(popDatArry) {
    // 验证数据有效性
    if (!popDatArry) {
        console.log("未收到气泡数据,将全部使用默认数据");
    }
    popDatArry.map((popData) => {

        let poplocation = "{\"x\":122.31167487160636,\"y\":29.962897275268837,\"z\":-1.3969838619232178e-9}";
        if (popData.location) {
            poplocation = popData.location;
        } else {
            console.log("未收到气泡位置,将使用默认数据->{'x':122.31167487160636,'y':29.962897275268837,'z':-1.3969838619232178e-9}");
        }
        if (typeof (poplocation) == 'string') {
            poplocation = JSON.parse(poplocation)
        }
        let popicon = "images/markers/marker2.png"
        if (popData.icon) {
            popicon = popData.icon
        } else {
            console.log("未收到气泡图标数据,将使用默认数据");
        }

        let popWidth = 8
        let popHeight = 8
        if (popData.popSize) {
            popHeight = popData.popSize
            popWidth = popData.popSize
        } else {
            console.log("未收到气泡大小数据,将使用默认数据");
        }

        // 可选地从数据中提取Z轴偏移量，如果没有提供则使用默认值
        //const eyeOffsetZ = data.eyeOffsetZ || -100;
        let eyeOffsetZ = -100;
        // 转换经纬度坐标为Cesium的笛卡尔坐标
        const poPosition = Cesium.Cartesian3.fromDegrees(
            poplocation.x,
            poplocation.y,
            poplocation.z
        );
        if (!popData.id) {
            console.error("popID缺失")
        }
        let enpopname = "房子"
        if (popData.popName) {
            enpopname = popData.popName
        }
        console.log("-收到的气泡名字为-->", popData.popName)
        const entity = new Cesium.Entity({
            name: popData.id,
            position: poPosition,
            category: popData.group,
            firstLevel: popData.firstLevel,
            item: popData.item,
            secondLevel: popData.secondLevel,
            label: {
                text: popData.popName,
                font: '14pt Source Han Sans CN',    //字体样式
                fillColor: Cesium.Color.WHITE,        //字体颜色
                backgroundColor: Cesium.Color.BLACK,    //背景颜色
                showBackground: true,                //是否显示背景颜色
                style: Cesium.LabelStyle.FILL,        //label样式
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,//垂直位置
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,//水平位置
                pixelOffset: new Cesium.Cartesian2(0, -10)            //偏移
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
                // 添加scaleByDistance以控制不同距离下的缩放效果
                scaleByDistance: new Cesium.NearFarScalar(1.0, 0.5, 1000000.0, 0.1)
            },
        });
        // 将Entity添加到viewer中
        viewer.entities.add(entity);
    })

}

function clearPopByType(data) {
    data.types.map((popType) => {
        viewer.entities.values.forEach(function (entity) {
            if (entity.firstLevel === popType) {
                entity.show = false
            }
        })
    })
}

onMounted(() => {
var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(function (movement) {
    var pick = viewer.scene.pick(movement.position);
    if (Cesium.defined(pick)) {
        // console.log("---->",pick.id)
        let chanedc = {x: 1, y: 1, z: 1};
        if (pick) {
            if (pick.id) {
                if (pick.id.position) {
                    if (pick.id.position._value) {
                        chanedc = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, pick.id.position._value);
                    }
                }
            }
        }
        if (pick) {
            if (pick.id) {
                const message = {
                    type: "popClick",
                    payload: {
                        source: "cesiumMap",
                        id: pick.id.name,
                        firstLevel: pick.id.firstLevel,
                        secondLevel: pick.id.secondLevel,
                        item: {},
                        senceVector2D: chanedc,
                    },
                };
                // 将消息发送给父类
                console.log("将向父类发送：", JSON.stringify(message));
                window.parent.postMessage(JSON.stringify(message), "*");
            }
        }
    }

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
});
</script>
<template>
</template>
<style scoped></style>