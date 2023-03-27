import * as THREE from 'three';
import { Portal } from './portal.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';


const params = {
    exposure: 0.1,
    bloomStrength: 0.6,
    bloomThreshold: 0.2,
    bloomRadius: 0.1
};
let bloomPass, composer;

let scene, renderer, camera, controls;
let terrain;
let texture;
let portals = [];
let time = 0;
let data;

async function getData() {
    const requestURL = "./data.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    data = await response.json();

    if (data.length > 0) {

        for (let i = 0; i < data.length; i++) {
            let p = new Portal(i * 20 - data.length * 20 / 2, 5, i * 20 - data.length * 20 / 2, scene, i);
            let particle_num = data[i].comments.length;
            p.centerFrame();
            p.createParticles(particle_num);

            let cover = new THREE.TextureLoader().load(data[i].img, function (data) {
                p.drawPlane(data);
            });

            portals.push(p);
        }
    }
}

function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');
    document.body.appendChild(canvas);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(50, 30, 60);
    controls = new OrbitControls(camera, renderer.domElement);

    //evironment
    texture = new THREE.TextureLoader().load("assets/render.png", function (data) {
        makeTerrain(data);

    });

    scene.fog = new THREE.Fog(0x000000, 150, 250);

    let light = new THREE.AmbientLight(0xffffff, 0.5);
    light.position.set(0, 100, 10);
    scene.add(light);

}

function postProcessing() {

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    composer.addPass(bloomPass);
}



function makeTerrain(texture) {
    let planegeo = new THREE.PlaneGeometry(400, 400, 200, 200);
    let planemat = new THREE.MeshStandardMaterial({ color: 0xcccccc, wireframe: true, displacementMap: texture, displacementScale: 20 });
    terrain = new THREE.Mesh(planegeo, planemat);
    terrain.rotateX(-Math.PI / 2);
    scene.add(terrain);
}


function render() {
    requestAnimationFrame(render);

    if (portals && portals.length > 0) {
        for (let p of portals) {
            p.movePlane();
            p.moveParticles(time);
            p.checkDistance(camera);

            //after checking distance
            if (p.displayInfo != p.displayInfo_prev) {
                if (p.displayInfo) {
                    populate(p.id);
                } else {
                    clearDiv();
                }
                p.displayInfo_prev = p.displayInfo
            }

        }


        composer.render();
        //renderer.render(scene, camera);
        time += 1;
    }
}

//event listener - camera control
window.addEventListener('keydown', moveCamera);

function moveCamera(e) {
    switch (e.key) {
        case 'ArrowLeft':
            camera.position.x--;

            camera.updateProjectionMatrix();
            break;

        case 'ArrowUp':
            camera.position.z--;
            camera.updateProjectionMatrix();
            break;

        case 'ArrowRight':
            camera.position.x++;
            camera.updateProjectionMatrix();
            break;

        case 'ArrowDown':
            camera.position.z++;
            camera.updateProjectionMatrix();
            break;
    }
}


//----------------------------------------------HTML info display ------------------------------------------


async function populate(id) {
    const requestURL = "./data.json";
    const request = new Request(requestURL);
    const response = await fetch(request);
    const data = await response.json();

    populateInfo(data[id]);
    populateComment(data[id]);
}

function clearDiv() {
    let comment = document.querySelector("#commentContainer");
    comment.innerHTML = "";
    comment.style.display = "none";
    let info = document.querySelector("#infoContainer");
    info.innerHTML = "";
    info.style.display = "none";
}


function populateInfo(data) {
    if (data) {
        let container = document.querySelector("#infoContainer");
        container.style.display = "block";

        let title = document.createElement("h1");
        let author = document.createElement("h2");
        let isbn = document.createElement("p");
        let status = document.createElement('p');

        title.textContent = data.name;
        author.textContent = data.author;
        isbn.textContent = data.isbn;
        status.textContent = data.status;


        container.appendChild(title);
        container.appendChild(author);
        container.appendChild(isbn);
        container.appendChild(status);
    }
}

function populateComment(data) {
    if (data) {

        let container = document.querySelector("#commentContainer");
        let header = document.createElement("h2");
        header.textContent = "activity logs";
        container.appendChild(header);

        container.style.display = "block";
        for (let i = 0; i < data.comments.length; i++) {

            let p = document.createElement("p");
            p.className = "comment"
            p.textContent = data.comments[i];
            container.appendChild(p);


        }

    }
}

window.addEventListener("mousemove", passCursorToCss);

function passCursorToCss(e) {

    let x = e.clientX;
    let y = e.clientY;
    document.documentElement.style.setProperty('--x', x / innerWidth);
    document.documentElement.style.setProperty('--y', y / innerHeight);

}



init();
getData();
postProcessing();
render();
