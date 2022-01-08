import { MakeLine } from '.';
import { Line, evaluateLineAtX, evaluateLineAtY, intersect } from './line';

test('given y = 1x + 0, evaluates y at x=0 to be 0', () => {
    const line: Line = { slope: 1, b: 0 };

    expect(evaluateLineAtX(line, 0)).toBe(0);
});

test('given y = 1x + 0, evaluates x at y=0 to be 0', () => {
    const line: Line = { slope: 1, b: 0 };

    expect(evaluateLineAtY(line, 0)).toBe(0);
});

test('correctly creates line between points (1, 2) and (2, 3)', () => {
    const line = MakeLine.betweenPoints({ x: 1, y: 2 }, { x: 2, y: 3 });

    expect(line.slope).toBe(1);
    expect(line.b).toBe(1);
});

test('correctly computes the intersection point of (1, 1) -> (3, 3) and (3, 1) -> (1, 3)', () => {
    const line1 = MakeLine.betweenPoints({ x: 1, y: 1 }, { x: 3, y: 3 });
    const line2 = MakeLine.betweenPoints({ x: 3, y: 1 }, { x: 1, y: 3 });

    const ip = intersect(line1, line2);

    expect(ip).toEqual({ x: 2, y: 2 });
});

test('correctly computes the intersection point of (1, 1) -> (3, 3) and vertical at x=2', () => {
    const line1 = MakeLine.betweenPoints({ x: 1, y: 1 }, { x: 3, y: 3 });
    const line2 = MakeLine.vertical(2);

    const ip = intersect(line1, line2);

    expect(ip).toEqual({ x: 2, y: 2 });
});