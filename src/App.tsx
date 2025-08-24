import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "@/components/ui/button"

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
  <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Welcome to Tauri + React
      </h1>

      <div className="flex justify-center items-center space-x-8 mb-8">
        <a href="https://vite.dev" target="_blank" className="transform hover:scale-110 transition-transform duration-200">
          <img src="/vite.svg" className="w-16 h-16 drop-shadow-lg" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" className="transform hover:scale-110 transition-transform duration-200">
          <img src="/tauri.svg" className="w-16 h-16 drop-shadow-lg" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="transform hover:scale-110 transition-transform duration-200">
          <img src={reactLogo} className="w-16 h-16 drop-shadow-lg" alt="React logo" />
        </a>
      </div>
      
      <p className="text-gray-600 text-center mb-8">
        Click on the Tauri, Vite, and React logos to learn more.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        <Button onClick={greet} className="w-full">
          Greet
        </Button>

      </form>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-center text-gray-700 break-words">{greetMsg}</p>
      </div>
    </div>
  </main>
);

}

export default App;
