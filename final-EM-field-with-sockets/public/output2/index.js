import * as THREE from 'three';
import { mapLinear, randFloat, randFloatSpread } from 'three/src/math/MathUtils';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const params = {
    exposure: 0.6,
    bloomStrength: 1,
    bloomThreshold: 0.2,
    bloomRadius: 0.1
};
let bloomPass, composer;

let scene, camera, controls, renderer;
let cubeDim = 10;


let lines = [];

let protons = [];
let electrons = [];

let socket = io('/output2')

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 15;




    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');
    document.body.appendChild(canvas);

    controls = new OrbitControls(camera, renderer.domElement);

    let cubeGeo = new THREE.BoxGeometry(cubeDim, cubeDim, cubeDim);
    let cube = new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({
        wireframe: true,
        color: "yellow"
    }));
    //scene.add(cube);

    //arrows
    for (let x = 0; x < cubeDim + 1; x++) {
        for (let y = 0; y < cubeDim + 1; y++) {
            for (let z = 0; z < cubeDim + 1; z++) {
                //start by assigning a random direction
                let dir = new THREE.Vector3();

                dir.set(randFloatSpread(2), randFloatSpread(2), randFloatSpread(2)).normalize();

                let origin = new THREE.Vector3(x - cubeDim / 2, y - cubeDim / 2, z - cubeDim / 2);

                let end = new THREE.Vector3().addVectors(origin, dir);

                let points = [];
                points.push(origin);
                points.push(end);

                let geo = new THREE.BufferGeometry().setFromPoints(points);
                let mat = new THREE.LineBasicMaterial({
                    color: 0x555555,
                })
                let line = new THREE.Line(geo, mat);
                line.userData.origin = origin;
                line.userData.end = end;
                lines.push(line);
                scene.add(line);


            }
        }
    }

    arrangeLines();

    //post processing
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms['damp'] = { value: 0.7 }
    composer.addPass(afterimagePass);

    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;
    composer.addPass(bloomPass);


    establishWebSocketConnection();

}

function addProton() {
    let proton = new Proton(scene);
    protons.push(proton);
}

function addElectron() {
    let electron = new Electron(scene);
    electrons.push(electron);
}

let direction = new THREE.Vector3();
let normal = new THREE.Vector3();
let forceVector = new THREE.Vector3();
let directions = [];
let result = new THREE.Vector3();

function arrangeLines() {

    for (let line of lines) {
        directions = [];

        if (protons.length > 0) {

            for (let p of protons) {
                let charge = p.mesh;
                direction.subVectors(line.userData.origin, charge.position);
                normal.copy(direction).normalize();
                directions.push({
                    dir: normal.clone(),
                    force: 1 / Math.pow(forceVector.subVectors(line.userData.origin, charge.position).length(), 2)
                });
            }

        }

        if (electrons.length > 0) {
            for (let e of electrons) {
                let charge = e.mesh;
                direction.subVectors(line.userData.origin, charge.position);
                normal.copy(direction).normalize();
                directions.push({
                    dir: normal.negate().clone(),
                    force: 1 / Math.pow(forceVector.subVectors(line.userData.origin, charge.position).length(), 2)
                });
            }
        }

        result.set(0, 0, 0);

        for (let direction of directions) {
            result.addScaledVector(direction.dir, direction.force);
        }


        const positions = line.geometry.attributes.position.array;

        let origin = line.userData.origin;
        let end = new THREE.Vector3().addVectors(origin, result.normalize());

        positions[0] = origin.x;
        positions[1] = origin.y;
        positions[2] = origin.z;
        positions[3] = end.x;
        positions[4] = end.y;
        positions[5] = end.z;

        line.geometry.attributes.position.needsUpdate = true;
    }
}


function render() {
    requestAnimationFrame(render);
    composer.render();
    //renderer.render(scene, camera);

    if (protons.length > 0) {

        for (let proton of protons) {
            proton.attract(electrons);
            proton.repel(protons);
            proton.update();
        }

    }
    if (electrons.length > 0) {

        for (let i = 0; i < electrons.length; i++) {

            electrons[i].repel(electrons);
            electrons[i].attract(protons);

            if (electrons[i].finished) {
                console.log('true!')
                scene.remove(electrons[i].mesh);

                electrons[i].mesh.children = [];

                electrons[i].mesh.geometry.dispose();
                electrons[i].mesh.material.dispose();
                electrons[i].mesh.geometry = undefined;
                electrons[i].mesh.material = undefined;
                electrons[i].mesh = undefined;
                electrons[i] = undefined;

                electrons.splice(i, 1);
            } else {
                electrons[i].update();
            }


        }
    }


    arrangeLines();

}


