import styles from '../styles/Home.module.scss';
import Head from 'next/head';
import { useRef, useEffect, useState } from 'react';
import { ThreeContext } from '../web/threeContext';
import { CartesianGrid, Legend, Line, LineChart, Polygon, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Coordinate } from 'recharts/types/util/types';
import { TrapezoidShape } from '../fuzzy/membership';

let threeContext: ThreeContext|null = null;

interface TrapezoidData {
    label: string;
    points: Coordinate[];
}

interface CompoundData {
    x: number;
    membership: number;
}

export default function Home() {
    const canvasContainerRef = useRef<HTMLDivElement>();
    const [tiltAcceleration, setTiltAcceleration] = useState(0);
    const [trapezoidDataList, setTrapezoidDataList] = useState<TrapezoidData[]>([]);
    const [compoundData, setCompoundData] = useState<CompoundData[]>();

    useEffect(() => {
        if (threeContext === null) {
            threeContext = new ThreeContext();
        }

        threeContext.mount(canvasContainerRef.current, () => {
            setTiltAcceleration(threeContext.planeTiltAcceleration);
            setTrapezoidDataList(threeContext.controller.getLogic().outputFuzzifier.membershipFunctions.map(([key, func]) => ({
                label: key,
                points: (() => {
                    const { fromLow, fromHigh, toHigh, toLow } = (func as TrapezoidShape);

                    return [
                        { x: fromLow, y: 0 },
                        { x: fromHigh, y: 1 },
                        { x: toHigh, y: 1 },
                        { x: toLow, y: 0 },
                    ];
                })()
            })));

            setCompoundData(() => {
                const data: CompoundData[] = [];

                for (let x = -2; x <= 2; x += 0.1) {
                    data.push({
                        x,
                        membership: threeContext.controller.compoundShape.evaluate(x),
                    });
                }

                return data;
            });
        });
    }, [canvasContainerRef]);

    return (
        <div className={styles.container}>
            <Head>
                <title>Fuzzy Plane</title>
                <meta name="description" content="An app made for a university project" />
                <meta name="author" content="Iwo Plaza" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    Fuzzy Plane
                </h1>
                <aside className={styles.graphs}>
                    <p>{tiltAcceleration}</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            width={500}
                            height={500}
                            data={compoundData}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="x" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="membership" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </aside>
                <div ref={canvasContainerRef} className={styles.canvasContainer}></div>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://github.com/iwoplaza"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    More projects by Iwo Plaza
                </a>
            </footer>
        </div>
    )
}
