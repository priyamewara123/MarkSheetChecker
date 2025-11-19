import { useState } from "react";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ScanLine,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [databaseData, setDatabaseData] = useState(null);
  const [filterMode, setFilterMode] = useState("none");
  const [isUploading, setIsUploading] = useState(false);

  // const notify = (msg) => alert(msg);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImage(URL.createObjectURL(file));
    setIsUploading(true);
    setScannedData(null);
    setDatabaseData(null);

    const formData = new FormData();
    formData.append("marksheetImage", file);

    try {
      const res = await fetch("http://localhost:3000/api/verify-marksheet", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setScannedData(data.scannedData);
      setDatabaseData(data.databaseData);
      toast.success("Verification complete!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Helpers
  const isEmpty = (v) =>
    v === null || v === undefined || v === "" || String(v).trim() === "";

  // =====================================================================
  // ROW COMPONENT FIXED
  // =====================================================================
  const RenderRow = ({ label, leftVal, rightVal }) => {
    // custom match logic
    const match = (() => {
      if (isEmpty(leftVal) && isEmpty(rightVal)) return true; // ignore null-null
      if (isEmpty(leftVal) && !isEmpty(rightVal)) return false;
      if (!isEmpty(leftVal) && isEmpty(rightVal)) return false;
      return String(leftVal).trim() === String(rightVal).trim();
    })();

    // Hide null rows in UNMATCHED mode
    if (filterMode === "unmatched" && (isEmpty(leftVal) && isEmpty(rightVal))) {
      return null;
    }

    // Hide matched rows in unmatched mode
    if (filterMode === "matched" && !match) return null;
    if (filterMode === "unmatched" && match) return null;

    return (
      <div className="flex border-b last:border-none hover:bg-gray-50 transition-all">
        <div className="flex-1 p-4 border-r bg-gray-50/40">
          <div className="text-xs text-gray-500 uppercase">{label}</div>
          <div
            className={
              match ? "text-black font-medium" : "text-red-600 font-medium"
            }
          >
            {leftVal}
          </div>
        </div>

        <div className="w-14 flex items-center justify-center">
          {match ? (
            <CheckCircle2 className="text-green-600 w-6 h-6" />
          ) : (
            <XCircle className="text-red-600 w-6 h-6 animate-pulse" />
          )}
        </div>

        <div className="flex-1 p-4 border-l text-right bg-gray-50/40">
          <div className="text-xs text-gray-500 uppercase">Database</div>
          <div
            className={
              match ? "text-black font-medium" : "text-green-700 font-semibold"
            }
          >
            {rightVal}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================================
  // SECTION COMPONENT
  // =====================================================================
  const RenderSection = ({ title, leftData, rightData }) => {
    if (!leftData) return null;
    const keys = Object.keys(leftData);

    // If all rows filtered out → hide section
    const anyVisible = keys.some((k) => {
      const L = leftData[k];
      const R = rightData[k];

      const m = (() => {
        if (isEmpty(L) && isEmpty(R)) return true;
        if (isEmpty(L) && !isEmpty(R)) return false;
        if (!isEmpty(L) && isEmpty(R)) return false;
        return String(L).trim() === String(R).trim();
      })();

      if (filterMode === "matched" && !m) return false;
      if (filterMode === "unmatched" && m) return false;
      if (filterMode === "unmatched" && (isEmpty(L) && isEmpty(R)))
        return false;

      return true;
    });

    if (!anyVisible) return null;

    return (
      <div className="border rounded-xl bg-white shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>

        {keys.map((k) => (
          <RenderRow key={k} label={k} leftVal={leftData[k]} rightVal={rightData[k]} />
        ))}
      </div>
    );
  };

  // =====================================================================
  // UI STARTS HERE
  // =====================================================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow">
            <ScanLine className="text-white w-6 h-6" />
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="">
          {/* UPLOAD SECTION */}
          <div className="space-y-6">
            <div className="border bg-white rounded-xl shadow-md">
              <div className="p-4 border-b font-semibold flex items-center gap-2 bg-gray-50">
                <FileText className="w-5 h-5 text-blue-600" /> Source Document
              </div>

              <div className="p-4">
                <label
                  className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all
                    ${
                      uploadedImage
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-500 hover:bg-gray-50"
                    }`}
                >
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="w-10 h-10 mb-3 text-blue-500" />
                      <p className="font-medium text-blue-600">
                        Click to upload
                      </p>
                      <p className="text-xs">PNG / JPG / PDF</p>
                    </div>
                  )}

                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="p-4 bg-blue-50 rounded-xl border text-blue-700 flex gap-3 items-center shadow">
                <Loader2 className="animate-spin w-5 h-5" />
                Processing OCR Data...
              </div>
            )}
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-2">
            {!scannedData ? (
              <div className="h-72 rounded-xl  flex flex-col items-center justify-center text-center shadow-sm">
                <ArrowRight className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold">Upload a marksheet</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-xs">
                  Compare OCR extracted data with official database.
                </p>
              </div>
            ) : (
              <div className="space-y-8 mt-10">

                {/* FILTER BUTTONS */}
                <div className="flex flex-wrap items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    Verification Results
                  </h2>

                  <div className="flex  rounded-lg shadow  overflow-hidden">
                    {["none", "matched", "unmatched"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFilterMode(mode)}
                        className={`px-4 mr-2 py-2 text-sm border-r last:border-none flex items-center gap-2
                          ${
                            filterMode === mode
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {mode === "matched" && <CheckCircle2 className="w-4 h-4" />}
                        {mode === "unmatched" && <XCircle className="w-4 h-4" />}
                        {mode === "none" ? "All" : mode?.toLocaleUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTIONS  */}
                <h1 className="absolute right-7 font-bold">DATABASE</h1>
                <h1 className="font-bold">TR DATA</h1>
                <RenderSection
                  title="Student Information"
                  leftData={scannedData.studentInfo}
                  rightData={databaseData.studentInfo}
                />

                <div className="space-y-4">
                  <h3 className="text-sm text-gray-600 font-semibold uppercase">
                    Subjects
                  </h3>

                  {scannedData.subjects?.map((s, i) => (
                    <RenderSection
                      key={i}
                      title={s.name}
                      leftData={s}
                      rightData={databaseData.subjects[i]}
                    />
                  ))}
                </div>
                <RenderSection
                  title="Final Result Summary"
                  leftData={scannedData.result}
                  rightData={databaseData.result}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
