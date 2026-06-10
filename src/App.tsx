import React from "react";
import { PygameSimulator } from "./components/PygameSimulator";
import { defaultConfig } from "./pygameCodeTemplate";

export default function App() {
  return (
    <div 
      id="app-root" 
      className="min-h-screen w-full bg-[#090b11] text-gray-100 flex flex-col items-center justify-center relative overflow-hidden select-none font-sans"
    >
      {/* Immersive ambient cosmic background backdrop with glowing dust circles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2ec4b6]/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8b5cf6]/10 rounded-full blur-[120px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-[#f59e0b]/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Game Frame Wrapper */}
      <main className="relative z-10 w-full max-w-md h-full flex flex-col items-center p-4">
        <PygameSimulator config={defaultConfig} />
      </main>
    </div>
  );
}
