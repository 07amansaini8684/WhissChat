import { useState } from "react";
import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = "http://localhost:4000";
  axios.defaults.withCredentials = true;
 

  return (
    <div className="bg-zinc-900 w-full h-full">
      <UserContextProvider>
        <Routes/>
      </UserContextProvider>
    </div>
  );
}

export default App;
