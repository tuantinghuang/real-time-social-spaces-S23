
export default class Portal {
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