'use client';

import { useState } from 'react';
import Hero from './Hero';
import Modal from '../shared/Modal';
import Features from './Features';

const Home = () => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    return (
        <div>
            <Hero onDownloadClick={openModal} />
            <Features />

            {/* 3. Global Modal Controller Element */}
            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </div>
    );
};

export default Home;