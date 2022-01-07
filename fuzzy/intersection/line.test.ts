import { Line } from './line';

test('given y = 1x + 0, evaluates y at x=0 to be 0', () => {
    const line = new Line(1, 0);

    expect(line.evaluateLineAtX(0)).toBe(0);
});

test('given y = 1x + 0, evaluates x at y=0 to be 0', () => {
    const line = new Line(1, 0);

    expect(line.evaluateLineAtY(0)).toBe(0);
});