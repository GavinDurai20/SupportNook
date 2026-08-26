const JUDGE0_URL =
  process.env.JUDGE0_URL ||
  "https://ce.judge0.com";


// =====================================================
// GET LANGUAGES
// =====================================================

const getLanguages = async (req, res) => {

  try {

    const response =
      await fetch(
        `${JUDGE0_URL}/languages/`
      );


    const data =
      await response.json();


    if (!response.ok) {

      return res.status(
        response.status
      ).json({

        success: false,

        message:
          "Could not load languages.",

        error:
          data,

      });

    }


    res.json({

      success: true,

      languages:
        data,

    });


  } catch (error) {

    console.error(
      "❌ Language error:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to load languages.",

      error:
        error.message,

    });

  }

};


// =====================================================
// RUN CODE
// =====================================================

const runCode = async (req, res) => {

  try {

    const {
      roomId,
      sourceCode,
      languageId,
      stdin,
    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!sourceCode?.trim()) {

      return res.status(400).json({

        success: false,

        message:
          "Code cannot be empty.",

      });

    }


    if (!languageId) {

      return res.status(400).json({

        success: false,

        message:
          "Language ID is required.",

      });

    }


    console.log("");
    console.log(
      "================================="
    );

    console.log(
      "🚀 RUNNING CODE"
    );

    console.log(
      "Room:",
      roomId
    );

    console.log(
      "Language ID:",
      languageId
    );

    console.log(
      "================================="
    );


    // -------------------------------------------------
    // CREATE SUBMISSION
    // -------------------------------------------------

    const submitResponse =
      await fetch(
        `${JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`,
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({

              source_code:
                sourceCode,

              language_id:
                Number(languageId),

              stdin:
                stdin || "",

            }),

        }
      );


    const submitData =
      await submitResponse.json();


    if (!submitResponse.ok) {

      console.error(
        "Judge0 submit error:",
        submitData
      );


      return res.status(
        submitResponse.status
      ).json({

        success: false,

        message:
          submitData.error ||
          "Judge0 rejected the code.",

        error:
          submitData,

      });

    }


    const token =
      submitData.token;


    if (!token) {

      return res.status(500).json({

        success: false,

        message:
          "Judge0 did not return a token.",

      });

    }


    // -------------------------------------------------
    // WAIT FOR RESULT
    // -------------------------------------------------

    let result = null;


    for (
      let attempt = 0;
      attempt < 30;
      attempt++
    ) {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );


      const resultResponse =
        await fetch(
          `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
        );


      const resultData =
        await resultResponse.json();


      if (!resultResponse.ok) {
        continue;
      }


      console.log(
        "Judge0:",
        resultData.status
      );


      if (
        resultData.status?.id > 2
      ) {

        result =
          resultData;

        break;

      }

    }


    // -------------------------------------------------
    // TIMEOUT
    // -------------------------------------------------

    if (!result) {

      result = {

        stdout: "",

        stderr:
          "Execution timed out.",

        compile_output: "",

        message: "",

        status: {

          id: 5,

          description:
            "Time Limit Exceeded",

        },

      };

    }


    // -------------------------------------------------
    // BUILD OUTPUT
    // -------------------------------------------------

    let output = "";


    if (result.stdout) {

      output +=
        result.stdout;

    }


    if (result.stderr) {

      if (output) {
        output += "\n";
      }

      output +=
        result.stderr;

    }


    if (result.compile_output) {

      if (output) {
        output += "\n";
      }

      output +=
        result.compile_output;

    }


    if (result.message) {

      if (output) {
        output += "\n";
      }

      output +=
        result.message;

    }


    if (!output) {

      if (
        result.status?.id === 3
      ) {

        output =
          "Program finished successfully with no output.";

      } else {

        output =
          result.status?.description ||
          "Program finished.";

      }

    }


    const executionResult = {

      output,

      status:
        result.status?.description ||
        "Unknown",

      statusId:
        result.status?.id ||
        null,

      stdout:
        result.stdout || "",

      stderr:
        result.stderr || "",

      compileOutput:
        result.compile_output || "",

      time:
        result.time || null,

      memory:
        result.memory || null,

    };


    console.log("");
    console.log(
      "================================="
    );

    console.log(
      "✅ EXECUTION COMPLETE"
    );

    console.log(
      "Status:",
      executionResult.status
    );

    console.log(
      "Output:",
      executionResult.output
    );

    console.log(
      "================================="
    );


    // -------------------------------------------------
    // BROADCAST OUTPUT
    // -------------------------------------------------

    const io =
      req.app.get("io");


    if (
      io &&
      roomId
    ) {

      io.to(
        roomId
      ).emit(
        "code-output",
        executionResult
      );


      console.log(
        `📡 Output sent to room ${roomId}`
      );

    }


    // -------------------------------------------------
    // HTTP RESPONSE
    // -------------------------------------------------

    return res.json({

      success: true,

      result:
        executionResult,

    });


  } catch (error) {

    console.error(
      "❌ Execution error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Code execution failed.",

      error:
        error.message,

    });

  }

};


module.exports = {
  getLanguages,
  runCode,
};