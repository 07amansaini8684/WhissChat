import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { uniqBy } from "lodash";
import { UserContext } from "./UserContext";
import { nanoid } from "nanoid";
import axios from "axios";
import Peoples from "./peoples";

export function Chat() {
  // const {}

  const [ws, setWs] = useState(null);

  /// reconnet after the disconnection
  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      console.log("disconnected");
      setTimeout(() => {
        console.log("disconnected, Trying.... ");
        connectToWs();
      }, 1000);
    });
  }
  useEffect(() => {
    connectToWs();
  }, []);

  const [onlinePeople, setOnlinePeople] = useState({});
  // now displaying the message on the screen
  const [displayMessages, setDisplayMessages] = useState([]);
  const scrollTheMssgBox = useRef();
  // showing people who is online
  function showOnlinePeople(pepleArray) {
    // console.log(pepleArray)
    const people = {};
    pepleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    // console.log(people)
    setOnlinePeople(people);
  }
  // handling the data mssgs
  function handleMessage(evennt) {
    // console.log("fullevent",evennt)
    // console.log(evennt)
    // console.log( "User,")
    const messageData = JSON.parse(evennt.data);
    // console.log("Incomming data",messageData) it contains the people list because we are sending the list of people here
    // console.log(evennt.data.userId)
    // console.log(messageData)
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
      // console.log(messageData.online);
    } else if ("text" in messageData) {
      console.log({ messageData });
      if (messageData.sender === selectedUserId) {
        setDisplayMessages((prev) => [...prev, { ...messageData }]);
       
      }
    }
  }
  console.log("can we find the sendernam",displayMessages)
  // removing Our id form the whole people id
  const { newUserUsername, id, setNewUserUsername, setId } =
    useContext(UserContext);
  // console.log("Username", newUserUsername);
  const onlinePeopleExcleOurUser = { ...onlinePeople };
  delete onlinePeopleExcleOurUser[id];

  // for selecting the user
  const [selectedUserId, setselectedUserId] = useState(null);

  function selectChatPerosn(userId) {
    setselectedUserId(userId);
    // console.log(userId)
  }

  // for creating chat
  const [newChatMessage, setNewChatMessage] = useState("");
  // sending the messgs
  function sendingMessage(e, file = null) {
    if (e) e.preventDefault();

    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newChatMessage,
        file,
      })
    );
    setNewChatMessage("");
    setDisplayMessages((prev) => [
      ...prev,
      {
        text: newChatMessage,
        sender: id,
        recipient: selectedUserId,
        _id: nanoid(), // Generate unique ID for the message
      },
    ]);
    if (file) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        console.log(res.data);
        setDisplayMessages((prev) => [...prev, ...res.data]);
      });
    }
  }
  /// uploading the files
  function sendFiles(event) {
    const files = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      sendingMessage(null, {
        name: event.target.files[0].name,
        fileData: reader.result,
      });
    };
  }

  // make the div scrool when we send the mssg

  useEffect(() => {
    // console.log("use effect");
    const div = scrollTheMssgBox.current;
    // console.log(div)
    if (div) {
      div.scrollIntoView({ behaviour: "smooth", black: "end" });
    }
  }, [displayMessages]);

  // storing the mssg
  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        // console.log(res.data);
        setDisplayMessages((prev) => [...prev, ...res.data]);
      });
    }
  }, [selectedUserId]);

  // / getting rid of the duplicate messages
  

  const messageWithoutDupes = uniqBy(displayMessages, "_id");
  // console.log(messageWithoutDupes);

  // console.log("onlinePeopleData", onlinePeople)
  /// setting online and offline indicator part
  const [offlinePeople, setOfflinePeople] = useState([]);
  useEffect(() => {
    axios.get("/people").then((res) => {
      // console.log("all people form the data base ",res.data)
      const allOfflinePeopleArray = res.data
        .filter((person) => person._id !== id)
        .filter((Person) => !Object.keys(onlinePeople).includes(Person._id));
      // console.log("thePeoplewhoIsOffiline",allOfflinePeople)
      const allOfflinePeople = {};
      allOfflinePeopleArray.forEach((person) => {
        allOfflinePeople[person._id] = person.username;
      });
      setOfflinePeople(allOfflinePeople);
      // console.log("shouldObject",allOfflinePeople)
      // console.log("shouldArray",allOfflinePeopleArray)
    });
  }, [onlinePeople]);

  // console.log("offillllnepeople",offlinePeople)

  /// writing to logout
  const handleLogout = () => {
    axios.post("/logout").then((res) => {
      setWs(null);
      setId(null);
      setNewUserUsername(null);
    });
  };

  // console.log(messageWithoutDupes)

  return (
    <div className="chat flex h-screen ">
      <div className="bg-zinc-800 w-1/3 text-zinc-300 flex flex-col gap-3 p-4 justify-between">
        <div>
          <div className="font-bold  text-3xl text-right text-green-600 flex items-center gap-2 ">
            WhissChat{" "}
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                />
              </svg>
            </span>
          </div>
          <div>
            <h1 className="text-xl mt-2 mb-3 font-semibold text-right">
              People
            </h1>
            {Object.keys(onlinePeopleExcleOurUser).map((userId, index) => (
              <Peoples
                key={userId}
                userId={userId}
                online={true}
                selectChatPerosn={selectChatPerosn}
                selectedUserId={selectedUserId}
                username={onlinePeopleExcleOurUser[userId]}
              />
            ))}
            {Object.keys(offlinePeople).map((userId) => (
              <Peoples
                key={userId}
                userId={userId}
                online={false}
                selectChatPerosn={selectChatPerosn}
                selectedUserId={selectedUserId}
                username={offlinePeople[userId]}
              />
            ))}
          </div>
        </div>
        <div className="profile w-full rounded-md  px-4 py-2">
          <div className="bg-zinc-700 rounded-t-md text-end  py-2 px-4 ">
            Your Profile ):
          </div>
          <div className="text-lg  bg-zinc-700 rounded-b-md px-4  p-2 font-semibold text-right flex items-center justify-end gap-1">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            {newUserUsername}
          </div>
          <div className="mt-2 bg-zinc-700 flex items-center gap-2 rounded-md p-2 ">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white font-semibold bg-red-700 rounded-sm hover:bg-red-800"
            >
              LogOut
            </button>
            IF you want to
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 relatvie flex flex-col gap-5 relative w-2/3 p-4 text-zinc-200">
        <div className="flex-grow overflow-x-hidden overflow-y-scroll">
          {!selectedUserId && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-[3vw] text-zinc-600 font-semibold p-2">
                Send mssg to...{" "}
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="pr-4">
              {messageWithoutDupes.map((message, index) => (
                <div key={index}>
                  <div
                    className={`font-semibold  mt-6 text-zinc-400  ${
                      message.sender === id ? "text-right" : "text-left"
                    }`}
                  >
                    <div>
                      {message.sender === id
                        ? `${newUserUsername}`
                        : `${message.senderUsername }`}{""}
                      :
                    </div>

                      <div
                        className={` ${
                          message.sender === id
                            ? "py-3 px-3 bg-zinc-800 inline-block rounded-md text-lg font-semibold text-zinc-200  mt-2 "
                            : " text-lg font-semibold text-zinc-200 mt-2 bg-green-700 inline-block px-3 py-2 rounded-md"
                        }`}
                      >
                        <div>
                          {message.text}
                        </div>
                        
                        {message.file && (
                          <div className="flex flex-col gap-2 justify-center">
                            <a
                              className="underline flex items-center gap-2"
                              target="_blank"
                              href={
                                axios.defaults.baseURL +
                                "/uploads/" +
                                message.file
                              }
                            >
                              <span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="size-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5"
                                  />
                                </svg>
                              </span>
                              {message.file}
                            </a>
                            <div>
                              <img
                                className="rounded-sm max-h-72"
                                src={
                                  axios.defaults.baseURL +
                                  "/uploads/" +
                                  message.file
                                }
                                alt=""
                              />
                            </div>
                          </div>
                        )}
                      </div>
                
                  </div>
                </div>
              ))}
              <div ref={scrollTheMssgBox} className="refWalaDiv"></div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form
            className="w-full flex items-center gap-3 justify-center"
            onSubmit={sendingMessage}
          >
            <input
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              type="text"
              placeholder="Message..."
              className="w-full px-4 py-3 outline-none bg-zinc-800 rounded-md text-lg font-semibold"
            />
            <div className="flex items-center justify-center gap-2">
              <label className="flex items-center justify-center px-3 py-3 outline-none bg-green-700 rounded-md font-bold text-lg cursor-pointer">
                <input type="file" hidden className="" onChange={sendFiles} />
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </span>
              </label>
              <button
                className="flex items-center justify-center gap-2 w-40 px-4 py-3 outline-none bg-green-700 rounded-md font-bold text-lg"
                type="submit"
              >
                Send{" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
