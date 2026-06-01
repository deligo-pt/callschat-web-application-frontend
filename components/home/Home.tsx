'use client';

import { useState } from 'react';
import Hero from './Hero';
import Modal from '../shared/Modal';

const Home = () => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    return (
        <div>
            <Hero onDownloadClick={openModal} />

            {/* 3. Global Modal Controller Element */}
            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </div>
    );
};

export default Home;