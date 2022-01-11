import { MembershipFunction } from './types';

export interface Breakpoint {
    from: number;
    shape: MembershipFunction;
}

/**
 * Represents a shape made up of multiple shapes, all responsible for a slice of the x domain.
 */
export class CompoundShape implements MembershipFunction {
    public readonly type = 'compound';

    /**
     * Each breakpoint describes where a shape starts to take responsibility,
     * until the next breakpoint.
     * 
     * It's assumed that the first breakpoint's from value is always Number.NEGATIVE_INFINITY.
     */
    private breakpoints: Breakpoint[];

    constructor(breakpoints: Breakpoint[]) {
        this.breakpoints = breakpoints;
    }

    evaluate(x: number): number {
        const breakpointIdx = this.getBreakpointIndexContainingX(x);

        return this.breakpoints[breakpointIdx].shape.evaluate(x);
    }

    getArea(from: number, to: number, cutoffHeight: number): number {
        let totalArea = 0;
        
        this.forEachSection(from, to, (curr, next, start, end) => {
            totalArea += curr.shape.getArea(start, end, cutoffHeight);
        });

        return totalArea;
    }

    getXCenterOfMassTimesArea(from: number, to: number, cutoffHeight: number): number {
        let comta = 0;

        this.forEachSection(from, to, (curr, next, start, end) => {
            comta += curr.shape.getXCenterOfMassTimesArea(start, end, cutoffHeight);
        });

        return comta;
    }

    get leftMostNonZero(): [number, number] {
        throw new Error('Not implemented');
    }

    public forEachSection(from: number, to: number, callback: (current: Breakpoint, next: Breakpoint, from: number, to: number) => void) {
        let breakpointIdx = this.getBreakpointIndexContainingX(from);
        let breakFrom = from;
        
        while (breakFrom < to) {
            const breakTo = (() => {
                const nextBp = this.breakpoints[breakpointIdx + 1];
                return nextBp !== undefined ? Math.min(nextBp.from, to) : to;
            })();

            callback(this.breakpoints[breakpointIdx], this.breakpoints[breakpointIdx + 1], breakFrom, breakTo);

            breakpointIdx++;
            breakFrom = (() => {
                const bp = this.breakpoints[breakpointIdx];
                return bp !== undefined ? bp.from : Number.POSITIVE_INFINITY;
            })();
        }
    }

    private getBreakpointIndexContainingX(x: number) {
        let breakpointIdx = 0;

        const getBreakpointEnd = () => {
            const b = this.breakpoints[breakpointIdx + 1];
            return b !== undefined ? b.from : Number.POSITIVE_INFINITY;
        };

        while (x >= getBreakpointEnd()) {
            breakpointIdx++;
        }

        return breakpointIdx;
    }
}