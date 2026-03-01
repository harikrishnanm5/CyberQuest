import React from 'react';
import { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <div className="group relative p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent hover:border-cyber-primary/50 transition-all duration-300 overflow-hidden shadow-sm dark:shadow-none hover:shadow-lg">
      {/* Hover Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-primary to-cyber-secondary opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
          style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
        >
          {feature.icon}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono group-hover:text-cyber-primary transition-colors">
          {feature.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {feature.description}
        </p>
        
        <div className="mt-auto pt-4 flex items-center text-xs font-mono text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
          <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
          ACTIVE MODULE
        </div>
      </div>
    </div>
  );
};