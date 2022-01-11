import { LineSegment, MakeLine, MakeLineSegment } from '../intersection';
import { MembershipFunction, MembershipFunctionBuilder } from './types';

/**
 * Represents a trapezoid shape of height 1,
 * 
 * lower base = toLow - fromLow
 * upper base = toHigh - fromHigh
 */
export class TrapezoidShape implements MembershipFunction {
    public readonly type = 'trapezoid' as const;
    public readonly leftMostNonZero: [number, number];
    public readonly rightMostNonZero: [number, number];

    constructor(
        public fromLow: number,
        public fromHigh: number,
        public toHigh: number,
        public toLow: number
    ) {
        if (fromHigh > fromLow) {
            // Has a ramp
            this.leftMostNonZero = [fromLow, 0];
        }
        else {
            // Instant jump to 1
            this.leftMostNonZero = [fromLow, 1];
        }

        if (toLow > toHigh) {
            // Has a ramp
            this.rightMostNonZero = [toLow, 0];
        }
        else {
            // Instant jump to 1
            this.rightMostNonZero = [toLow, 1];
        }
    }

    evaluate(x: number): number {
        if (x < this.fromLow)
            return 0;
        if (x < this.fromHigh)
            return (x - this.fromLow) / (this.fromHigh - this.fromLow);
        if (x < this.toHigh)
            return 1;
        if (x < this.toLow)
            return 1 - (x - this.toHigh) / (this.toLow - this.toHigh);

        return 0;
    }

    /**
     * Computes the area of a trapezoid, within the (from, 0) -> (to, cutoffHeight) boundingBox.
     * @param from The bounding-box's left edge x coordinate
     * @param to The bounding-box's right edge x coordinate
     * @param cutoffHeight The bounding-box's top edge y coordinate
     * @returns Area of the shape within the bounding box.
     */
    getArea(from: number, to: number, cutoffHeight: number): number {
        cutoffHeight = Math.min(cutoffHeight, 1);

        const x1 = Math.max(this.fromLow, from);
        const x4 = Math.min(this.toLow, to);

        const cutoffHeightInv = 1 - cutoffHeight;
        const x2 = cutoffHeight * this.fromHigh + cutoffHeightInv * this.fromLow;
        const x3 = cutoffHeight * this.toHigh + cutoffHeightInv * this.toLow;

        const leftArea = (this.evaluate(x1) + cutoffHeight) * (x2 - x1) / 2;
        const rightArea = (this.evaluate(x4) + cutoffHeight) * (x4 - x3) / 2;
        const middleArea = (x3 - x2) * cutoffHeight;

        return leftArea + middleArea + rightArea;
    }

    getXCenterOfMassTimesArea(from: number, to: number, cutoffHeight: number): number {
        cutoffHeight = Math.min(cutoffHeight, 1);

        const x1 = Math.max(this.fromLow, from);
        const x4 = Math.min(this.toLow, to);

        const cutoffHeightInv = 1 - cutoffHeight;
        const x2 = cutoffHeight * this.fromHigh + cutoffHeightInv * this.fromLow;
        const x3 = cutoffHeight * this.toHigh + cutoffHeightInv * this.toLow;

        const y1 = this.evaluate(x1);
        const y2 = cutoffHeight;
        const y3 = cutoffHeight;
        const y4 = this.evaluate(x4);

        let left = 0;
        if (x2 > x1) {
            const leftSlope = (y2 - y1) / (x2 - x1);
            
            left = (x2*x2) * (y1/2 + leftSlope/3 * x2 - leftSlope/2 * x1) -
            (x1*x1) * (y1/2 + leftSlope/3 * x1 - leftSlope/2 * x1);
        }
        
        let right = 0;
        if (x4 > x3) {
            const rightSlope = (y4 - y3) / (x4 - x3);
            right = (x4*x4) * (y3/2 + rightSlope/3 * x4 - rightSlope/2 * x3) -
                        (x3*x3) * (y3/2 + rightSlope/3 * x3 - rightSlope/2 * x3);
        }

        return left + right + (cutoffHeight / 2) * (x3*x3 - x2*x2);
    }

    getLineSegments(cutoffHeight: number): LineSegment[] {
        return [
            // Floor before
            { slope: 0, b: 0, from: Number.NEGATIVE_INFINITY, to: this.fromLow },
            // Rising edge
            MakeLineSegment.restrictYDomain(
                MakeLine.fromPointAndSlope({ x: this.fromLow, y: 0 }, this.fromLow === this.fromHigh ? Number.POSITIVE_INFINITY : 1 / (this.fromHigh - this.fromLow)),
                0, cutoffHeight // from, to
            ),
            // Const
            { slope: 0, b: cutoffHeight, from: this.fromHigh, to: this.toHigh },
            // Falling edge
            MakeLineSegment.restrictYDomain(
                MakeLine.fromPointAndSlope({ x: this.toLow, y: 0 }, this.toHigh === this.toLow ? Number.NEGATIVE_INFINITY : 1 / (this.toHigh - this.toLow)),
                0, cutoffHeight // from, to
            ),
            // Floor after
            { slope: 0, b: 0, from: this.toLow, to: Number.POSITIVE_INFINITY },
        ];
    }
}

export class Trapezoid implements MembershipFunctionBuilder<TrapezoidShape> {
    public _fromLow: number|null = Number.NEGATIVE_INFINITY;
    public _fromHigh: number|null = Number.NEGATIVE_INFINITY;
    public _toHigh: number|null = Number.POSITIVE_INFINITY;
    public _toLow: number|null = Number.POSITIVE_INFINITY;

    verifyComplete(): void {}

    public from(low: number, high?: number): Trapezoid {
        this._fromLow = low;
        this._fromHigh = high === undefined ? low : high;

        if (this._fromHigh < this._fromLow) {
            throw new Error(`from-high must be after from-low`);
        }

        return this;
    }

    public to(high: number, low?: number): Trapezoid {
        this._toHigh = high;
        this._toLow = low === undefined ? high : low;

        if (this._toLow < this._toHigh) {
            throw new Error(`to-low must be after to-high`);
        }

        return this;
    }

    get result(): TrapezoidShape {
        return new TrapezoidShape(this._fromLow, this._fromHigh, this._toHigh, this._toLow);
    }
}
