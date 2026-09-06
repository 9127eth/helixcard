'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

interface RegisterFormProps {
  onSuccess: () => void;
}

const inputClassName =
  'w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white';

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggleVisibility,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password complexity
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await signUp(email, password);
      onSuccess();
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create an account. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Email"
          required
        />
      </div>
      <div className="mb-4">
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
        />
      </div>
      <div className="mb-4">
        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm password"
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
        />
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <input type="checkbox" className="form-checkbox" required />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            I agree to the <Link href="/terms-of-service" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Terms of Service</Link> and <Link href="/privacy-policy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Privacy Policy</Link>
          </span>
        </label>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-800 bg-[#7CCEDA] hover:bg-[#6bb9c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7CCEDA] transition-colors"
      >
        Sign up
      </button>
    </form>
  );
};
