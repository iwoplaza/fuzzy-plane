import { Vec2 } from '../vector';

export interface Line {
    /**
     * Slope (can be POS_INF, or NEG_INF, which means that it's a vertical line)
     */
     slope: number;

     /**
      * Y coordinate where the line would cross the Y axis. (If vertical line, then it's x coordinate)
      */
     b: number;
}

/**
 * Evaluates the line's y at a given x.
 * @param x 
 * @throws Error if line is vertical.
 * @returns Null if point doesn't belong to the line (ends-inclusive), number otherwise.
 */
export const evaluateLineAtX = (line: Readonly<Line>, x: number): number => {
    if (isVertical(line)) {
        throw new Error(`Cannot evaluate vertical line segment given an x coordinate.`);
    }
    
    return line.slope * x + line.b;
}

/**
 * Evaluates the line's x at a given y.
 * @param y
 * @throws Error if line is horizontal.
 * @returns Null if point doesn't belong to the line (ends-inclusive), number otherwise.
 */
export const evaluateLineAtY = (line: Readonly<Line>, y: number): number => {
    if (isHorizontal(line)) {
        throw new Error(`Cannot evaluate horizontal line segment given a y coordinate.`);
    }

    return (y - line.b) / line.slope;
}

export const isHorizontal = (line: Readonly<Line>): boolean => {
    return line.slope === 0;
}

export const isVertical = (line: Readonly<Line>): boolean => {
    return line.slope === Number.POSITIVE_INFINITY || line.slope === Number.NEGATIVE_INFINITY;
}

/**
 * Computes point of intersection between two liness.
 * NOTE: Does not include intersections between parallel lines
 * @param line1 
 * @param line2 
 * @returns Null if lines don't intersect, or are parallel.
 */
export const intersect = (line1: Readonly<Line>, line2: Readonly<Line>): Vec2|null => {
    if (isVertical(line1) && isVertical(line2)) {
        return line1.b === line2.b ? { x: line1.b, y: 0 } : null;
    }

    if (isVertical(line1) || isVertical(line2)) {
        // Assume line 2 is vertical
        if (isVertical(line1)) {
            const t = line1;
            line1 = line2;
            line2 = t;
        }

        return { x: line2.b, y: evaluateLineAtX(line1, line2.b) };
    }

    if (line1.slope === line2.slope) {
        // NOTE: Ignoring intersections between parallel lines.
        return null;
    }

    // Both segments are non-vertical
    const x = (line2.b - line1.b) / (line1.slope - line2.slope);
    const y = evaluateLineAtX(line1, x);
    
    return { x, y };
}

export namespace MakeLine {
    export function betweenPoints(p1: Vec2, p2: Vec2) {
        if (p1.x === p2.x) {
            // Vertical
            return {
                slope: p1.y < p2.y ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
                b: p1.x
            };
        }

        const l = p1.x < p2.x ? p1 : p2;
        const r = p1.x < p2.x ? p2 : p1;

        const slope = (r.y - l.y) / (r.x - l.x);
        const b = l.y - slope * l.x;

        return { slope, b };
    }

    export function fromPointAndSlope(p1: Vec2, slope: number) {
        if (slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY) {
            return { slope, b: p1.x };
        }

        return { slope, b: p1.y - slope * p1.x };
    }

    export function vertical(x: number) {
        return { slope: Number.POSITIVE_INFINITY, b: x };
    }
}