import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

let camera, cam1, cam2, controls;
let CAMSWITCH = false;
let raycaster, pointer, INTERSECTED;
let scene, renderer, canvas;
let shelves, books;
let font;

let b2019 = ['The Bell Jar',
    'Picture of Dorian Gray',
    'The End of Eddy',
    'Weight of the Earth',
    'The White Book',
    'Talking to Women',
    'Men Without Women',
    'Bergeners',
    'A Woman Looking at Men Looking at Women',
    '蟬', '比霧更深的地方', '斜陽', '尋羊冒險記', '直到長出青苔', '苦雨之地'
]

let b2020 = [
    '人類動物園',
    '幸福建築',
    '真原醫',
    '土星座下',
    '脆弱的力量',
    '最重要的日常',
    '一個人的好天氣',
    '千羽鶴',
    '斜陽',
    '魂斷威尼斯',
    '世界末日與冷酷異境',
    '王國vol.01'
]

let b2021 = [
    '愛的不久時',
    '十宅論',
    '王國vol.04',
    '理想的下午',
    '為什麼設計',
    '出門買蛋去',
    '不朽',
    '感覺十書',
    'Beautiful World, Where Are You?',
    'Species of Spaces',
    'Women and Cities',
    'Breath of Life',
    'Myths to Live By'
]

let b2022 = [
    'All About Love',
    'An Aprrenticeship or the Book of Pleasures',
    'Things: A Stories of the Sixties',
    'Braiding Sweetgrass',
    'The Fire Next Time',
    'Death By Landscape',
    'A Year with Swollen Appendicies',
    '性意思史',
    '沒有色彩的多崎作',
    '蜥蜴',
    '邊緣光影',
    '療癒的飲食與斷食'
]



function init() {

    //set up scene
    let div = document.querySelector(".grid1");

    renderer = new THREE.WebGLRenderer({
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    let canvas = renderer.domElement;
    canvas.setAttribute('id', 'webgl');

    div.appendChild(canvas);

    scene = new THREE.Scene();


    //set up 2 cameras
    cam1 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20000000);
    cam1.position.set(10, 20, 135);


    cam2 = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20000000);
    cam2.position.set(0, 50, 300);

    camera = cam1.clone();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(10, 20, 0);
    controls.enableRotate = false;
    controls.listenToKeyEvents(window);
    controls.update();



    //shelves
    shelves = new THREE.Group();
    scene.add(shelves);

    let shelfGeo = new THREE.BoxGeometry(10, 0.3, 15);
    let shelfMat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
    });

    let norway = new THREE.Vector3(5, 50, 0);
    let newyork1 = new THREE.Vector3(-20, 30, 0);
    let newyork2 = new THREE.Vector3(-10, 35, 0);
    let taipei = new THREE.Vector3(30, 30, 0);
    let locations = [norway, newyork1, newyork2, taipei];

    for (let i = 0; i < 4; i++) {
        let shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(locations[i].x, locations[i].y, locations[i].z);
        shelf.receiveShadow = true;
        shelf.name = "shelves";
        shelves.add(shelf);
    }

    let texture = new THREE.TextureLoader().load('assets/worldmap-01.png');
    let shelfWallMat = new THREE.MeshLambertMaterial({
        color: 0xefefef,
        bumpMap: texture,
        bumpScale: 2,
        side: THREE.DoubleSide,
    });
    let shelfWall = new THREE.Mesh(new THREE.PlaneGeometry(100, 75), shelfWallMat);
    shelfWall.position.set(0, 30, 4)
    shelfWall.receiveShadow = true;
    shelfWall.name = "shelves";

    let wallMat = new THREE.MeshLambertMaterial({
        color: 0xefefef,
        side: THREE.DoubleSide,
    });


    var wall_txt = new THREE.TextureLoader().load('assets/wall_text-01.png');

    let longWallGeo = new THREE.BoxGeometry(150, 170, 50);
    let shortWallGeo = new THREE.BoxGeometry(200, 50, 50);
    let longWall1 = new THREE.Mesh(longWallGeo, wallMat);
    let longWall2 = new THREE.Mesh(longWallGeo, wallMat);
    let shortWall1 = new THREE.Mesh(shortWallGeo, [wallMat, new THREE.MeshLambertMaterial({ color: 0xefefef, bumpMap: wall_txt })]);
    shortWall1.geometry.groups = [{ start: 0, count: 30, materialIndex: 0 }, { start: 12, count: 18, materialIndex: 1 }];
    let shortWall2 = new THREE.Mesh(shortWallGeo, wallMat);
    shelves.add(longWall1);
    longWall1.position.set(-125, 30, -20);
    shelves.add(longWall2);
    longWall2.position.set(125, 30, -20);
    shelves.add(shortWall1);
    shortWall1.position.set(0, -30, -20);
    shelves.add(shortWall2);
    shortWall2.position.set(0, 90, -20);
    shelves.add(shelfWall);



    //book
    books = new THREE.Group();
    scene.add(books);


    //2019 books
    let books2019 = [];
    let books2020 = [];
    let books2021 = [];
    let books2022 = [];
    let bookMat = new THREE.MeshLambertMaterial({
        color: 0x5555ff,
        emissive: 0x000000,
    });

    addYearBooks(books2019, b2019.length, bookMat, norway.x, norway.y, b2019);
    addYearBooks(books2020, b2020.length, bookMat, taipei.x, taipei.y, b2020);
    addYearBooks(books2021, b2021.length, bookMat, newyork1.x, newyork1.y, b2021);
    addYearBooks(books2022, b2022.length, bookMat, newyork2.x, newyork2.y, b2022);



    //light
    let light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    let dir_light = new THREE.DirectionalLight(0xffffff, 0.3);
    dir_light.position.set(0, 8, 3);
    dir_light.castShadow = true;
    scene.add(dir_light);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    //year text
    let loader = new FontLoader();
    loader.load('assets/helvetiker_regular.typeface.json', function (font) {

        font = font;
        createText(font, "2019", norway.x, norway.y, -Math.PI / 2 - 0.05);
        createText(font, "2020", taipei.x, taipei.y, -Math.PI / 2 - 0.1);
        createText(font, "2021", newyork1.x, newyork1.y, -Math.PI / 2);
        createText(font, "2022", newyork2.x, newyork2.y, -Math.PI / 2 - 0.1);

    });

    let bookends = [];
    for (let i = 0; i < 4; i++) {

        bookends[i] = new THREE.Group();
        scene.add(bookends[i]);

    }

    for (let i = 0; i < bookends.length; i++) {
        let bookendGeo1 = new THREE.BoxGeometry(0.2, 4, 3);
        let bookendGeo2 = new THREE.BoxGeometry(1.3, 0.2, 3);
        let bookendMat = new THREE.MeshLambertMaterial({
            color: 0xdddddd,
        })
        let b1 = new THREE.Mesh(bookendGeo1, bookendMat);
        let b2 = new THREE.Mesh(bookendGeo2, bookendMat);
        b2.position.set(-0.6, -2, 0);

        bookends[i].add(b1);
        bookends[i].add(b2);
        bookends[i].position.set(locations[i].x - 3.6, locations[i].y + 2.2, 5);
    }






}

