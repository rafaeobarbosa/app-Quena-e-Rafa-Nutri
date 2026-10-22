import React from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  appName?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md',
  appName = 'Nutri APP',
  subtitle = 'Gestão Nutricional',
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const parts = appName.split(' ');
  const firstWord = parts[0] || 'Nutri';
  const secondWord = parts.slice(1).join(' ') || 'APP';

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 p-2 text-white shadow-md shadow-teal-500/25">
        <Leaf className={cn(iconSizes[size], 'stroke-[2.5]')} />
      </div>
      <div className="flex flex-col text-left">
        <div className={cn('font-bold tracking-tight text-teal-950 flex items-center', textSizes[size])}>
          {firstWord}<span className="text-teal-600 ml-1 font-extrabold">{secondWord}</span>
        </div>
        {subtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-teal-600/80 -mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

