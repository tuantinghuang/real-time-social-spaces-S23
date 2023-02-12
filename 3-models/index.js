//import modules
import * as THREE from 'three'; // * as in everything
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, scene, camera, controls;
let light, dir_light, video, texture;
let floor, wall;
let mixer;


function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(0, 200, 400);
    controls = new OrbitControls(camera, renderer.domElement);

    light = new THREE.AmbientLight(0.2)
    scene.add(light);

    //load video
    video = document.getElementById('video');
    texture = new THREE.VideoTexture(video);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    console.log(video);

    //model
    let loader = new GLTFLoader();
    loader.load('assets/scene.gltf', function (gltf) {
        let model = gltf.scene;

        scene.add(model);
        console.log(model);
        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }

        });
        model.rotateY(Math.PI / 2);
        model.position.set(0, 10, 0);

        mixer = new THREE.AnimationMixer(model);
        var action = mixer.clipAction(gltf.animations[0]);
        action.play();


    },
        // called while loading is progressing
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );

    floor = new THREE.Mesh(new THREE.BoxGeometry(200, 10, 200), new THREE.MeshPhongMaterial({ color: 0xffffff }));
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    //scene.add(floor);

    let wallGeo = new THREE.BoxGeometry(1600, 1, 1200);
    let wallMat = new THREE.MeshPhongMaterial({

        map: texture,
    });
    wall = new THREE.Mesh(wallGeo, wallMat);
    wall.receiveShadow = true;
    scene.add(wall);
    //wall.rotateX(Math.PI / 2);
    wall.position.set(0, 0, -100);


    //add a directional light;
    dir_light = new THREE.DirectionalLight(0xffffff, 1);
    dir_light.position.set(0, 100, 0);
    dir_light.lookAt(0, 10, 0);
    dir_light.castShadow = true;
    dir_light.shadow.camera.near = 0.1;
    dir_light.shadow.camera.far = 200;
    scene.add(dir_light);


}


init();


let clock = new THREE.Clock();

function render() {
    requestAnimationFrame(render);
    let delta = clock.getDelta();

    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    console.log(camera.position)
}

render();
