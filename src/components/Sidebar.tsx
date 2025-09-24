import React from 'react';
import { Video, History, Settings, Home, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'generate', icon: Video, label: 'Generate' },
    { id: 'history', icon: History, label: 'History' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 z-10">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">VideoGen AI</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Creation Tools Section */}
      <div className="p-4 mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Creation Tools
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 px-4 py-3 text-gray-500 cursor-not-allowed">
            <Video className="w-5 h-5" />
            <span className="font-medium">Text to Video</span>
            <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};