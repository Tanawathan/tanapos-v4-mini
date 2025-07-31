import React from 'react';
import ModernNavigation from '../ModernNavigation';

interface ModernLayoutProps {
  children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-gray-50)'
    }}>
      <ModernNavigation />
      <main>
        {children}
      </main>
    </div>
  );
};

export default ModernLayout;
