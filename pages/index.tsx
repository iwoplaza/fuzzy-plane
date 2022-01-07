import styles from '../styles/Home.module.css';
import Head from 'next/head';
import { useRef, useEffect } from 'react';
import { ThreeContext } from '../web/threeContext';

let threeContext = null;

export default function Home() {
    const canvasContainerRef = useRef<HTMLDivElement>();

    useEffect(() => {
        if (threeContext === null) {
            threeContext = new ThreeContext(canvasContainerRef.current);
        }
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
