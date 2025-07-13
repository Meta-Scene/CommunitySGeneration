<script setup>
import { inject } from 'vue';
import eventEmitter from "../utils/EventEmitter.js"
import * as Cesium from 'cesium'; 
const viewer = inject('viewer');
const camera=viewer.camera
eventEmitter.subscribe('FlyToMessage', (data) => {
    handleFlyTo(data)
});
eventEmitter.subscribe('cameraPosMessage', () => {
    GetcameraINfo()
});
function handleFlyTo(data) {
    
    const location = data.location;
    const rotation = data.rotation;
    const time = data.time;

    const targetPosition = Cesium.Cartesian3.fromDegrees(
        Number(location.x),
        Number(location.y),
        Number(location.z)
    );
    const targetHeading = rotation.Z; // 绕 Z 轴旋转 (heading)
    const targetPitch = rotation.X; // 绕 X 轴旋转 (pitch)
    const targetRoll = rotation.Y; // 绕 Y 轴旋转 (roll)
    camera.flyTo({
        destination: targetPosition,
        duration: time,
        orientation: {
            heading: targetHeading,
            pitch: targetPitch,
            roll: targetRoll,
        },
    });
}

function GetcameraINfo() {
 // 获取相机位置（世界坐标）
// 获取 相机姿态信息
    var head = viewer.scene.camera.heading
    var pitch = viewer.scene.camera.pitch
    var roll = viewer.scene.camera.roll
    var info = {'head': head, 'pitch': pitch, 'roll': roll};
    var position = viewer.scene.camera.positionCartographic 
    var longitude = Cesium.Math.toDegrees(position.longitude).toFixed(6)
    var latitude = Cesium.Math.toDegrees(position.latitude).toFixed(6)
    var height = position.height
    const message = {
        type: "info",
        payload: {
            location: {
                x: longitude,
                y: latitude,
                z: height
            },
            source: "cesiumMap",
            rotation: {
                X: info.pitch,
                Y: info.roll,
                Z: info.head
            },
        },
    };
    console.log("将向父类发送：", JSON.stringify(message));
    window.parent.postMessage(JSON.stringify(message), "*");
}

</script>
<template>
</template>
<style scoped></style>


