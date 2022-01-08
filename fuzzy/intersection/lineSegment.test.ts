import { AsLineSegment, LineSegment, MakeLineSegment } from './lineSegment';
import { MakeLine } from './line'; // Has to be here, line segment depends on it, and Jest doesn't resolve this automatically.

test('evaluation at x respects [-1, 5] boundaries', () => {
    const line = { slope: 1, b: 0, from: -1, to: 5 };

    expect(AsLineSegment.evaluateAtX(line, 3)).toBeCloseTo(3);
    expect(AsLineSegment.evaluateAtX(line, -1)).toBeCloseTo(-1);

    expect(AsLineSegment.evaluateAtX(line, -2)).toBe(null);
    expect(AsLineSegment.evaluateAtX(line, 6)).toBe(null);
});

test('correctly computes the intersection point of (1, 1) -> (3, 3) and (3, 1) -> (1, 3)', () => {
    const line1 = MakeLineSegment.betweenPoints({ x: 1, y: 1 }, { x: 3, y: 3 });
    const line2 = MakeLineSegment.betweenPoints({ x: 3, y: 1 }, { x: 1, y: 3 });

    const ip = AsLineSegment.intersect(line1, line2);

    expect(ip).toEqual({ x: 2, y: 2 });
});

test('correctly computes the intersection point of (1, 1) -> (3, 3) and vertical at x=2', () => {
    const line1 = MakeLineSegment.betweenPoints({ x: 1, y: 1 }, { x: 3, y: 3 });
    const line2 = MakeLineSegment.vertical(2, -3, 3);

    const ip = AsLineSegment.intersect(line1, line2);

    expect(ip).toEqual({ x: 2, y: 2 });
});

test('correctly omits the intersection point of (1, 1) -> (3, 3) and vertical at x=2, y:[-2, 0]', () => {
    const line1 = MakeLineSegment.betweenPoints({ x: 1, y: 1 }, { x: 3, y: 3 });
    const line2 = MakeLineSegment.vertical(2, -2, 0);

    const ip = AsLineSegment.intersect(line1, line2);

    expect(ip).toBe(null);
});