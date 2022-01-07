import { FuzzyLogic, Fuzzifier, FuzzyVar } from '../fuzzy/logic';
import { Trapezoid } from '../fuzzy/membership';

export interface ControllerInput {
    leftBorderDistance: number;
    rightBorderDistance: number;
    leftEyeDistance: number;
    rightEyeDistance: number;
}

export interface IController {
    computeTiltAcceleration(input: ControllerInput): number;
}

export class Controller implements IController {
    logic: any;

    constructor() {
        const distance = new Fuzzifier([
            ['very close', new Trapezoid().from(-1, 0).to(1, 3)],
            ['close', new Trapezoid().from(1, 3).to(10, 20)],
            ['far', new Trapezoid().from(10, 20).to(200, 1000)],
        ]);

        const tilt = new Fuzzifier([
            ['big left', new Trapezoid().from(-1).to(-0.7, -0.4)],
            ['small left', new Trapezoid().from(-0.5, -0.3).to(-0.3, -0.1)],
            ['neutral', new Trapezoid().from(-0.1, 0).to(0, 0.1)], // Triangle centered around 0
            ['small right', new Trapezoid().from(0.1, 0.3).to(0.3, 0.5)],
            ['big right', new Trapezoid().from(0.4, 0.7).to(1)],
        ]);

        const leftBorder = new FuzzyVar(distance);
        const rightBorder = new FuzzyVar(distance);
        const leftEye = new FuzzyVar(distance);
        const rightEye = new FuzzyVar(distance);

        this.logic = new FuzzyLogic(tilt, [
            leftBorder,
            rightBorder,
            leftEye,
            rightEye
        ], {
            'big left':     rightBorder.is('very close'),
            'small left':   rightBorder.is('close'),
            'neutral':      rightBorder.is('far'),
            'small right':  leftBorder.is('close'),
            'big right':    leftBorder.is('very close'),
        });
    }

    computeTiltAcceleration(input: ControllerInput): number {
        return this.logic.determine([
            input.leftBorderDistance,
            input.rightBorderDistance,
            input.leftEyeDistance,
            input.rightEyeDistance
        ]);
    }
}