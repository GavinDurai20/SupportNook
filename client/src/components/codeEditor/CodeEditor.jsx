import {useEffect, useRef,
  useState,
} from "react";
import socket from "../../socket";
import "./CodeEditor.css";
const LANGUAGES = [
  {
    name: "JavaScript",
    id: 63,
  },
  {
    name: "Python",
    id: 71,
  },
  {
    name: "Java",
    id: 62,
  },
  {
    name: "C",
    id: 50,
  },
  {
    name: "C++",
    id: 54,
  },
  {
    name: "C#",
    id: 51,
  },
  {
    name: "Go",
    id: 60,
  },
  {
    name: "Rust",
    id: 73,
  },
  {
    name: "PHP",
    id: 68,
  },
  {
    name: "Ruby",
    id: 72,
  },
  {
    name: "Kotlin",
    id: 78,
  },
  {
    name: "Swift",
    id: 83,
  },
  {
    name: "TypeScript",
    id: 74,
  },
  {
    name: "SQL",
    id: 82,
  },
];
const DEFAULT_CODE = {
  JavaScript:
`console.log("Hello SupportNook");`,
  Python:
`print("Hello SupportNook")`,
  Java:
`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello SupportNook");
    }
}`,
  C:
`#include <stdio.h>
int main() {
    printf("Hello SupportNook");
    return 0;
}`,
  "C++":
`#include <iostream>
using namespace std;
int main() {
    cout << "Hello SupportNook";
    return 0;
}`,
  "C#":
`using System;
class Program {
    static void Main() {
        Console.WriteLine("Hello SupportNook");
    }
}`,
  Go:
`package main
import "fmt"
func main() {
    fmt.Println("Hello SupportNook")
}`,
  Rust:
`fn main() {
    println!("Hello SupportNook");
}`,
  PHP:
`<?php
echo "Hello SupportNook";
?>`,
  Ruby:
`puts "Hello SupportNook"`,
  Kotlin:
`fun main() {
    println("Hello SupportNook")
}`,
  Swift:
`print("Hello SupportNook")`,
  TypeScript:
`console.log("Hello SupportNook");`,
  SQL:
`SELECT 'Hello SupportNook';`,
};
function CodeEditor({ room }) {
  const roomId =
    room?.roomId;
  const [language, setLanguage] =
    useState("JavaScript");
  const [code, setCode] =
    useState(
      DEFAULT_CODE.JavaScript
    );
  const [output, setOutput] =
    useState("");
  const [running, setRunning] =
    useState(false);
  const isRemoteUpdate =
    useRef(false);
  const initialized =
    useRef(false);
  // ROOM STATE
  useEffect(() => {
    if (!roomId) {
      return;
    }
    console.log(
      "💻 CODE EDITOR ACTIVE:",
      roomId
    );
    const handleRoomState =
      (state) => {
        console.log(
          "📦 CODE ROOM STATE:",
          state
        );
        isRemoteUpdate.current =
          true;
        setCode(
          state.code || ""
        );
        setLanguage(
          state.language ||
          "JavaScript"
        );
        setOutput(
          state.output || ""
        );
        setTimeout(() => {
          isRemoteUpdate.current =
            false;
          initialized.current =
            true;
        }, 0);
      };
    const handleCodeUpdate =
      (data) => {
        console.log(
          "💻 RECEIVED CODE:",
          data
        );
        isRemoteUpdate.current =
          true;
        setCode(
          data.code || ""
        );
        if (data.language) {
          setLanguage(
            data.language
          );
        }
        setTimeout(() => {
          isRemoteUpdate.current =
            false;
        }, 0);
      };
    const handleOutput =
      (data) => {
        console.log(
          "🖥️ RECEIVED OUTPUT:",
          data
        );
        setOutput(
          data.output || ""
        );
      };
    socket.on(
      "room-state",
      handleRoomState
    );
    socket.on(
      "code-update",
      handleCodeUpdate
    );
    socket.on(
      "code-output",
      handleOutput
    );
    return () => {
      socket.off(
        "room-state",
        handleRoomState
      );
      socket.off(
        "code-update",
        handleCodeUpdate
      );
      socket.off(
        "code-output",
        handleOutput
      );
    };
  }, [roomId]);
  // CODE CHANGE
  const handleCodeChange =
    (event) => {
      const newCode =
        event.target.value;
      setCode(
        newCode
      );
      if (
        isRemoteUpdate.current
      ) {
        return;
      }
      if (
        !roomId ||
        !socket.connected
      ) {
        console.warn(
          "⚠️ CODE NOT SENT - SOCKET NOT CONNECTED"
        );
        return;
      }
      console.log(
        "💻 SENDING CODE UPDATE"
      );
      socket.emit(
        "code-update",
        {
          roomId,
          code: newCode,
          language,
        }
      );
    };

  // LANGUAGE CHANGE
   const handleLanguageChange =
    (event) => {
      const newLanguage =
        event.target.value;
      setLanguage(
        newLanguage
      );
      const newCode =
        DEFAULT_CODE[newLanguage] ||
        "";
      setCode(
        newCode
      );
      if (
        !roomId ||
        !socket.connected
      ) {
        return;
      }
      socket.emit(
        "code-update",
        {
          roomId,
         code:
            newCode,
          language:
            newLanguage,
        }
      );
    };
  // RUN CODE
  const runCode =
    async () => {
      if (!code.trim()) {
        setOutput(
          "Please enter some code."
        );
        return;
      }
      if (!roomId) {
        setOutput(
          "Room is not available."
        );
        return;
      }
      setRunning(true);
      setOutput(
        "Running..."
      );
      try {
        const selectedLanguage =
          LANGUAGES.find(
            (item) =>
              item.name === language
          );
        if (!selectedLanguage) {
          throw new Error(
            "Invalid language"
          );
        }
        console.log(
          "▶ RUNNING:",
          language
        );
        const response =
          await fetch(
            "http://localhost:5000/api/judge0/run",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  code,
                  languageId:
                    selectedLanguage.id,
                  stdin: "",
                }),
            }
          );
        const result =
          await response.json();
        if (!response.ok) {
          throw new Error(
            result.error ||
            "Execution failed"
          );
        }
        let finalOutput =
          result.output || "";
        if (result.error) {
          finalOutput +=
            finalOutput
              ? `\n${result.error}`
              : result.error;
        }
        if (!finalOutput) {
          finalOutput =
            result.status ||
            "Program finished.";
        }
        setOutput(
          finalOutput
        );
        // SEND OUTPUT TO EVERYONE
        socket.emit(
          "code-output",
          {
            roomId,
            output:
              finalOutput,
          }
        );
        console.log(
          "🖥️ OUTPUT SENT:",
          finalOutput
        );
      } catch (error) {
        console.error(
          "❌ RUN ERROR:",
          error
        );
        const errorMessage =
          error.message ||
          "Could not run code";
        setOutput(
          errorMessage
        );
        if (
          socket.connected
        ) {
          socket.emit(
            "code-output",
            {
              roomId,
              output:
                errorMessage,
            }
          );
        }
      } finally {
        setRunning(false);
      }
    };
  return (
    <div className="code-editor">

      {/* ================= HEADER ================= */}

      <div className="code-editor-header">

        {/* LEFT */}
        <div className="code-editor-title">
          <strong>Code Editor</strong>
        </div>


        {/* RIGHT */}
        <div className="code-controls">

          <select
            value={language}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map((item) => (
              <option
                key={item.name}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>


          <button
            onClick={runCode}
            disabled={running}
          >
            {running ? "Running..." : "▶ Run"}
          </button>


          {/* ROOM CODE */}

          <div className="code-room">
            <span>ROOM: </span>

            <strong>
              {roomId || "------"}
            </strong>
          </div>

        </div>

      </div>


      {/* ================= CODE ================= */}

      <textarea
        value={code}
        onChange={handleCodeChange}
        spellCheck="false"
        className="code-input"
        placeholder="Write your code here..."
      />
      {/* ================= OUTPUT ================= */}
      <div className="output-panel">
        <div className="output-header">
          Output
        </div>
        <pre>
          {output || "Program output will appear here..."}
        </pre>
      </div>
    </div>
  );
}
export default CodeEditor;