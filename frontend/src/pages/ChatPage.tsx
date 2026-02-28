/**
 * ChatPage Component
 * Main chat interface page
 * Mobile-first: full-width single column on mobile, constrained on desktop
 * Requirements: 7.1, 7.2, 11.1, 11.2
 */

import React from 'react';
import { LearningArena } from '../components/chat';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full w-full md:max-w-7xl md:mx-auto">
      <LearningArena />
    </div>
  );
};
