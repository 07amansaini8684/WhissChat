import { useEffect, useState } from "react";

export default function Avatar({ userId, username, online }) {
  const [bgColor, setBgColor] = useState("");

  function getDarkerColor() {
    // Limit the color range to avoid lighter shades
    const minColorValue = 0x000000; // Black
    const maxColorValue = 0x888888; // Mid-tone (avoids very light colors)
  
    // Generate a random number between the specified range for darker colors
    const randomColorValue = Math.floor(Math.random() * (maxColorValue - minColorValue)) + minColorValue;
  
    // Convert the number to hex and pad it if necessary
    return "#" + randomColorValue.toString(16).padStart(6, '0');
  }
  
  useEffect(() => {
    // Check if there's a stored color in localStorage
    const storedColor = localStorage.getItem(`avatarColor_${userId}`);
    if (storedColor) {
      setBgColor(storedColor); // Use the stored color if it exists
    } else {
      const newColor = getDarkerColor();
      setBgColor(newColor);
      localStorage.setItem(`avatarColor_${userId}`, newColor); // Store the new color
    }
  }, [userId]); // Use userId to create a unique key for localStorage
  

  // console.log(username, userId, online)
  return (
    <div
      className="w-12 relative h-12 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: bgColor }} // Set random color as background
    >
      <p className="text-white text-lg uppercase">{username.charAt(0)}</p>
     {!online ? (
       <div className="w-3 h-3 rounded-[3px] absolute right-0 bottom-0 bg-zinc-400 border-l-2 border-t-2"></div>
     ):(
      <div className="w-3 h-3 rounded-[3px] absolute right-0 bottom-0 bg-green-600 border-l-2 border-t-2"></div>
     )}
   
    </div>
  );
}
