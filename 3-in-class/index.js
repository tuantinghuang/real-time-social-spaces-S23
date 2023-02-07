//import modules
import * as THREE from 'three'; // * as in everything
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import openSimplexNoise from 'https://cdn.skypack.dev/open-simplex-noise';
import { Sky } from 'three/addons/objects/Sky.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let canvas, renderer, scene, camera, cam_r;


//boiler plate set up
function init() {
    //set up scene
    canvas = document.querySelector('canvas.webgl');

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    cam_r = 3;
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000000);
    camera.position.set(0, 5, cam_r);
    camera.lookAt(0, 0, 0);
}

init();


let gridHelper = new THREE.GridHelper(25, 25);
scene.add(gridHelper);

let controls = new OrbitControls(camera, renderer.domElement);


//make ball
let geo = new THREE.SphereGeometry(1.5, 64, 64);
geo.positionData = [];
let v3 = new THREE.Vector3();
for (let i = 0; i < geo.attributes.position.count; i++) {
    v3.fromBufferAttribute(geo.attributes.position, i);
    geo.positionData.push(v3.clone());
}

//load hdr
let hdrEquirect = new RGBELoader().load("assets/syferfontein_1d_clear_puresky_4k.hdr",
    () => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping
    });

let mat = new THREE.MeshPhysicalMaterial({
    roughness: 0,
    transmission: 1,
    thickness: 0.8,
    envMap: hdrEquirect,
    envMapIntensity: 1,

})
let ball = new THREE.Mesh(geo, mat);
//scene.add(ball);
let ball2 = new THREE.Mesh(geo, mat);
ball2.position.set(0, 5, 0);

let parent = new THREE.Group();
scene.add(parent);
parent.add(ball);
parent.add(ball2);
console.log(parent)

// Add Sky
// code snippets from https://threejs.org/examples/?q=sky#webgl_shaders_sky
let sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

let sun = new THREE.Vector3();

//sun settings 
let effectController = {
    turbidity: 15,
    rayleigh: 2,
    mieCoefficient: 0.03,
    mieDirectionalG: 0.98,
    elevation: 90,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
};

let uniforms = sky.material.uniforms;
uniforms['turbidity'].value = effectController.turbidity;
uniforms['rayleigh'].value = effectController.rayleigh;
uniforms['mieCoefficient'].value = effectController.mieCoefficient;
uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
const theta = THREE.MathUtils.degToRad(effectController.azimuth);

sun.setFromSphericalCoords(1, phi, theta);

uniforms['sunPosition'].value.copy(sun);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.2;




let noise = openSimplexNoise.makeNoise4D(Date.now());
let clock = new THREE.Clock();



function render() {


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
    requestAnimationFrame(render);
}

render();
