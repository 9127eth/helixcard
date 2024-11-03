import React from 'react';
import Image from 'next/image';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="mb-4">
        <Image
          src="/logo.png"
          alt="Helix Logo"
          width={200}
          height={200}
          priority
        />
      </div>
      <h1 className="text-3xl mb-6">A business card that creates memorable connections.</h1>
      <p className="text-lg">
        <span className="italic">Try it free, no credit card required.</span>
      </p>
    </div>
  );
};

export default WelcomeMessage;
