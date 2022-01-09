import { FuzzyLogic, Fuzzifier, FuzzyVar, all, any } from '../fuzzy/logic';
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
    logic: FuzzyLogic;

    constructor() {
        const distance = new Fuzzifier([
            ['very close', new Trapezoid().from(0, 0).to(10, 30)],
            ['close', new Trapezoid().from(10, 30).to(50, 200)],
            ['far', new Trapezoid().from(50, 200).to(200, 1000)],
        ]);

        const tilt = new Fuzzifier([
            ['big left', new Trapezoid().from(-1).to(-0.7, -0.4)],
            ['small left', new Trapezoid().from(-0.5, -0.3).to(-0.3, -0.1)],
            ['neutral', new Trapezoid().from(-0.1, 0).to(0, 0.1)], // Triangle centered around 0
            ['small right', new Trapezoid().from(0.1, 0.3).to(0.3, 0.5)],
            ['big right', new Trapezoid().from(0.4, 0.7).to(1)],
        ]);

        const leftBorder = new FuzzyVar('left border', distance);
        const rightBorder = new FuzzyVar('right border', distance);
        const leftEye = new FuzzyVar('left eye', distance);
        const rightEye = new FuzzyVar('right eye', distance);

        this.logic = new FuzzyLogic(tilt, [
            leftBorder,
            rightBorder,
            leftEye,
            rightEye
        ], {
            'big left':     any(rightEye.is('close'), rightEye.is('very close')),
            'small left':   rightBorder.is('close'),
            'neutral':      any(rightBorder.is('far'), leftBorder.is('far')),
            'small right':  leftBorder.is('close'),
            'big right':    any(leftEye.is('close'), leftEye.is('very close')),
        });
    }

    computeTiltAcceleration(input: ControllerInput): number {
        return this.logic.determine({
            'left border': input.leftBorderDistance,
            'right border': input.rightBorderDistance,
            'left eye': input.leftEyeDistance,
            'right eye': input.rightEyeDistance
        }) || 0;
    }
}