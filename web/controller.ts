import { FuzzyLogic, Fuzzifier, FuzzyVar, all, any } from '../fuzzy/logic';
import { Trapezoid } from '../fuzzy/membership';
import { CompoundShape } from '../fuzzy/membership/compound';

export interface ControllerInput {
    leftBorderDistance: number;
    rightBorderDistance: number;
    leftEyeDistance: number;
    rightEyeDistance: number;
}

export interface IController {
    computeTiltAcceleration(input: ControllerInput): number;
    getInputVars(): FuzzyVar[];
    getLogic(): FuzzyLogic;
}

export class Controller implements IController {
    private logic: FuzzyLogic;
    public compoundShape: CompoundShape|null = null;
    private inputVars: FuzzyVar[] = [];

    constructor() {
        const distance = new Fuzzifier([
            ['very close', new Trapezoid().from(-1, -1).to(10, 30)],
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

        this.inputVars.push(leftBorder, rightBorder, leftEye, rightEye);

        this.logic = new FuzzyLogic(tilt, [
            leftBorder,
            rightBorder,
            leftEye,
            rightEye
        ], {
            'big left':     any(rightEye.is('close'), rightEye.is('very close')),
            'small left':   any(rightBorder.is('close'), rightBorder.is('very close')),
            'neutral':      any(rightBorder.is('far'), leftBorder.is('far')),
            'small right':  any(leftBorder.is('close'), leftBorder.is('very close')),
            'big right':    any(leftEye.is('close'), leftEye.is('very close')),
        });
    }

    computeTiltAcceleration(input: ControllerInput): number {
        // Doing this manually instead of calling logic.determine so that we can inspect the compound shape.

        this.compoundShape = this.logic.constructCompoundShape({
            'left border': input.leftBorderDistance,
            'right border': input.rightBorderDistance,
            'left eye': input.leftEyeDistance,
            'right eye': input.rightEyeDistance
        });

        let totalCenterOfMassTimesArea = this.compoundShape.getXCenterOfMassTimesArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);
        let totalArea = this.compoundShape.getArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);

        if (totalArea == 0) {
            return 0;
        }

        return totalCenterOfMassTimesArea / totalArea;
    }

    getLogic(): FuzzyLogic {
        return this.logic;
    }

    getInputVars(): FuzzyVar[] {
        return this.inputVars;
    }
}