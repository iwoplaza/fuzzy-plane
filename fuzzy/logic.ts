import { AsLineSegment } from './intersection/lineSegment';
import { TrapezoidShape } from './membership';
import { MembershipFunction, MembershipFunctionBuilder } from './membership/types';
import { Vec2 } from './vector';

function isBuilder(v : MembershipFunction|MembershipFunctionBuilder<unknown>): v is MembershipFunctionBuilder<unknown> {
    return typeof v['verifyComplete'] !== 'undefined';
}

export class Fuzzifier {
    public membershipFunctions: [string, MembershipFunction][] = [];
    public membershipFunctionsMap: {[key: string]: MembershipFunction} = {};

    constructor(fuzzyValues: [string, MembershipFunction|MembershipFunctionBuilder<unknown>][]) {
        for (const [fuzzyLabel, func] of fuzzyValues) {
            let membershipFunction;
            if (isBuilder(func)) {
                func.verifyComplete();
                membershipFunction = func.result;
            }
            else {
                membershipFunction = func;
            }
            
            this.membershipFunctions.push([fuzzyLabel, membershipFunction]);
            this.membershipFunctionsMap[fuzzyLabel] = membershipFunction;
        }
    }
}

export class FuzzyVar {
    constructor(private key: string, private fuzzifier: Fuzzifier) {
        
    }

    is(fuzzyValueLabel: string): ICondition {
        if (this.fuzzifier.membershipFunctionsMap[fuzzyValueLabel] === undefined) {
            throw new Error(`Unknown fuzzy value: ${fuzzyValueLabel}`);
        }

        return {
            computeCertainty: (values: {[key: string]: number}) => {
                return this.fuzzifier.membershipFunctionsMap[fuzzyValueLabel].evaluate(values[this.key]);
            },
        };
    }
}

export interface IntersectionResolver<A extends MembershipFunction, B extends MembershipFunction> {
    (primary: A, certaintyA: number, replacement: B, certaintyB: number): Vec2[];
}

function resolveTwoTrapezoids(primary: TrapezoidShape, certaintyA: number, replacement: TrapezoidShape, certaintyB: number): Vec2[] {
    const aLines = primary.getLineSegments(certaintyA);
    const bLines = replacement.getLineSegments(certaintyB);

    const points: Vec2[] = [];

    // Finding points of intersection such that when going along the curve of 'ta' and meeting
    // the point, we'd switch to 'tb' knowing it'll take us higher (bigger slope)
    for (const aLine of aLines) {
        for (const bLine of bLines) {
            if (bLine.slope < aLine.slope) {
                // We're only interested in slopes that will take us higher.
                continue;
            }

            if (bLine.slope === aLine.slope && bLine.to <= aLine.to) {
                // We're only interested in lines that will take us further
                continue;
            }

            const point = AsLineSegment.intersect(aLine, bLine);
            if (point == null)
                continue;

            points.push(point);
        }
    }

    return points;
}

export class FuzzyLogic {
    private intersectionResolverMap: {[key: string]: IntersectionResolver<any, any>} = {};

    constructor(
        private outputFuzzifier: Fuzzifier,
        private variables: FuzzyVar[],
        private rulesMap: {[key: string]: ICondition}
    ) {
        this.registerIntersectionResolver("trapezoid", "trapezoid", resolveTwoTrapezoids);
    }

    public registerIntersectionResolver<A extends MembershipFunction, B extends MembershipFunction>(typeA: A['type'], typeB: B['type'], resolver: IntersectionResolver<A, B>) {
        this.intersectionResolverMap[typeA + '-' + typeB] = resolver;
        this.intersectionResolverMap[typeB + '-' + typeA] = resolver;
    }

    public getResolver(typeA: string, typeB: string): IntersectionResolver<any, any> {
        return this.intersectionResolverMap[typeA + '-' + typeB];
    }

    public determine(values: {[key: string]: number}): number {
        const breakpoints: { from: number, shapeIdx: number }[] = [];

        //  TODO This works, but overengineered for trapezoids.
        //  The simpler solution hinges on the membershipFunctions being sorted by occurrence from left to right.
        
        // Finding the shape to start it all
        // const currentShape = functionsList.reduce((a, b) => {
            //     const aPoint = a.leftMostNonZero;
            //     const bPoint = b.leftMostNonZero;
            
            //     if (aPoint[0] === bPoint[0]) {
                //         return aPoint[1] > bPoint[1] ? a : b;
                //     }
                
                //     return aPoint[0] < bPoint[0] ? a : b;
                // });
                
        
        const functionsList = this.outputFuzzifier.membershipFunctions;
        const certaintyMap: {[key: string]: number} = {};
        functionsList.forEach(([variableKey, ]) => certaintyMap[variableKey] = this.rulesMap[variableKey].computeCertainty(values));

        console.log({ certaintyMap, values });

        // In this simpler solution, we assume the first function is the left-most function.
        let currentShapeIdx = 0;
        let intersection: { point: Vec2, nextShapeIdx: number }|null = null;

        breakpoints.push({
            from: Number.NEGATIVE_INFINITY,
            shapeIdx: currentShapeIdx,
        });

        
        while (currentShapeIdx < functionsList.length) {
            const [varA, shapeA] = functionsList[currentShapeIdx];

            let nextStepFound = false;
            for (let i = 0; i < functionsList.length; ++i) {      
                if (i === currentShapeIdx) // Skipping self-intersection
                    continue;
                
                const [varB, shapeB] = functionsList[i];
                const resolver = this.getResolver(shapeA.type, shapeB.type);
                let points = resolver(shapeA, certaintyMap[varA], shapeB, certaintyMap[varB]);

                if (intersection !== null) {
                    points = points.filter(p => p.x >= intersection.point.x);
                }

                if (points.length > 0) {
                    intersection = {
                        point: points[0],
                        nextShapeIdx: i,
                    };
                    nextStepFound = true;
                    break;
                }
            }

            if (!nextStepFound) {
                break;
            }
            else {
                breakpoints.push({
                    from: intersection.point.x,
                    shapeIdx: intersection.nextShapeIdx
                });
                currentShapeIdx = intersection.nextShapeIdx;
            }
        }

        console.log(breakpoints);

        let totalCenterOfMassTimesArea = 0;
        let totalArea = 0;

        for (let i = 0; i < breakpoints.length; ++i) {
            const breakpoint = breakpoints[i];
            const nextBreakpoint = breakpoints[i + 1] || { from: Number.POSITIVE_INFINITY, shapeIdx: -1 };
            
            const [variable, shape] = functionsList[breakpoint.shapeIdx];
            const area = shape.getArea(breakpoint.from, nextBreakpoint.from, certaintyMap[variable]);
            const centerOfMassTimesArea = shape.getXCenterOfMassTimesArea(breakpoint.from, nextBreakpoint.from, certaintyMap[variable]);

            totalArea += area;
            totalCenterOfMassTimesArea += centerOfMassTimesArea;
        }

        if (totalArea == 0) {
            return null;
        }

        return totalCenterOfMassTimesArea / totalArea;
    }
}

export interface ICondition {
    computeCertainty(values: {[key: string]: number}): number;
}

export const all = (...conds: ICondition[]): ICondition => {
    return {
        computeCertainty(values) {
            return conds.reduce((prev, a) => Math.min(prev, a.computeCertainty(values)), 1);
        },
    };
};

export const any = (...conds: ICondition[]): ICondition => {
    return {
        computeCertainty(values) {
            return conds.reduce((prev, a) => Math.max(prev, a.computeCertainty(values)), 0);
        },
    };
};