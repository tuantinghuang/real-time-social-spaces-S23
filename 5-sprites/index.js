import * as THREE from 'three';
import { Float32BufferAttribute } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, control;
let geometry;
let towardsCenter = true;

function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000,);
    camera.position.set(0, 700, 0)

    control = new OrbitControls(camera, renderer.domElement);
    control.target.set(0, 0, 0);
    control.listenToKeyEvents(window);
    control.update();

    let controls = new function () {
        this.size = 10;
        this.transparent = true;
        this.opacity = 0.6;
        this.color = 0xffffff;
        this.sizeAttenuation = true;

        this.redraw = function () {
            let toRemove = [];
            scene.children.forEach(function (child) {
                if (child instanceof THREE.Points) {
                    toRemove.push(child);
                }
            });

            toRemove.forEach(function (child) {
                scene.remove(child);
            });

            createPointInstances(controls.size, controls.transparent, controls.opacity, controls.sizeAttenuation, controls.color);
        };
    };

    geometry = new THREE.SphereGeometry(4, 128, 32);
    geometry.positionData = [];
    let v3 = new THREE.Vector3();
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        v3.fromBufferAttribute(geometry.attributes.position, i);
        geometry.positionData.push(v3.clone());
    }

    controls.redraw();


}

function render() {

    scene.children.forEach(function (child) {
        if (child instanceof THREE.Points) {

            let vertices = child.geometry.attributes.position.array;


            for (var i = 0; i <= vertices.length; i += 3) {

                let pos = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
                let org = new THREE.Vector3(0, 0, 0);

                let v = new THREE.Vector3();
                v.copy(geometry.positionData[i]);

                let force = new THREE.Vector3();
                let dist = org.distanceTo(v);

                force = org.sub(v);


                if (towardsCenter) {
                    force.setLength(dist * Math.random() * 0.5);
                } else {
                    force.negate();
                    force.setLength(dist * Math.random() * 0.5);
                }


                let speed = new THREE.Vector3(0, 0, 0);
                speed.add(force);

                pos.add(speed);
                vertices[i] = pos.x + (Math.round(Math.random()) ? 1 : -1) * 0.05;
                vertices[i + 1] = pos.y;
                vertices[i + 2] = pos.z + (Math.round(Math.random()) ? 1 : -1) * 0.05;


            }

            child.geometry.attributes.position.needsUpdate = true;
            child.geometry.computeVertexNormals();
        }
    })

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}


init();
render();

window.addEventListener('mousedown', addForce);
window.addEventListener('mouseup', changeForce);

function addForce() {
    towardsCenter = true;
    scene.children.forEach(function (child) {
        if (child instanceof THREE.Points) {
            child.material.color.setHex(0xaaffff);
        }
    });
}
function changeForce() {
    towardsCenter = false;
    scene.children.forEach(function (child) {
        if (child instanceof THREE.Points) {
            child.material.color.setHex(0xffffff);
        }
    });
}


function createPointInstances(size, transparent, opacity, sizeAttenuation, color) {

    let loader = new THREE.TextureLoader();

    let texture1 = loader.load('assets/particle_textures-01.png');
    let texture2 = loader.load('assets/particle_textures-04.png');
    //let texture3 = loader.load('assets/particle_textures-01.png');
    //let texture4 = loader.load('assets/particle_textures-04.png');
    // let texture5 = loader.load('assets/particle_textures-05.png');

    scene.add(createPointCloud("system1", texture1, size, transparent, opacity, sizeAttenuation, color));
    scene.add(createPointCloud("system2", texture2, size, transparent, opacity, sizeAttenuation, color));
    //scene.add(createPointCloud("system3", texture3, size, transparent, opacity, sizeAttenuation, color));
    //scene.add(createPointCloud("system4", texture4, size, transparent, opacity, sizeAttenuation, color));
    // scene.add(createPointCloud("system5", texture5, size, transparent, opacity, sizeAttenuation, color));

}

function createPointCloud(name, texture, size, transparent, opacity, sizeAttenuation, color) {
    //push all the points (particles) into a geometry

    let c = new THREE.Color(color);

    //c.setHSL(c.getHSL().h, c.getHSL().s, (Math.random() * c.getHSL().l), 'LinearSRGBColorSpace');
    let material = new THREE.PointsMaterial({
        size: size,
        transparent: transparent,
        opacity: opacity,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: sizeAttenuation,
        color: 0xffffff
    });

    let particles = [];
    let range = 10;
    for (let i = 0; i < 1400; i++) {
        let particle = new THREE.Vector3(
            Math.random() * range - range / 2,
            Math.random() * range * 1.5,
            Math.random() * range - range / 2
        )
        particle.velocityY = 0.1 + Math.random() / 5;
        particle.velocityX = (Math.random() - 0.5) / 3;
        particle.velocityZ = (Math.random() - 0.5) / 3;

        particles.push(particle);
    }

    let geo = new THREE.BufferGeometry().setFromPoints(particles);


    let system = new THREE.Points(geo, material);
    system.name = name;
    return system;

}



