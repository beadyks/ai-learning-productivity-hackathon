/**
 * DocumentPage Component
 * Page wrapper for Document Upload Center
 * Mobile-first: full-width on mobile, constrained on desktop
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2
 */

import React from 'react';
import { DocumentUploadCenter } from '../components/document';

export const DocumentPage: React.FC = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="py-4 sm:py-8">
        <DocumentUploadCenter />
      </div>
    </div>
  );
};
