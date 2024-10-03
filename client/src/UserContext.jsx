import { createContext, useEffect, useState } from "react";
import axios from "axios";
export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [newUserUsername, setNewUserUsername] = useState(null);
  const [id, setId] = useState(null);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/profile");
        // console.log("this is ",response)
        setNewUserUsername(response.data.userdata.username)
        setId(response.data.userdata.id)
        console.log(response.data.userdata)
        // console.log(response.data.userdata.id)
        // console.log(response.data.userdata.username)
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <UserContext.Provider
      value={{ newUserUsername, setNewUserUsername, id, setId }}
    >
      {children}
    </UserContext.Provider>
  );
}
