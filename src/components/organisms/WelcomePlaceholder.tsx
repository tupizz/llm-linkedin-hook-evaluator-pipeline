import React from 'react';
import { Search } from 'lucide-react';

export const WelcomePlaceholder: React.FC = () => {
  return (
    <div className="mt-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
        <Search size={40} className="text-blue-400" />
      </div>
      <h3 className="text-2xl font-medium text-white mb-4">
        Ready to Generate Compelling Hooks
      </h3>
      <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
        Configure your LinkedIn post parameters above and let our AI models
        create powerful hooks that grab attention and drive engagement.
      </p>
    </div>
  );
};