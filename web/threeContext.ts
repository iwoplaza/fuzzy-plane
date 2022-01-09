import { AmbientLight, ArrowHelper, Clock, Fog, Object3D, PerspectiveCamera, Raycaster, Scene, Vector3, WebGLRenderer } from 'three';
import { ContinuousBorder } from './continuousBorder';
import { Controller, ControllerInput, IController } from './controller';
import { Obstacles } from './obstacles';
import { Plane } from './plane';

function sigmoid(z) {
    return 2 / (1 + Math.exp(-z)) + 1;
}

export class ThreeContext {
    private renderer: WebGLRenderer;
    private scene: Scene;
    private camera: PerspectiveCamera;
    private clock: Clock;

    private readonly roadWidth: number = 30;
    private readonly leftEyeDirection: Vector3 = new Vector3(-0.1, 0, 1);
    private readonly rightEyeDirection: Vector3 = new Vector3(0.1, 0, 1);

    private plane: Plane;
    private leftBorder: ContinuousBorder;
    private rightBorder: ContinuousBorder;
    private obstacles: Obstacles;
    private leftEyeRayHelper: ArrowHelper;
    private rightEyeRayHelper: ArrowHelper;

    public controllerInput: ControllerInput = {
        leftBorderDistance: Number.POSITIVE_INFINITY,
        rightBorderDistance: Number.POSITIVE_INFINITY,
        leftEyeDistance: Number.POSITIVE_INFINITY,
        rightEyeDistance: Number.POSITIVE_INFINITY,
    };
    public controller: IController;
    public planeTiltAcceleration = 0;
    public planeVelocityX: number = 0;

    constructor(private readonly containerElement: HTMLDivElement) {
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        const bgColor = 0xff33aaaa;
        this.renderer.setClearColor(bgColor);
        this.renderer.sortObjects = false;

        this.scene = new Scene();
        this.scene.fog = new Fog(bgColor, 40, 200);
        this.camera = new PerspectiveCamera(60, 1, 0.1, 200);
        this.camera.position.set(0, 10, -20);
        this.clock = new Clock();

        const ambientLight = new AmbientLight(0xffffffff, 3);
        this.scene.add(ambientLight);

        this.containerElement.innerHTML = '';
        this.containerElement.appendChild(this.renderer.domElement);
        this.updateCameraProjection(containerElement.clientWidth, containerElement.clientHeight);

        // Setting up the scene
        this.plane = new Plane();
        this.scene.add(this.plane);
        this.camera.lookAt(this.plane.position);
        this.plane.position.x = -5;

        this.leftBorder = new ContinuousBorder();
        this.leftBorder.position.x = -this.roadWidth/2;
        this.rightBorder = new ContinuousBorder();
        this.rightBorder.position.x = this.roadWidth/2;
        this.scene.add(this.leftBorder, this.rightBorder);

        this.obstacles = new Obstacles(this.roadWidth);
        this.scene.add(this.obstacles);

        this.leftEyeRayHelper = new ArrowHelper(this.leftEyeDirection, this.plane.position, 10, 0xff222222, 2, 0.6);
        this.rightEyeRayHelper = new ArrowHelper(this.rightEyeDirection, this.plane.position, 10, 0xff222222, 2, 0.6);
        this.scene.add(this.leftEyeRayHelper, this.rightEyeRayHelper);

        this.controller = new Controller();

        // Resize the canvas on window resize.
        window.addEventListener('resize', (e) => {
            this.updateCameraProjection(containerElement.clientWidth, containerElement.clientHeight);
        }, false);

        // Setting up the render loop
        const renderLoop = () => {
            this.render();
            requestAnimationFrame(renderLoop);
        };

        renderLoop();
    }

    private updateCameraProjection(width: number, height: number) {
        const ratio = width / height;
        this.camera.aspect = ratio;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    computeRayDistance(origin, dir) {
        const raycaster: Raycaster = new Raycaster(origin, dir, 0.1);
        const intersections = raycaster.intersectObject(this.obstacles);

        if (intersections.length <= 0) {
            return Number.POSITIVE_INFINITY;
        }

        const closest = intersections.reduce((a, b) => a.distance < b.distance ? a : b);
        return closest.distance;
    }

    render() {
        // Updating physics
        const delta = Math.min(this.clock.getDelta(), 0.5);
        this.plane.position.z += delta * 100;
        this.plane.position.x += this.planeVelocityX * delta;
        this.plane.position.x = Math.max(-this.roadWidth / 2, Math.min(this.plane.position.x, this.roadWidth / 2));

        // Updating anchors
        this.camera.position.setZ(this.plane.position.z - 20);

        // Calculating input
        const leftDistance = this.computeRayDistance(this.leftEyeRayHelper.position, this.leftEyeDirection);
        this.leftEyeRayHelper.setLength(Math.min(leftDistance, 200));
        const rightDistance = this.computeRayDistance(this.rightEyeRayHelper.position, this.rightEyeDirection);
        this.rightEyeRayHelper.setLength(Math.min(rightDistance, 200));

        this.controllerInput.leftBorderDistance = this.roadWidth / 2 + this.plane.position.x;
        this.controllerInput.rightBorderDistance = this.roadWidth / 2 - this.plane.position.x;
        this.controllerInput.leftEyeDistance = leftDistance;
        this.controllerInput.rightEyeDistance = rightDistance;

        this.planeTiltAcceleration = this.controller.computeTiltAcceleration(this.controllerInput) * 10;
        this.planeVelocityX += this.planeTiltAcceleration * delta * 10;
        this.plane.setRotationFromAxisAngle(new Vector3(0, 0, 1), sigmoid(-this.planeVelocityX * 0.1) * Math.PI / 2);

        this.leftBorder.updateViewerPosition(this.plane.position.z);
        this.rightBorder.updateViewerPosition(this.plane.position.z);
        this.obstacles.updateViewerPosition(this.plane.position.z);

        this.leftEyeRayHelper.position.copy(this.plane.position);
        this.rightEyeRayHelper.position.copy(this.plane.position);
        
        // Rendering
        this.renderer.render(this.scene, this.camera);
    }
}