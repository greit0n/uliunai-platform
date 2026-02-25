import { ReactNode } from 'react';

/**
 * Props for the Card component.
 * 
 * @interface CardProps
 * @property {ReactNode} children - Content to display inside the card
 * @property {string} [className] - Additional CSS classes to apply
 * @property {'default' | 'dark' | 'blood'} [variant='default'] - Visual style variant of the card
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'blood';
}

/**
 * A reusable card component with multiple visual variants.
 * 
 * @description Provides a consistent card container with backdrop blur and shadow effects.
 * Supports three variants: default (gray), dark (black with red accents), and blood (red gradient).
 * 
 * @param {CardProps} props - The card props
 * @param {ReactNode} props.children - Card content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {'default' | 'dark' | 'blood'} [props.variant='default'] - Card style variant
 * @returns {JSX.Element} A styled card container element
 */
export default function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantClasses = {
    default: 'bg-gray-900/80 border-gray-700',
    dark: 'bg-black/60 border-red-900/30',
    blood: 'bg-gradient-to-br from-red-950/40 to-black/60 border-red-800/40'
  };
  
  return (
    <div className={`backdrop-blur-sm border rounded-lg p-6 shadow-2xl ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
