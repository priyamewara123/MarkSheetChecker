import { useState } from "react";
import toast from "react-hot-toast";
import mockResponse from "./data/data.json";

interface AnyObj {
  [key: string]: any;
}

export default function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<AnyObj | null>(null);
  const [databaseData, setDatabaseData] = useState<AnyObj | null>(null);
  const [filterMode, setFilterMode] = useState<"none" | "matched" | "unmatched">("none");


  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(URL.createObjectURL(file));
    toast.success("Marksheet Uploaded!");

    console.log("Payload →", { image: file.name });

    const response = { data: mockResponse };
    setScannedData(response.data.scannedData);
    setDatabaseData(response.data.databaseData);
  };
  const RenderSection = ({
    left,
    right,
  }: {
    left: AnyObj;
    right: AnyObj;
  }) => {
    const keys = Object.keys(left);

    // Apply FILTER based on selected mode
    const filteredKeys = keys.filter((key) => {
      const match = left[key] === right[key];

      if (filterMode === "matched") return match;
      if (filterMode === "unmatched") return !match;
      return true; // none
    });

    return (
      <div className="flex gap-4 mt-4 justify-center">
        {/* LEFT */}
        <div className="w-1/2 bg-white border rounded-lg shadow-sm p-3">
          <h2 className="text-sm font-semibold mb-2 border-b pb-1 text-gray-700">
            Scanned
          </h2>

          <div className="flex flex-col gap-1.5">
            {filteredKeys.map((key) => {
              const match = left[key] === right[key];

              return (
                <div
                  key={key}
                  className={`text-xs py-1.5 px-2 rounded-md flex justify-between border 
                  ${match
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    }
                `}
                >
                  <span className="font-medium text-gray-700">{key}</span>
                  <span
                    className={`font-semibold ${match ? "text-green-700" : "text-red-700"
                      }`}
                  >
                    {left[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ARROWS */}
        <div className="w-[40px] flex flex-col items-center gap-2 pt-10">
          {filteredKeys.map((key) => {
            const match = left[key] === right[key];
            return (
              <div
                key={key}
                className={`font-bold text-xl ${match ? "text-green-500" : "text-red-500"
                  }`}
              >
                ➜
              </div>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="w-1/2 bg-white border rounded-lg shadow-sm p-3">
          <h2 className="text-sm font-semibold mb-2 border-b pb-1 text-gray-700">
            Database
          </h2>

          <div className="flex flex-col gap-1.5">
            {filteredKeys.map((key) => {
              const match = left[key] === right[key];

              return (
                <div
                  key={key}
                  className={`text-xs py-1.5 px-2 rounded-md flex justify-between border 
                  ${match
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    }
                `}
                >
                  <span className="font-medium text-gray-700">{key}</span>
                  <span
                    className={`font-semibold ${match ? "text-green-700" : "text-red-700"
                      }`}
                  >
                    {right[key]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="p-6 max-w-5xl mx-auto flex justify-center flex-col">
      <h1 className="text-xl font-bold text-center mb-4">
        Marksheet Verification (Diff View)
      </h1>

      {/* Upload */}
      <label className="block border-2 border-dashed p-4 text-center cursor-pointer rounded-lg hover:bg-gray-100 text-sm">
        <p className="text-gray-600">Upload Marksheet Image</p>
        <input type="file" className="hidden" onChange={handleUpload} />
      </label>
      <div className="flex justify-center mt-6">
        <div className="flex overflow-hidden bg-white border shadow rounded-lg">

          {/* ALL */}
          <button
            onClick={() => setFilterMode("none")}
            style={{ outline: "none", boxShadow: "none" }}
            className={`px-5 py-2 text-sm font-semibold transition-all duration-300F
                        text-gray-700 outline-none focus:outline-none focus:ring-0
                        ${filterMode === "none" ? "bg-gray-300" : "bg-gray-100 hover:bg-gray-200"}
                     `}
              >
            All
          </button>

          <button
            onClick={() => setFilterMode("matched")}
            style={{ outline: "none", boxShadow: "none" }}
            className={`
    px-5 py-2 text-sm font-semibold transition-all duration-300
    text-green-700 outline-none focus:outline-none focus:ring-0
    ${filterMode === "matched" ? "bg-green-300" : "bg-green-100 hover:bg-green-200"}
  `}
          >
            Matched
          </button>

          <button
            onClick={() => setFilterMode("unmatched")}
            style={{ outline: "none", boxShadow: "none" }}
            className={`
    px-5 py-2 text-sm font-semibold transition-all duration-300
    text-red-700 outline-none focus:outline-none focus:ring-0
    ${filterMode === "unmatched" ? "bg-red-300" : "bg-red-100 hover:bg-red-200"}
  `}
          >
            Unmatched
          </button>
        </div>
      </div>

      {uploadedImage && (
        <img
          src={uploadedImage}
          className="w-full mt-4 rounded shadow-sm"
          alt=""
        />
      )}

      {scannedData && databaseData && (
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-4xl">

            {/* Student Info */}
            <h2 className="text-lg font-semibold mb-2">Student Info</h2>
            <RenderSection
              left={scannedData.studentInfo}
              right={databaseData.studentInfo}
            />

            {/* Subjects */}
            <h2 className="text-lg font-semibold mt-6 mb-2">Subjects</h2>
            {scannedData.subjects.map((sub: AnyObj, i: number) => (
              <div key={i} className="mb-4 border rounded-lg p-3">
                <h3 className="text-sm font-bold mb-2">{sub.name}</h3>
                <RenderSection left={sub} right={databaseData.subjects[i]} />
              </div>
            ))}

            {/* Result */}
            <h2 className="text-lg font-semibold mt-6 mb-2">Result Summary</h2>
            <RenderSection
              left={scannedData.result}
              right={databaseData.result}
            />

          </div>
        </div>
      )}
    </div>
  );
}
