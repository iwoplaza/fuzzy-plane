import { Group, Mesh, Object3D, BoxGeometry, MeshBasicMaterial } from 'three';
import { ContinuousEntity1D } from './continousEntity';


const boxGeometry = new BoxGeometry(5, 5, 5);
const boxMaterial = new MeshBasicMaterial({
    color: 0xff111111,
});


export class Obstacles extends Group implements ContinuousEntity1D {
    private readonly minDistanceBetweenObstacles: number = 50;
    private readonly maxDistanceBetweenObstacles: number = 200;
    private instances: Object3D[] = [];
    private nextSpawnPosition: number = 200;

    constructor(private readonly roadWidth: number) {
        super();

        this.instances = [];
    }

    private spawnObstacle(zPosition: number) {
        const obstacle = new Mesh(boxGeometry);
        obstacle.material = boxMaterial;

        const left = Math.random() > 0.5;

        obstacle.position.set((Math.random() * 2 - 1) * this.roadWidth / 2, 0, zPosition);

        this.add(obstacle);
        this.instances.push(obstacle);
    }

    public updateViewerPosition(viewerZ: number): void {
        const viewDistance = 200;
        const viewDistanceBackwards = 20;

        if (viewerZ + viewDistance > this.nextSpawnPosition) {
            this.spawnObstacle(this.nextSpawnPosition);

            this.nextSpawnPosition += this.minDistanceBetweenObstacles + Math.random() * (this.maxDistanceBetweenObstacles - this.minDistanceBetweenObstacles);
        }

        if (this.instances.length > 0 && this.instances[0].position.z < viewerZ - viewDistanceBackwards) {
            // Delete unused obstacles
            this.remove(this.instances[0]);
            this.instances.splice(0, 1);
        }
    }
}