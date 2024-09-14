import React from 'react';

const WelcomeMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-6xl font-bold mb-4 text-black">helix.</h1>
      <p className="text-xl text-black">Creating memorable connections.</p>
    </div>
  );
};

export default WelcomeMessage;
