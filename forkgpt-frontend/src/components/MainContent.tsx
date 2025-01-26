import React from "react";

interface MainContentProps {
  children?: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        {children || (
          <>
            <h2 className="text-lg font-semibold mb-4">Welcome to ForkGPT</h2>
            <p>Select a thread to start chatting or create a new one.</p>
          </>
        )}
      </div>
    </main>
  );
};

export default MainContent;
