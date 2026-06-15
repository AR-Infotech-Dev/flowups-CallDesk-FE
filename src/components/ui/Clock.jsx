import React, { useEffect, useState } from "react";

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-sm w-[90px] text-justify font-bold text-blue-600">
        {time.toLocaleTimeString()}
      </div>

      <div className="text-xs w-full text-gray-500">
        {time.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", })}
      </div>
    </div>
  );
};

export default Clock;