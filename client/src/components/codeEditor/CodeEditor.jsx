import {
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../../socket";

import "./CodeEditor.css";


/* =====================================================
   API URL
   ===================================================== */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


/* =====================================================
   LANGUAGES
   ===================================================== */

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


/* =====================================================
   DEFAULT CODE
   ===================================================== */

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


/* =====================================================
   COMPONENT
   ===================================================== */

function CodeEditor({ room }) {

  const roomId = room?.roomId;


  /* ===================================================
     STATE
     =================================================== */

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


  /* ===================================================
     REFS
     =================================================== */

  const isRemoteUpdate =
    useRef(false);

  const initialized =
    useRef(false);


  /* ===================================================
     ROOM STATE / SOCKET LISTENERS
     =================================================== */

  useEffect(() => {

    if (!roomId) {
      return;
    }

    console.log(
      "💻 CODE EDITOR ACTIVE:",
      roomId
    );


    /* -----------------------------------------------
       ROOM STATE
       ----------------------------------------------- */

    const handleRoomState = (state) => {

      console.log(
        "📦 CODE ROOM STATE:",
        state
      );

      isRemoteUpdate.current = true;

      setCode(
        state.code ||
        DEFAULT_CODE.JavaScript
      );

      setLanguage(
        state.language ||
        "JavaScript"
      );

      setOutput(
        state.output ||
        ""
      );


      setTimeout(() => {

        isRemoteUpdate.current = false;

        initialized.current = true;

      }, 0);
    };


    /* -----------------------------------------------
       CODE UPDATE
       ----------------------------------------------- */

    const handleCodeUpdate = (data) => {

      console.log(
        "💻 RECEIVED CODE:",
        data
      );

      isRemoteUpdate.current = true;

      setCode(
        data.code || ""
      );

      if (data.language) {

        setLanguage(
          data.language
        );

      }


      setTimeout(() => {

        isRemoteUpdate.current = false;

      }, 0);
    };


    /* -----------------------------------------------
       OUTPUT UPDATE
       ----------------------------------------------- */

    const handleOutput = (data) => {

      console.log(
        "🖥️ RECEIVED OUTPUT:",
        data
      );

      setOutput(
        data.output || ""
      );
    };


    /* -----------------------------------------------
       SOCKET LISTENERS
       ----------------------------------------------- */

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


    /* -----------------------------------------------
       CLEANUP
       ----------------------------------------------- */

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


  /* ===================================================
     CODE CHANGE
     =================================================== */

  const handleCodeChange = (event) => {

    const newCode =
      event.target.value;


    setCode(
      newCode
    );


    /* Don't send remote changes back */

    if (
      isRemoteUpdate.current
    ) {
      return;
    }


    /* Make sure socket is connected */

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


  /* ===================================================
     LANGUAGE CHANGE
     =================================================== */

  const handleLanguageChange = (event) => {

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

      console.warn(
        "⚠️ LANGUAGE NOT SENT - SOCKET NOT CONNECTED"
      );

      return;
    }


    console.log(
      "🌐 LANGUAGE CHANGED:",
      newLanguage
    );


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


  /* ===================================================
     RUN CODE
     =================================================== */

  const runCode = async () => {

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


    if (!socket.connected) {

      console.warn(
        "⚠️ SOCKET IS NOT CONNECTED"
      );

    }


    setRunning(true);

    setOutput(
      "Running..."
    );


    try {

      /* ---------------------------------------------
         Find selected language
         --------------------------------------------- */

      const selectedLanguage =
        LANGUAGES.find(
          (item) =>
            item.name === language
        );


      if (!selectedLanguage) {

        throw new Error(
          "Invalid language selected."
        );

      }


      console.log(
        "================================"
      );

      console.log(
        "▶ RUNNING CODE"
      );

      console.log(
        "Language:",
        language
      );

      console.log(
        "Language ID:",
        selectedLanguage.id
      );

      console.log(
        "API:",
        `${API_URL}/api/judge0/run`
      );

      console.log(
        "================================"
      );


      /* ---------------------------------------------
         SEND CODE TO RENDER BACKEND
         --------------------------------------------- */

      const response =
        await fetch(
          `${API_URL}/api/judge0/run`,
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


      /* ---------------------------------------------
         Read response
         --------------------------------------------- */

      const result =
        await response.json();


      console.log(
        "🟢 JUDGE0 RESPONSE:",
        result
      );


      /* ---------------------------------------------
         Backend error
         --------------------------------------------- */

      if (!response.ok) {

        throw new Error(
          result.error ||
          result.message ||
          "Execution failed."
        );

      }


      /* ---------------------------------------------
         Build output
         --------------------------------------------- */

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


      /* ---------------------------------------------
         Show output locally
         --------------------------------------------- */

      setOutput(
        finalOutput
      );


      /* ---------------------------------------------
         Send output to other users
         --------------------------------------------- */

      if (socket.connected) {

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

      }

    } catch (error) {

      console.error(
        "❌ RUN ERROR:",
        error
      );


      let errorMessage =
        error.message ||
        "Could not run code.";


      /* ---------------------------------------------
         Better network error message
         --------------------------------------------- */

      if (
        error.name ===
        "TypeError"
      ) {

        errorMessage =
          "Failed to connect to the server. Please check the Render backend.";

      }


      setOutput(
        errorMessage
      );


      /* ---------------------------------------------
         Sync error with room
         --------------------------------------------- */

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


  /* ===================================================
     UI
     =================================================== */

  return (

    <div className="code-editor">


      {/* =================================================
          HEADER
          ================================================= */}

      <div className="code-editor-header">


        {/* LEFT */}

        <div className="code-editor-title">

          <strong>
            Code Editor
          </strong>

        </div>


        {/* RIGHT */}

        <div className="code-controls">


          {/* LANGUAGE */}

          <select
            value={language}
            onChange={
              handleLanguageChange
            }
          >

            {LANGUAGES.map(
              (item) => (

                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name}
                </option>

              )
            )}

          </select>


          {/* RUN */}

          <button
            onClick={runCode}
            disabled={running}
          >

            {running
              ? "Running..."
              : "▶ Run"}

          </button>


          {/* ROOM */}

          <div className="code-room">

            <span>
              ROOM:
            </span>

            <strong>
              {roomId || "------"}
            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          CODE INPUT
          ================================================= */}

      <textarea
        value={code}
        onChange={
          handleCodeChange
        }
        spellCheck="false"
        className="code-input"
        placeholder="Write your code here..."
      />


      {/* =================================================
          OUTPUT
          ================================================= */}

      <div className="output-panel">

        <div className="output-header">
          Output
        </div>

        <pre>
          {output ||
            "Program output will appear here..."}
        </pre>

      </div>

    </div>

  );

}


export default CodeEditor;