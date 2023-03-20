import * as THREE from 'three';
//import Portal from './portal'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let commentData = [
    "Masterful Storytelling With Striking, Memorable Characters",
    "This book is so utterly pretentiousness and trying so hard to be woke that I should have given up on it instead of seeing it to the end. I would have if the beginning hadn’t been so beautifully done. There’s a line in the book about a video game sequel being awful because it was farmed out to Indian programmers who had no interest in the game and that’s how this book feels after the incredible start. ",
    "Going back to sleep - will review soon… I Loved loved loved it!!!!!! Absolutely one my year’s favorite!!!!",
    "Obviously, I'm in the minority here, but I wasn't particularly enthralled.",
    "this book made my heart ache."
]

const params = {
    exposure: 0.01,
    bloomStrength: 0.6,
    bloomThreshold: 0.2,
    bloomRadius: 0.1
};
let bloomPass, composer;

let scene, renderer, camera, controls;
let terrain;
let texture;
let portal;

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


    texture = new THREE.TextureLoader().load("assets/render.png", function (data) {
        makeTerrain(data);

    });

    scene.fog = new THREE.Fog(0x000000, 150, 250);

    let light = new THREE.AmbientLight(0xffffff, 0.5);
    light.position.set(0, 100, 10);
    scene.add(light);

    portal = new Portal(0, 5, 0);
    portal.centerFrame();
    scene.add(portal.circlemesh);
    scene.add(portal.light1);
    scene.add(portal.framemesh);
    portal.createParticles(10);

    let cover_texture = new THREE.TextureLoader().load("assets/tomorrow-tomorrow-tomorrow.jpeg", function (data) {
        portal.drawPlane(data);
    });



    //post processing
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

