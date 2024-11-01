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
      <h1 className="text-3xl text-black mb-6">Helping people create memorable connections.</h1>
      <h5 className="text-1xl font-semibold mb-4 text-black">
        Empower your personal brand with customizable digital business cards.
      </h5>
      <p className="text-lg text-black">
        <span className="italic">Try it free, no credit card required.</span>
      </p>
    </div>
  );
};

export default WelcomeMessage;
