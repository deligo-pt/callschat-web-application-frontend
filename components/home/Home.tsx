'use client';

import { useEffect, useState } from 'react';
import Hero from './Hero';
import Modal from '../shared/Modal';
import Features from './Features';
import DualMood from './DualMode';
import Security from './Security';
import Translation from './Translation';
import SafetyLayer from './SafetyLayer';
import DownloadCTA from './DownloadCTA';
import Faq from './Faq';

const Home = () => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    // The homepage must always open framed at the very top. Browsers (and
    // dev-server reloads) try to "restore" the previous scroll position, which
    // makes the viewport drift down a little just after the hero paints. Opt out
    // of automatic restoration and pin to the top — once on mount and again on
    // the next frame, after the hero entrance animation has been laid out.
    useEffect(() => {
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
        window.scrollTo(0, 0);
        const id = requestAnimationFrame(() => window.scrollTo(0, 0));
        return () => cancelAnimationFrame(id);
    }, []);

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    return (
        <div>
            <Hero onDownloadClick={openModal} />
            <Features />
            <DualMood />
            <Security />
            <Translation />
            <SafetyLayer />
            <DownloadCTA />
            <Faq />

            {/* 3. Global Modal Controller Element */}
            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </div>
    );
};

export default Home;