let time = 0;
function render() {
    requestAnimationFrame(render);

    portal.movePlane();
    portal.moveParticles();

    checkDistance(camera, portal);

    composer.render();
    //renderer.render(scene, camera);
    time += 1;
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


function checkDistance(camera, portal) {
    let d = camera.position.distanceTo(portal.center);
    //console.log(d);
    if (d < 15) {
        displayInfo(true);
    } else {
        displayInfo(false);
    }

}

let prev_on = false;

function displayInfo(on) {

    if (on != prev_on) {
        if (on) {
            let container2 = document.getElementById("container2");
            let div = document.createElement("div");
            div.className = "title";
            div.style.display = "block";
            div.appendChild(document.createTextNode("Tomorrow, and tomorrow, and tomorrow"));
            div.appendChild(document.createElement("br"))
            div.appendChild(document.createElement("br"))
            div.appendChild(document.createTextNode("by Gabrielle Zevin"));
            div.appendChild(document.createElement("br"));
            div.appendChild(document.createElement("br"));
            let img = document.createElement("img");
            img.src = "assets/tomorrow-tomorrow-tomorrow.jpeg";

            div.appendChild(img);
            container2.appendChild(div);


            let container = document.getElementById("container");
            for (let c of commentData) {

                let div = document.createElement("div");
                div.className = "comment";
                div.style.display = "block";
                let txt = document.createTextNode(c);
                div.appendChild(txt);
                container.appendChild(div);
            }
        }
        if (!on) {
            document.getElementById("container").innerHTML = "";
            document.getElementById("container2").innerHTML = "";
        }
    }

    prev_on = on;

}



//----------------------------------- PORTAL ------------------------------------------------



let circlegeo = new THREE.CircleGeometry(4, 32, 32);
let circlemat = new THREE.MeshLambertMaterial({
    color: 0xccccff,
    side: THREE.DoubleSide,
})

let framemat = new THREE.MeshLambertMaterial({
    color: 0xccccff,
    side: THREE.DoubleSide,
})

let planegeo = new THREE.PlaneGeometry(4, 10, 5, 5);


class Portal {
    constructor(x, y, z) {
        this.center = new THREE.Vector3(x, y, z);
        this.circlemesh = new THREE.Mesh(circlegeo, circlemat);

        this.framegeo;
        this.framemesh;

        //cover image
        this.meshes = [];

        //particle
        this.particles = [];
        this.particles_ypos = [];
        this.curves = [];


    }
    createFrame(sizeX, sizeY, width) {

        let shape = new THREE.Shape([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(sizeX, 0),
            new THREE.Vector2(sizeX, sizeY),
            new THREE.Vector2(0, sizeY)
        ]);

        let hole = new THREE.Path([
            new THREE.Vector2(width, width),
            new THREE.Vector2(width, sizeY - width),
            new THREE.Vector2(sizeX - width, sizeY - width),
            new THREE.Vector2(sizeX - width, width)
        ]);

        shape.holes.push(hole);
        return shape
    }

    centerFrame() {
        const extrudeSettings = { depth: 0.2, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 0.1, bevelThickness: 0.1 };

        this.framegeo = new THREE.ExtrudeGeometry(this.createFrame(4.2, 11, 0.2), extrudeSettings);
        this.framemesh = new THREE.Mesh(this.framegeo, framemat);

        this.circlemesh.position.set(this.center.x, this.center.y - planegeo.parameters.height / 2, this.center.z);
        this.circlemesh.rotateX(-Math.PI / 2);
        this.framemesh.position.set(this.center.x - 2.1, this.center.y - 5.5, this.center.z + 0.1);

    }

    drawPlane(texture) {
        let xgrid = 30;
        let ygrid = 20;
        let mesh;
        let materials = [];
        let count = 0;

        let i, j, ox, oy, geo;
        const ux = 1 / xgrid;
        const uy = 1 / ygrid;

        const xsize = planegeo.parameters.width / xgrid;
        const ysize = planegeo.parameters.height / ygrid * 2;

        const param = { color: 0xffffff, map: texture, sheen: 5, side: THREE.DoubleSide };
        count = 0;

        for (i = 0; i < xgrid; i++) {
            for (j = 0; j < ygrid; j++) {
                ox = i;
                oy = j;
                geo = new THREE.PlaneGeometry(xsize, ysize);
                this.change_uvs(geo, ux, uy, ox, oy);
                materials[count] = new THREE.MeshPhysicalMaterial(param);

                mesh = new THREE.Mesh(geo, materials[count]);
                mesh.position.x = this.center.x + (i - xgrid / 2) * xsize;
                mesh.position.y = this.center.y + (j - ygrid / 2) * ysize;
                mesh.position.z = this.center.z + 0.1;

                mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

                scene.add(mesh);
                this.meshes[count] = mesh;

                count++;

            }
        }
    }

    change_uvs(geometry, unitx, unity, offsetx, offsety) {
        const uvs = geometry.attributes.uv.array;
        for (let i = 0; i < uvs.length; i += 2) {
            uvs[i] = (uvs[i] + offsetx) * unitx;
            uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
        }
    }

    movePlane() {

        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].position.y -= Math.random() * 0.1;
            if (this.meshes[i].position.y <= this.center.y - planegeo.parameters.height / 2) {
                this.meshes[i].position.y = this.center.y + planegeo.parameters.height / 2;
            }
        }
    }

    createParticles(num) {
        let geo = new THREE.SphereGeometry(0.1, 16, 8);

        for (let i = 0; i < num; i++) {
            this.particles[i] = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xccccff }));
            this.particles[i].position.x = this.center.x + (Math.round(Math.random()) ? 1 : -1) * Math.random() * 4;
            this.particles_ypos[i] = this.center.y - Math.random();
            this.particles[i].position.z = this.center.z + (Math.round(Math.random()) ? 1 : -1) * Math.random() * 4;

            scene.add(this.particles[i]);

            let x = (this.particles[i].position.x - this.center.x) / 2;
            let z = (this.particles[i].position.z - this.center.z) / 2;
            //create curve lines
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(x, 0, z),
                new THREE.Vector3(this.center.x + x, this.center.y, this.center.z + z),
                new THREE.Vector3(this.particles[i].position.x, this.particles_ypos[i], this.particles[i].position.z)
            );

            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xccccff });
            // Create the final object to add to the scene
            this.curves[i] = new THREE.Line(geometry, material);
            this.curves[i].curve = curve;

            scene.add(this.curves[i])
        }
    }
    moveParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].position.y = this.particles_ypos[i] + Math.sin(time * 0.01 + i) * 0.25;

            //update curve

            let curveLine = this.curves[i];
            //update y pos of the 3rd vertex in the curve path
            curveLine.curve.v2.y = this.particles[i].position.y;

            curveLine.geometry.setFromPoints(curveLine.curve.getPoints(50));

            // Let's three.js know that vertices are changed
            curveLine.geometry.verticesNeedUpdate = true;
        }


    }


}

init();
render();