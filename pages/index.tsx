import Head from 'next/head';
import styles from '../styles/Home.module.scss';
import { ThreeContext } from '../web/threeContext';
import { useRef, useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FuzzyVariableChart, MembershipPointData } from '../components/FuzzyVariableChart';
import { Fuzzifier } from '../fuzzy/logic';

let threeContext: ThreeContext|null = null;

interface FuzzyVarData {
    label: string;
    functionLabels: string[];
    points: MembershipPointData[];
    domain: [number, number];
}

const domains: {[key: string]: [number, number]} = {
    'left border': [0, 70],
    'right border': [0, 70],
    'left eye': [0, 220],
    'right eye': [0, 220],
};

function evaluateFuzzifier(fuzzifier: Fuzzifier, domain: [number, number], deltaX: number): { functionLabels: string[], points: MembershipPointData[] } {
    const functions = fuzzifier.membershipFunctions;
    const functionLabels = functions.map(([label, f]) => label);

    const points = [];
    for (let x = domain[0]; x <= domain[1]; x += deltaX) {
        const point: MembershipPointData = {
            x: Math.round(x * 100) / 100,
        };

        for (const [label, f] of functions) {
            point[label] = f.evaluate(x);
        }

        points.push(point);
    }

    return {
        functionLabels,
        points,
    };
}

export default function Home() {
    const canvasContainerRef = useRef<HTMLDivElement>();
    const [tiltAcceleration, setTiltAcceleration] = useState(0);
    const [compoundData, setCompoundData] = useState<MembershipPointData[]>();
    const [inputVarData, setInputVarData] = useState<FuzzyVarData[]>([]);
    const [outputVarData, setOutputVarData] = useState<FuzzyVarData|null>(null);

    useEffect(() => {
        if (threeContext === null) {
            threeContext = new ThreeContext();
        }

        setInputVarData(threeContext.controller.getInputVars().map(v => {
            const domain = domains[v.getKey()];

            return {
                label: v.getKey(),
                domain,
                ...evaluateFuzzifier(v.getFuzzifier(), domain, 10),
            };
        }));

        setOutputVarData(() => {
            const domain = [-1, 1] as [number, number];
            const fuzzifier = threeContext.controller.getLogic().outputFuzzifier;

            return {
                label: 'tilt',
                domain,
                ...evaluateFuzzifier(fuzzifier, domain, 0.1),
            };
        });

        threeContext.mount(canvasContainerRef.current, () => {
            setTiltAcceleration(threeContext.planeTiltAcceleration);

            setCompoundData(() => {
                const data: MembershipPointData[] = [];

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
                    <div className={styles.inputGraphsGrid}>
                        {inputVarData.map(inputVar => (
                            <FuzzyVariableChart
                                key={inputVar.label}
                                label={inputVar.label}
                                functionLabels={inputVar.functionLabels}
                                points={inputVar.points}
                            />
                        ))}
                    </div>
                    {outputVarData && (
                        <FuzzyVariableChart
                            key={outputVarData.label}
                            label={outputVarData.label}
                            functionLabels={outputVarData.functionLabels}
                            points={outputVarData.points}
                        />
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            width={500}
                            height={500}
                            data={compoundData}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="x" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="membership" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
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
