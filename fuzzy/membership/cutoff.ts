import { MembershipFunction } from './types';

export class CutoffShape implements MembershipFunction {
    public readonly type = 'cutoff';

    constructor(public readonly innerFunc: MembershipFunction, public readonly cutoffHeight: number) {}

    evaluate(x: number): number {
        return Math.min(this.innerFunc.evaluate(x), this.cutoffHeight);
    }

    getArea(from: number, to: number, cutoffHeight: number): number {
        return this.innerFunc.getArea(from, to, Math.min(this.cutoffHeight, cutoffHeight));
    }

    getXCenterOfMassTimesArea(from: number, to: number, cutoffHeight: number): number {
        return this.innerFunc.getXCenterOfMassTimesArea(from, to, Math.min(this.cutoffHeight, cutoffHeight));
    }

    get leftMostNonZero(): [number, number] {
        return this.innerFunc.leftMostNonZero;
    }
}