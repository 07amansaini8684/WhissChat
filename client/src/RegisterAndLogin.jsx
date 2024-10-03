import React, { useContext, useState } from "react";
import axios from "axios"; // Don't forget to import axios
import { UserContext } from "./UserContext";

const RegisterAndLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("login");
  const { setNewUserUsername, setId } = useContext(UserContext);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = isLoginOrRegister === 'register' ? 'register' : "login"
      const { data } = await axios.post(url, { username, password });
      setNewUserUsername(username);
      setId(data.id);
      console.log(data.id);
      console.log("Registration successful");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }

  return (
    <div className="bg-zinc-900 h-screen w-full p-1 flex items-center justify-center">
      <form
        className="flex flex-col gap-3 p-4 w-1/3 min-w-96 m-auto text-zinc-200"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 outline-none bg-zinc-800 rounded-md"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 outline-none bg-zinc-800 rounded-md"
        />
        <button
          type="submit"
          className="w-full px-4 py-3 outline-none bg-green-700 rounded-md font-semibold text-lg"
        >
          {isLoginOrRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-3">
          {isLoginOrRegister === "register" && (
            <div>
              Already a member?
              <button className="font-semibold text-lg" onClick={() => setIsLoginOrRegister("login")}>
                LogIn
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
                 <div>
                 Don't have an account?
                 <button className="font-semibold text-lg" onClick={() => setIsLoginOrRegister("register")}>
                    Register
                 </button>
               </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterAndLogin;
