import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { VideoGenerationForm } from './components/VideoGenerationForm';
import { VideoHistory } from './components/VideoHistory';

function App() {
  const [activeTab, setActiveTab] = useState('generate');

  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return <VideoGenerationForm />;
      case 'history':
        return <VideoHistory />;
      default:
        return <VideoGenerationForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 ml-64">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;