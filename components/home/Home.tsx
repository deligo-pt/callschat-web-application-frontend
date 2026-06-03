'use client';

import { useState } from 'react';
import Hero from './Hero';
import Modal from '../shared/Modal';
import Features from './Features';
import DualMood from './DualMode';
import Security from './Security';
import Translation from './Translation';
import SafetyLayer from './SafetyLayer';
import DownloadCTA from './DownloadCTA';

const Home = () => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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

            {/* 3. Global Modal Controller Element */}
            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </div>
    );
};

export default Home;