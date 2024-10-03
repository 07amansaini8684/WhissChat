import Avatar from "./Avatar";

export default function Peoples({userId,selectChatPerosn,selectedUserId,username,online, index}) {
    // console.log("username in the people", username)
  return (
    <div 
      onClick={() => selectChatPerosn(userId)}
      className={`px-3 py-3 mt-2 rounded-2xl font-semibold text-xl bg-zinc-900 hover:bg-black flex items-center gap-3 cursor-pointer ${
        userId === selectedUserId ? "bg-gray-950" : ""
      }`}
      key={index}
    >
      <Avatar online={online} username={username ? username : null} userId={userId} />
      <div>
        {username}
       {online ? (
         <div className="text-sm text-zinc-400">Active</div>
       ):(
        <div className="text-sm text-zinc-400">Offline</div>
       )}
      </div>
    </div>
  );
}
