import { Vec2 } from '../vector';

export class Line {
    /**
     * Slope (can be POS_INF, or NEG_INF, which means that it's a vertical line)
     */
    public readonly slope: number;

    /**
     * Y coordinate where the line would cross the Y axis. (If vertical line, then it's x coordinate)
     */
    public readonly b: number;

    constructor(slope: number, b: number) {
        this.slope = slope;
        this.b = b;
    }

    /**
     * Evaluates the line's y at a given x.
     * @param x 
     * @throws Error if line is vertical.
     * @returns Null if point doesn't belong to the line (ends-inclusive), number otherwise.
     */
    evaluateLineAtX(x: number): number {
        if (this.isVertical()) {
            throw new Error(`Cannot evaluate vertical line segment given an x coordinate.`);
        }
        return this.slope * x + this.b;
    }
    
    /**
     * Evaluates the line's x at a given y.
     * @param y
     * @throws Error if line is horizontal.
     * @returns Null if point doesn't belong to the line (ends-inclusive), number otherwise.
     */
    evaluateLineAtY(y: number): number {
        if (this.isHorizontal()) {
            throw new Error(`Cannot evaluate horizontal line segment given a y coordinate.`);
        }

        return (y - this.b) / this.slope;
    }

    isHorizontal(): boolean {
        return this.slope === 0;
    }

    isVertical(): boolean {
        return this.slope === Number.POSITIVE_INFINITY || this.slope === Number.NEGATIVE_INFINITY;
    }
}

export namespace MakeLine {
    export function betweenPoints(p1: Vec2, p2: Vec2) {
        if (p1.x === p2.x) {
            // Vertical
            return new Line(p1.y < p2.y ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY, p1.x);
        }

        const l = p1.x < p2.x ? p1 : p2;
        const r = p1.x < p2.x ? p2 : p1;

        const slope = (r.y - l.y) / (r.x - l.x);
        const b = l.y - slope * l.x;

        return new Line(slope, b);
    }

    export function fromPointAndSlope(p1: Vec2, slope: number) {
        if (slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY) {
            return new Line(slope, p1.x);
        }

        return new Line(slope, p1.y - slope * p1.x);
    }

    export function vertical(x: number) {
        return new Line(Number.POSITIVE_INFINITY, x);
    }
}