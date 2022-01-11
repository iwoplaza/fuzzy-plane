export interface MembershipFunction {
    readonly type: string;
    /**
     * The point (could be (-inf, y)) that is the first non-zero y value going from -inf. 
     */
    readonly leftMostNonZero: [number, number];
    readonly rightMostNonZero: [number, number];
    evaluate(x: number): number;
    getArea(from: number, to: number, cutoffHeight: number): number;
    getXCenterOfMassTimesArea(from: number, to: number, cutoffHeight: number): number;
}

export interface MembershipFunctionBuilder<F> {
    verifyComplete(): void;
    readonly result: F;
}

export class IncompleteError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