init();
render();

class Proton {
    constructor(scene) {
        let chargeGeo = new THREE.SphereGeometry(0.1, 16, 12);
        let chargeMat = new THREE.MeshBasicMaterial({
            color: 0xeeeeee,
        });
        this.mesh = new THREE.Mesh(chargeGeo, chargeMat);
        this.mesh.userData.charge = 1;

        this.pos = new THREE.Vector3(randFloatSpread(cubeDim), randFloatSpread(cubeDim), randFloatSpread(cubeDim));
        this.vel = new THREE.Vector3();
        this.acc = new THREE.Vector3();
        this.totalF = new THREE.Vector3();

        this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);

        scene.add(this.mesh);


    }

    update() {
        //this.totalF.addScalar(0.1);
        this.acc.add(this.totalF);

        this.vel.add(this.acc);
        this.vel.clampLength(0, 0.05);
        this.pos.add(this.vel);

        this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);


        this.totalF.set(0, 0, 0);
        this.acc.set(0, 0, 0);

    }

    attract(targets) {
        if (targets.length > 0) {
            //calculate all the electrons attract force around it
            let result = new THREE.Vector3(0, 0, 0);

            for (let target of targets) {
                let distanceVector = new THREE.Vector3();

                let direction = new THREE.Vector3();
                let magnitude = 0;

                distanceVector.subVectors(target.pos, this.pos);

                direction.copy(distanceVector).normalize();
                magnitude = 1 / Math.pow(distanceVector.length(), 2);

                result.addScaledVector(direction, magnitude);
                result.clampLength(0, 0.01);

            }
            this.applyForce(result);

        }
    }

    repel(targets) {
        //calculate all the protons arorund it
        if (targets.length > 0) {


            let result = new THREE.Vector3(0, 0, 0);

            for (let target of targets) {
                if (target !== this) {

                    let distanceVector = new THREE.Vector3();

                    let direction = new THREE.Vector3();
                    let magnitude = 0;

                    distanceVector.subVectors(target.pos, this.pos);
                    //the same as attracting but opposite direction;
                    direction.copy(distanceVector).negate().normalize();
                    magnitude = 1 / Math.pow(distanceVector.length(), 2);

                    result.addScaledVector(direction, magnitude);
                    result.clampLength(0, 0.01);
                }
            }

            this.applyForce(result);
        }
    }

    applyForce(force) {

        this.totalF.add(force);

    }


}

class Electron extends Proton {

    constructor(scene) {

        super(scene);

        this.mesh.material.color.set(new THREE.Color(0x3333ff));
        this.mesh.material.needsUpdate = true;

        this.mesh.userData.charge = -1;
        this.finished = false;

    }

    attract(targets) {
        //calculate all the electrons attract force around it
        let result = new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < targets.length; i++) {
            let distanceVector = new THREE.Vector3();

            let direction = new THREE.Vector3();
            let magnitude = 0;

            distanceVector.subVectors(targets[i].pos, this.pos);
            if (distanceVector.length() < 1) {
                this.neutralize(targets, i);
                break;
            } else {
                direction.copy(distanceVector).normalize();
                magnitude = 1 / Math.pow(distanceVector.length(), 2);

                result.addScaledVector(direction, magnitude);
                result.clampLength(0, 0.01);
            }
        }
        this.applyForce(result);
    }

    neutralize(protons, index) {

        //turn into something cool then disappear
        let proton = protons[index];
        scene.remove(proton.mesh);

        proton.mesh.children = [];
        proton.mesh.geometry.dispose();
        proton.mesh.material.dispose();
        proton.mesh.geometry = undefined;
        proton.mesh.material = undefined;

        proton.mesh = undefined;
        proton = undefined;
        protons.splice(index, 1);

        this.finished = true;

    }

}

function establishWebSocketConnection() {

    socket.on('connect', function () {
        console.log('connected')
    });

    socket.on('atom', function (data) {
        console.log(data)
        if (data.charge == 1) {
            console.log('input is a proton')
            addProton();
        } else if (data.charge == -1) {
            console.log('input is an electron');
            addElectron();
        }
    })

}