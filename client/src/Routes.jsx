import { useContext } from "react";
import RegisterAndLogin from "./RegisterAndLogin";
import { UserContext } from "./UserContext";
import { Chat } from "./Chat";

export default function Routes(){
    const {newUserUsername, id} = useContext(UserContext)
    if(newUserUsername){
        return <Chat/>
    }

    return (
        <RegisterAndLogin/>
    )
}