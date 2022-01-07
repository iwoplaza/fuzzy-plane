import { Line, MakeLine } from './line';
import { Vec2 } from '../vector';


export class LineSegment extends Line {
    /**
     * Smaller bound (y if vertical, x otherwise)
     */
     public readonly from: number;

    /**
     * Bigger bound (y if vertical, x otherwise)
     */
     public readonly to: number;

    constructor(slope: number, b: number, from: number, to: number) {
        super(slope, b);
        this.from = from;
        this.to = to;
    }

    /**
     * Evaluates the line segment y at a given x.
     * @param x 
     * @throws Error if segment is vertical.
     * @returns Null if point doesn't belong to the segment (ends-inclusive), number otherwise.
     */
    evaluateAtX(x: number): number|null {
        if (this.isVertical()) {
            throw new Error(`Cannot evaluate vertical line segment given an x coordinate.`);
        }

        if (x < this.from || x > this.to)
            return null;

        return this.slope * x + this.b;
    }

    /**
     * Evaluates the line segment x at a given y.
     * @param y
     * @throws Error if segment is horizontal.
     * @returns Null if point doesn't belong to the segment (ends-inclusive), number otherwise.
     */
    evaluateAtY(y: number): number|null {
        if (this.isHorizontal()) {
            throw new Error(`Cannot evaluate horizontal line segment given a y coordinate.`);
        }

        const x = this.evaluateLineAtY(y);
        if (x < this.from || x > this.to)
            return null;

        return x;
    }

    /**
     * Computes point of intersection between two line segments (including their end points).
     * @param line1 
     * @param line2 
     * @returns Null if segments don't intersect.
     */
    static intersect(line1: LineSegment, line2: LineSegment): Vec2|null {
        if (line1.isVertical() && line2.isVertical()) {
            return (line1.b === line2.b && line2.to >= line1.from && line2.from <= line1.to) ? { x: line1.b, y: 0 } : null;
        }

        if (line1.isVertical() || line2.isVertical()) {
            // Assume line 2 is vertical
            if (line1.isVertical()) {
                const t = line1;
                line1 = line2;
                line2 = t;
            }

            const x2 = line2.b;
            const y = line1.evaluateAtX(x2);
            if (y === null) {
                return null;
            }

            return { x: x2, y };
        }

        // Both segments are non-vertical
        const x = (line2.b - line1.b) / (line1.slope - line2.slope);

        if (x < line2.from || x > line2.to) // Checks inclusion with line2 range
            return null;

        const y = line1.evaluateAtX(x);
        if (y === null) // Checks inclusion with line1 range
            return null;
        
        return { x, y };
    }
}

export namespace MakeLineSegment {
    export function betweenPoints(p1: Vec2, p2: Vec2) {
        if (p1.x === p2.x) {
            // Vertical
            if (p1.y < p2.y) {
                return new LineSegment(Number.POSITIVE_INFINITY, p1.x, p1.y, p2.y);
            }
            else {
                return new LineSegment(Number.NEGATIVE_INFINITY, p1.x, p2.y, p1.y);
            }
        }

        return restrictXDomain(MakeLine.betweenPoints(p1, p2), p1.x, p2.x);
    }

    export function vertical(x: number, yFrom: number, yTo: number) {
        return new LineSegment(Number.POSITIVE_INFINITY, x, yFrom, yTo);
    }
        /**
     * Creates a new line segment, based on the same line as this one, but with a new value range in the x axis.
     * @param x1 
     * @param x2 
     * @returns A new line segment.
     */
    export function restrictXDomain(line: Line, x1: number, x2: number): LineSegment {
        return new LineSegment(line.slope, line.b, Math.min(x1, x2), Math.max(x1, x2));
    }

    /**
     * Creates a new line segment, based on the same line as this one, but with a new value range in the y axis.
     * @param y1 
     * @param y2 
     * @returns A new line segment.
     */
    export function restrictYDomain(line: Line, y1: number, y2: number): LineSegment {
        const x1 = line.evaluateLineAtY(y1);
        const x2 = line.evaluateLineAtY(y2);
        return new LineSegment(line.slope, line.b, Math.min(x1, x2), Math.max(x1, x2));
    }
}