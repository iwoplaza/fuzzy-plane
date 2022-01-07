import { BoxGeometry, Mesh, MeshLambertMaterial, Object3D } from 'three';

export class Plane extends Object3D {
    constructor() {
        super();

        const scale = 1.5;
        const bodyGirth = 0.5;
        const bodyLength = 5;
        const wingSpan = 5;

        const bodyPart = new Mesh(new BoxGeometry(bodyGirth * 1.3 * scale, bodyGirth * scale, bodyLength * scale));
        const tailPart = new Mesh(new BoxGeometry(2 * scale, 0.2 * scale, 0.5 * scale));
        tailPart.position.set(0, 0, -bodyLength / 2 * scale);
        const wingsPart = new Mesh(new BoxGeometry(wingSpan * scale, 0.1 * scale, 0.9 * scale));
        wingsPart.position.set(0, 0, 0.1 * scale);

        bodyPart.material = new MeshLambertMaterial({
            color: 0xffff111f,
        });

        tailPart.material = new MeshLambertMaterial({
            color: 0xff331518,
        });

        wingsPart.material = new MeshLambertMaterial({
            color: 0xff331518,
        });

        this.add(bodyPart, tailPart, wingsPart);
    }
}