init();





function animate() {
    requestAnimationFrame(animate);
    render();

}

function render() {


    renderRaycaster();

    if (camera) {

        //limit camera  positin
        if (camera.position.x > 50) {
            camera.position.x = 50;
        }

        if (camera.position.x < -50) {
            camera.position.x = -50;
        }

        if (camera.position.z > 160) {
            camera.position.z = 160;
        }

        if (camera.position.z < 50) {
            camera.position.z = 50;
        }
    }


    renderer.render(scene, camera);

    requestAnimationFrame(render);

}


function onPointerMove(event) {

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    let div = document.getElementById("objects");
    div.style.left = event.clientX + 10 + 'px';
    div.style.top = event.clientY + 10 + 'px';
}

function renderRaycaster() {

    raycaster.setFromCamera(pointer, camera);

    let intersects = raycaster.intersectObjects(books.children, true);
    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {

            //reset color
            if (INTERSECTED) {
                if (INTERSECTED.material.color) {
                    INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                }

            }
            //update intersected object
            INTERSECTED = intersects[0].object;

            if (INTERSECTED.material.color) {
                //save the intersected object current color
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                //then change the color
                INTERSECTED.material.color.setHex(0xaaaaaa);
            }


            showHover(INTERSECTED.name);


        }

    } else {

        if (INTERSECTED) {
            if (INTERSECTED.material.color) {
                //reset the objects color to its original
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            }


            clearHover(INTERSECTED.name);
        }
        //reset the intersected
        INTERSECTED = null;

    }

}

function camswitch(e) {
    switch (e.keyCode) {
        case 82:
            CAMSWITCH = !CAMSWITCH;

            if (CAMSWITCH) {
                camera.position.copy(cam1.position);
                camera.updateProjectionMatrix();
                console.log("using cam1");
                controls.target.set(10, 20, 0);

                controls.enableRotate = false;

                controls.update();

            } else {

                camera.position.copy(cam2.position);
                camera.updateProjectionMatrix();
                console.log("using cam2");

                controls.enableZoom = true;
                controls.target.set(0, 45, 0);
                controls.update();
            }

            break;
    }

}

window.addEventListener('pointermove', onPointerMove);
//window.addEventListener('keydown', camswitch);
//window.addEventListener('wheel', shelvesMove);
window.addEventListener('mousedown', showIntroText);

animate();

function showIntroText() {
    if (INTERSECTED) {
        let title = document.querySelector(".title");
        title.innerHTML = INTERSECTED.name;
        getUser();
    }
}

function addYearBooks(arry, arrylength, bookMat, xpos, ypos, title) {
    for (let i = 0; i < arrylength; i++) {
        let h = getRandomArbitrary(3, 6);
        let hue = Math.floor(getRandomArbitrary(0, 360));
        let c = 'hsl(';
        let color = c.concat(hue).concat(', 100%, 90%)');
        let matColor = new THREE.Color(color);

        let bookGeo = new THREE.BoxGeometry(0.5, h, 3);
        arry[i] = new THREE.Mesh(bookGeo, bookMat.clone());
        arry[i].material.color.set(matColor);
        arry[i].position.set(xpos - 3 + i / 1.8, ypos + h / 2, 5);
        arry[i].name = title[i];

        books.add(arry[i]);
    }
}

function createText(font, text, posx, posy, ang) {
    let textGeo = new TextGeometry(text.toString(), {
        font: font,
        size: 0.8,
        height: 0.2,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0
    });
    let textMat = new THREE.MeshLambertMaterial({
        color: 0x666666,
        // emissive: 0xffffff
    })
    let txt = new THREE.Mesh(textGeo, textMat);
    // txt.position.set(-3.3, 51, 12);
    txt.position.set(posx - 4.5, posy + 2.8, 6);
    // txt.rotateZ(-Math.PI / 2 - 0.1);
    txt.rotateZ(ang);
    scene.add(txt);
}

function showHover(name) {
    let div = document.getElementById("objects");
    div.textContent = name;
}

function clearHover(name) {
    let div = document.getElementById("objects");
    div.textContent = "";
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}