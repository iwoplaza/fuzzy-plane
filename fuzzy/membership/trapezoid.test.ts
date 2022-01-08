import { LineSegment, MakeLineSegment } from '../intersection';
import { Trapezoid, TrapezoidShape } from './trapezoid';

function randomBetween(a: number, b: number) {
    return a + Math.random() * (b - a);
}

function compareSegments(a: LineSegment, b: LineSegment) {
    expect(a.slope).toBeCloseTo(b.slope);
    expect(a.b).toBeCloseTo(b.b);
    expect(a.from).toBeCloseTo(b.from);
    expect(a.to).toBeCloseTo(b.to);
}

test('correctly decomposes into line segments', () => {
    const x1 = randomBetween(-500, 500);
    const x2 = x1 + randomBetween(0, 200);
    const x3 = x2 + randomBetween(0, 200);
    const x4 = x3 + randomBetween(0, 200);

    const trapezoid = (new Trapezoid()).from(x1, x2).to(x3, x4).result;

    const segments = trapezoid.getLineSegments(1);

    expect(segments.length).toBe(5);
    compareSegments(segments[0], MakeLineSegment.horizontal(0, Number.NEGATIVE_INFINITY, x1)); // Floor before
    compareSegments(segments[1], MakeLineSegment.betweenPoints({ x: x1, y: 0 }, { x: x2, y: 1})); // Rising edge
    compareSegments(segments[2], MakeLineSegment.horizontal(1, x2, x3)); // Constant
    compareSegments(segments[3], MakeLineSegment.betweenPoints({ x: x3, y: 1 }, { x: x4, y: 0 })); // Falling edge
    compareSegments(segments[4], MakeLineSegment.horizontal(0, x4, Number.POSITIVE_INFINITY)); // Floor after
});

test('evaluates at rising edge correctly', () => {
    const trapezoid = (new Trapezoid()).from(-10, 10).to(20, 30).result;

    expect(trapezoid.evaluate(-10)).toBeCloseTo(0);
    expect(trapezoid.evaluate(0)).toBeCloseTo(0.5);
    expect(trapezoid.evaluate(10)).toBeCloseTo(1);
});

test('evaluates at constant correctly', () => {
    const trapezoid = (new Trapezoid()).from(-10, 10).to(20, 30).result;

    for (let i = 0; i < 100; ++i) {
        expect(trapezoid.evaluate(10 + Math.random() * 10)).toBeCloseTo(1);
    }
});

test('evaluates at falling edge correctly', () => {
    const trapezoid = (new Trapezoid()).from(-10, 10).to(20, 30).result;

    expect(trapezoid.evaluate(20)).toBeCloseTo(1);
    expect(trapezoid.evaluate(0)).toBeCloseTo(0.5);
    expect(trapezoid.evaluate(30)).toBeCloseTo(0);
});

test('calculates area of symmetrical trapezoid', () => {
    const center = Math.random() * 200 - 100;
    const constantRadius = 0 + Math.random() * 200;
    const edgeWidth = 0 + Math.random() * 200;

    const trapezoid = (new Trapezoid()).from(center - constantRadius - edgeWidth, center - constantRadius).to(center + constantRadius, center + constantRadius + edgeWidth).result;

    const area = trapezoid.getArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);

    expect(area).toBeCloseTo(constantRadius * 2 + edgeWidth);
});

test('calculates area of cutoff symmetrical trapezoid', () => {
    const center = Math.random() * 200 - 100;
    const constantRadius = 0 + Math.random() * 200;
    const edgeWidth = 0 + Math.random() * 200;

    const trapezoid = (new Trapezoid()).from(center - constantRadius - edgeWidth, center - constantRadius).to(center + constantRadius, center + constantRadius + edgeWidth).result;

    // Cutting off the top in half
    const area = trapezoid.getArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 0.5);

    const constBlock = (constantRadius * 2 + edgeWidth) * 0.5;
    const sideBlocks = edgeWidth / 4;

    expect(area).toBeCloseTo(constBlock + sideBlocks);
});

test('calculates center of mass for symmetrical trapezoid', () => {
    const expectedCentre = Math.random() * 200 - 100;
    const trapezoid = (new Trapezoid()).from(-40 + expectedCentre, -30 + expectedCentre).to(30 + expectedCentre, 40 + expectedCentre).result;

    const centerOfMassTimesArea = trapezoid.getXCenterOfMassTimesArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);
    const area = trapezoid.getArea(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 1);

    expect(centerOfMassTimesArea).toBeCloseTo(expectedCentre * area);
});