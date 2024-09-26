import React from 'react';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold mb-4 text-black">Helix.</h1>
      <h1 className="text-5xl text-black mb-6">Helping people create memorable connections.</h1>
      <h5 className="text-1xl font-semibold mb-4 text-black">
        Empower your personal brand with customizable digital business cards. Seamlessly share your contact information, CV/Resume, and social links.
      </h5>
      <p className="text-lg text-black">
        <span className="italic">Try it free, no credit card required.</span>
      </p>
    </div>
  );
};

export default WelcomeMessage;
