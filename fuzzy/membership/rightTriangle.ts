import { MembershipFunction } from './types';

/**
 * Represents a triangle shape of height 1,
 * 
 * lowX - the x coordinate where the hypotenuse touches the x axis
 * highX - the x coordinate where the hypotenuse touches the line perpendicular to x axis at y = 1
 */
// export class RightTriangleShape implements MembershipFunction {
//     private from: number;
//     private to: number;
//     private rising: boolean;

//     constructor(private lowX: number, private highX: number) {
//         this.rising = highX > lowX;
//         this.from = Math.min(lowX, highX);
//         this.to = Math.max(lowX, highX);
//     }

//     evaluate(x: number): number {
//         if (x < this.from || x > this.to) {
//             return 0;
        
//         if (this.rising) {

//         }
//     }
// }