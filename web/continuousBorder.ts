import { Group, Mesh, Object3D, BoxGeometry } from 'three';
import { ContinuousEntity1D } from './continousEntity';

export class ContinuousBorder extends Group implements ContinuousEntity1D {
    private readonly instanceLength: number = 50;
    private instances: Object3D[] = [];
    private anchor: Group;

    constructor() {
        super();
        const borderGeometry = new BoxGeometry(1, 1, this.instanceLength);

        this.anchor = new Group();
        this.anchor.position.z = -this.instanceLength;
        this.add(this.anchor);
        this.instances = [];

        const instanceCount = 6;
        for(let i = 0; i < instanceCount; ++i) {
            const group = new Group();

            group.position.set(0, 0, this.instanceLength / 2 + i * this.instanceLength);
            group.add(new Mesh(borderGeometry));

            this.anchor.add(group);
            this.instances.push(group);
        }
    }

    public updateViewerPosition(viewerZ: number): void {
        if (viewerZ > this.anchor.position.z + this.instanceLength + 6)
        {
            this.anchor.position.z += this.instanceLength;
        }
    }
}