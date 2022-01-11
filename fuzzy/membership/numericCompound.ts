import { MembershipFunction } from './types';

export class NumericCompoundShape implements MembershipFunction {
    public readonly type = "numeric_compound";

    constructor(private shapes: MembershipFunction[]) {

    }

    evaluate(x: number): number {
        return this.shapes.map(s => s.evaluate(x)).reduce((a, b) => Math.max(a, b));
    }

    getArea(from: number, to: number, cutoffHeight: number): number {
        if (from === Number.NEGATIVE_INFINITY)
            from = this.shapes.reduce((f, shape) => Math.min(f, shape.leftMostNonZero[0]), Number.POSITIVE_INFINITY);
        if (to === Number.POSITIVE_INFINITY)
            to = this.shapes.reduce((t, shape) => Math.max(t, shape.rightMostNonZero[0]), Number.NEGATIVE_INFINITY);

        const slices = 25;
        const deltaX = (to - from) / slices;

        let area = 0;

        for (let i = 0; i < slices; ++i) {
            const x1 = from + deltaX * i;
            const x2 = from + deltaX * (i + 1);
            
            const y1 = this.evaluate(x1);
            const y2 = this.evaluate(x2);

            area += deltaX * (y1 + y2) / 2;
        }

        return area;
    }

    getXCenterOfMassTimesArea(from: number, to: number, cutoffHeight: number): number {
        if (from === Number.NEGATIVE_INFINITY)
            from = this.shapes.reduce((f, shape) => Math.min(f, shape.leftMostNonZero[0]), Number.POSITIVE_INFINITY);
        if (to === Number.POSITIVE_INFINITY)
            to = this.shapes.reduce((t, shape) => Math.max(t, shape.rightMostNonZero[0]), Number.NEGATIVE_INFINITY);

        const slices = 25;
        const deltaX = (to - from) / slices;

        let comta = 0;

        for (let i = 0; i < slices; ++i) {
            const x1 = from + deltaX * i;
            const x2 = from + deltaX * (i + 1);
            
            const y1 = Math.min(this.evaluate(x1), cutoffHeight);
            const y2 = Math.min(this.evaluate(x2), cutoffHeight);

            comta += 1/6 * (
                y1 * (x2*x2 + x1*x2 - 2*x1*x1) -
                y2 * (x1*x1 + x1*x2 - 2*x2*x2)
            );
        }

        return comta;
    }

    get leftMostNonZero(): [number, number] {
        return this.shapes[0].leftMostNonZero;
    }

    get rightMostNonZero(): [number, number] {
        return this.shapes[this.shapes.length - 1].rightMostNonZero;
    }
}