import * as THREE from 'three'; // * as in everything
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'https://threejs.org/examples/jsm/loaders/RGBELoader.js';

import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';

import openSimplexNoise from 'https://cdn.skypack.dev/open-simplex-noise';


let canvas = document.querySelector('canvas.webgl')
let renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
let cam_r = 3;
camera.position.z = cam_r;
camera.lookAt(0, 0, 0);

//make ball

//load hdr
let hdrEquirect = new RGBELoader().load("assets/syferfontein_1d_clear_puresky_4k.hdr",
    () => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping
    })


let geo = new THREE.SphereGeometry(1.5, 64, 64);
geo.positionData = [];
let v3 = new THREE.Vector3();
for (let i = 0; i < geo.attributes.position.count; i++) {
    v3.fromBufferAttribute(geo.attributes.position, i);
    geo.positionData.push(v3.clone());
}

let mat = new THREE.MeshPhysicalMaterial({
    roughness: 0,
    transmission: 1,
    thickness: 0.8,
    envMap: hdrEquirect,
    envMapIntensity: 1,

})
let ball = new THREE.Mesh(geo, mat);

scene.add(ball);

//load gltf (morph)
// let mesh;

// let loader = new GLTFLoader();
// loader.load('assets/glTF/AnimatedMorphSphere.gltf', function (gltf) {

//     mesh = gltf.scene.getObjectByName('AnimatedMorphSphere');
//     mesh.rotation.z = Math.PI / 2;
//     //scene.add(mesh);
//     //console.log(mesh);
//     mesh.material.dispose();
//     mesh.material = mat;

// });


let light = new THREE.HemisphereLight(0xaaaaff, 0xddddff, 100);
//scene.add(light);


let scrollY = window.scrollY;

function animate() {
    requestAnimationFrame(animate);
    render();
}


let noise = openSimplexNoise.makeNoise4D(Date.now());
let clock = new THREE.Clock();

function render() {

    if (scrollY) {
        ball.rotation.x = scrollY / 100;

        let r = THREE.MathUtils.degToRad(scrollY);
        camera.position.z = cam_r * Math.sin(r);
        camera.position.y = cam_r * Math.cos(r);
        camera.lookAt(0, 0, 0);
    };

    let t = clock.getElapsedTime() / 2.;

    if (ball) {
        geo.positionData.forEach((p, idx) => {
            let setNoise = noise(p.x, p.y, p.z, t * 1.05);
            v3.copy(p).addScaledVector(p, setNoise / 10);
            geo.attributes.position.setXYZ(idx, v3.x, v3.y, v3.z);
        })
        geo.computeVertexNormals();
        geo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
}

animate();



window.addEventListener('scroll', () => {
    scrollY = window.scrollY
});