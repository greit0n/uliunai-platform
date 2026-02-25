import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Props for the Button component.
 * 
 * @interface ButtonProps
 * @extends {ButtonHTMLAttributes<HTMLButtonElement>}
 * @property {'primary' | 'secondary' | 'danger' | 'outline'} [variant='primary'] - Visual style variant of the button
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size of the button
 * @property {ReactNode} children - Content to display inside the button
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

/**
 * A reusable button component with multiple variants and sizes.
 * 
 * @description Provides a consistent button style across the application with support for
 * different visual variants (primary, secondary, danger, outline) and sizes (sm, md, lg).
 * All standard HTML button attributes are supported through props spreading.
 * 
 * @param {ButtonProps} props - The button props
 * @param {'primary' | 'secondary' | 'danger' | 'outline'} [props.variant='primary'] - Button style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Button size
 * @param {ReactNode} props.children - Button content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {ButtonHTMLAttributes<HTMLButtonElement>} props.props - Standard HTML button attributes
 * @returns {JSX.Element} A styled button element
 */
export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-bold transition-all duration-300 cursor-pointer whitespace-nowrap border-2';
  
  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-lg hover:shadow-red-600/25',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border-gray-800 hover:border-gray-700',
    danger: 'bg-red-800 hover:bg-red-900 text-white border-red-800 hover:border-red-900',
    outline: 'bg-transparent hover:bg-red-600/10 text-red-500 border-red-500 hover:text-red-400 hover:border-red-400'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
