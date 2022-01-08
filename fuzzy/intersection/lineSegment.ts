import * as Line from './line';
import { Vec2 } from '../vector';


export interface LineSegment extends Line.Line {
    /**
     * Smaller bound (y if vertical, x otherwise)
     */
    from: number;

    /**
     * Bigger bound (y if vertical, x otherwise)
     */
    to: number;
}

export namespace AsLineSegment {
    /**
     * Evaluates the line segment y at a given x.
     * @param x 
     * @throws Error if segment is vertical.
     * @returns Null if point doesn't belong to the segment (ends-inclusive), number otherwise.
     */
    export const evaluateAtX = (line: LineSegment, x: number): number|null => {
        if (Line.isVertical(line)) {
            throw new Error(`Cannot evaluate vertical line segment given an x coordinate.`);
        }

        if (x < line.from || x > line.to)
            return null;

        return line.slope * x + line.b;
    }

    /**
     * Evaluates the line segment x at a given y.
     * @param y
     * @throws Error if segment is horizontal.
     * @returns Null if point doesn't belong to the segment (ends-inclusive), number otherwise.
     */
    export const evaluateAtY = (line: LineSegment, y: number): number|null => {
        if (Line.isHorizontal(line)) {
            throw new Error(`Cannot evaluate horizontal line segment given a y coordinate.`);
        }

        const x = Line.evaluateLineAtY(line, y);
        if (x < line.from || x > line.to)
            return null;

        return x;
    }

    
    /**
     * Computes point of intersection between two line segments (including their end points).
     * @param line1 
     * @param line2 
     * @returns Null if segments don't intersect.
     */
    export const intersect = (line1: LineSegment, line2: LineSegment): Vec2|null => {
        if (Line.isVertical(line1) && Line.isVertical(line2)) {
            return (line1.b === line2.b && line2.to >= line1.from && line2.from <= line1.to) ? { x: line1.b, y: 0 } : null;
        }

        if (Line.isVertical(line1) || Line.isVertical(line2)) {
            // Assume line 2 is vertical
            if (Line.isVertical(line1)) {
                const t = line1;
                line1 = line2;
                line2 = t;
            }

            const x2 = line2.b;
            const y = AsLineSegment.evaluateAtX(line1, x2);
            if (y === null || y < line2.from || y > line2.to) {
                return null;
            }

            return { x: x2, y };
        }

        // Both segments are non-vertical
        const point = Line.intersect(line1, line2);

        if (point === null)
            return null;

        // Checking bounds inclusion.
        if (point.x < line1.from || point.x > line1.to || point.x < line2.from || point.x > line2.to)
            return null;

        return point;
    }
}

export namespace MakeLineSegment {
    export function betweenPoints(p1: Vec2, p2: Vec2): LineSegment {
        if (p1.x === p2.x) {
            // Vertical
            if (p1.y < p2.y) {
                return {
                    slope: Number.POSITIVE_INFINITY,
                    b: p1.x,
                    from: p1.y,
                    to: p2.y
                };
            }
            else {
                return {
                    slope: Number.NEGATIVE_INFINITY,
                    b: p1.x,
                    from: p2.y,
                    to: p1.y
                };
            }
        }

        return restrictXDomain(Line.MakeLine.betweenPoints(p1, p2), p1.x, p2.x);
    }

    export function horizontal(y: number, xFrom: number, xTo: number) {
        return {
            slope: 0,
            b: y,
            from: xFrom,
            to: xTo,
        };
    }

    export function vertical(x: number, yFrom: number, yTo: number) {
        return {
            slope: Number.POSITIVE_INFINITY,
            b: x,
            from: yFrom,
            to: yTo,
        };
    }
        /**
     * Creates a new line segment, based on the same line as this one, but with a new value range in the x axis.
     * @param x1 
     * @param x2 
     * @returns A new line segment.
     */
    export function restrictXDomain(line: Line.Line, x1: number, x2: number): LineSegment {
        return {
            slope: line.slope,
            b: line.b,
            from: Math.min(x1, x2),
            to: Math.max(x1, x2),
        };
    }

    /**
     * Creates a new line segment, based on the same line as this one, but with a new value range in the y axis.
     * @param y1 
     * @param y2 
     * @returns A new line segment.
     */
    export function restrictYDomain(line: Line.Line, y1: number, y2: number): LineSegment {
        const x1 = Line.evaluateLineAtY(line, y1);
        const x2 = Line.evaluateLineAtY(line, y2);

        return {
            slope: line.slope,
            b: line.b,
            from: Math.min(x1, x2),
            to: Math.max(x1, x2),
        };
    }
}