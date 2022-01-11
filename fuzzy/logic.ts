import { AsLineSegment } from './intersection/lineSegment';
import { TrapezoidShape } from './membership';
import { CompoundShape } from './membership/compound';
import { CutoffShape } from './membership/cutoff';
import { NumericCompoundShape } from './membership/numericCompound';
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

    getFuzzifier(): Fuzzifier {
        return this.fuzzifier;
    }

    getKey(): string {
        return this.key;
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
        public readonly outputFuzzifier: Fuzzifier,
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

    public constructCompoundShape(values: {[key: string]: number}): CompoundShape {
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

        const breakpoints: { from: number, shapeIdx: number }[] = [];
        const certaintyMap: {[key: string]: number} = {};
        const functionsList = this.outputFuzzifier.membershipFunctions;
        functionsList.forEach(([variableKey, ]) => certaintyMap[variableKey] = this.rulesMap[variableKey].computeCertainty(values));

        breakpoints.push({
            from: Number.NEGATIVE_INFINITY,
            shapeIdx: 0,
        });

        // In this simpler solution, we assume the first function is the left-most function.
        let currentShapeIdx = 0;
        let intersection: { point: Vec2, nextShapeIdx: number }|null = null;

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

        return new CompoundShape(breakpoints.map(b => {
            const [varKey, func] = functionsList[b.shapeIdx];

            return {
                from: b.from,
                shape: new CutoffShape(func, certaintyMap[varKey]),
            };
        }));
    }

    public constructNumericCompoundShape(values: {[key: string]: number}): NumericCompoundShape {
        const certaintyMap: {[key: string]: number} = {};
        const functionsList = this.outputFuzzifier.membershipFunctions;
        functionsList.forEach(([variableKey, ]) => certaintyMap[variableKey] = this.rulesMap[variableKey].computeCertainty(values));

        return new NumericCompoundShape(functionsList.map(([varKey, func]) => {
            return new CutoffShape(func, certaintyMap[varKey]);
        }));
    }

    public determine(values: {[key: string]: number}): number {
        const compound = this.constructCompoundShape(values);

        let totalCenterOfMassTimesArea = compound.getXCenterOfMassTimesArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);
        let totalArea = compound.getArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);

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