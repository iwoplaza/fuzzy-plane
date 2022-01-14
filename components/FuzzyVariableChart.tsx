import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './FuzzyVariableChart.module.scss';

export type MembershipPointData = {
    x: number;
} & {[key: string]: number};

export interface InputVariableChartProps {
    label: string;
    functionLabels: string[];
    points: MembershipPointData[];
}

export function FuzzyVariableChart({ label: inputVarLabel, functionLabels, points }: InputVariableChartProps) {
    return (
        <div className={styles.base}>
            <h4 className={styles.label}>{inputVarLabel}</h4>
            <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {functionLabels.map((label, i) => (
                        <Area key={label} type="linear" dataKey={label} {...(() => {
                            const color = `hsl(${i * 30 + 120}, 50%, 70%)`;

                            return {
                                stroke: color,
                                fill: color,
                            };
                        })()} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}