import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Camera,
  Tag,
  Sparkles,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  score: number;
}

interface Detection {
  class: string;
  confidence: number;
}

interface ImageAnalysis {
  captions: string[];
  detections: Detection[];
  similar_images: GeneratedImage[];
  segmented_image: string[];
}

function App() {
  const [inputType, setInputType] = useState<"text" | "image" | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [textPrompt, setTextPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const generateImagesFromText = async (prompt: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("q", prompt); // <-- name must match backend parameter

      const res = await fetch(`${API_URL}/api/text-query/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      // adjust according to backend response
      setGeneratedImages(data.similar_images || []);
    } catch {
      alert("Text query failed");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/file-query/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Adjust this to match your backend’s response shape
      setImageAnalysis(data || null);
      setGeneratedImages(data.similar_images || []);
    } catch {
      alert("Image analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textPrompt.trim()) {
      setInputType("text");
      setUploadedImage(null);
      setImageAnalysis(null);
      generateImagesFromText(textPrompt);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setInputType("image");
        setGeneratedImages([]);
        analyzeImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetApp = () => {
    setInputType(null);
    setTextPrompt("");
    setUploadedImage(null);
    setGeneratedImages([]);
    setImageAnalysis(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">image processor</h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            enter a text prompt to retrieve 3 images, or upload an image to get
            caption, related images, and classifications
          </p>
        </div>

        {!inputType && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Toggle Buttons */}
            <div className="flex justify-center mb-8">
              <div className="border border-gray-700 rounded-lg p-1 bg-gray-900">
                <button
                  onClick={() => setInputMode("text")}
                  className={`px-6 py-2 rounded font-mono transition-colors ${
                    inputMode === "text"
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  text prompt
                </button>
                <button
                  onClick={() => setInputMode("image")}
                  className={`px-6 py-2 rounded font-mono transition-colors ${
                    inputMode === "image"
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  image upload
                </button>
              </div>
            </div>

            {/* Text Input Section */}
            {inputMode === "text" && (
              <div className="border border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <h2 className="">text prompt :)</h2>
                </div>
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="describe the images you want to retrieve..."
                    className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 font-mono text-white placeholder-gray-500 focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!textPrompt.trim()}
                    className="w-full bg-white text-black py-3 rounded font-mono font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    retrieve 3 images
                  </button>
                </form>

                {/* Example prompts */}
                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-2">
                    try one of these prompts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "a man riding a surfboard on a wave",
                      "two dogs playing on the grass",
                      "a group of people sitting around a dining table",
                      "a train passing through a station",
                      "a person riding a bicycle in the city",
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTextPrompt(prompt)}
                        className="px-3 py-1 bg-gray-800 text-gray-200 text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            {inputMode === "image" && (
              <div className="border border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <h2 className="">image upload</h2>
                  <Camera className="w-5 h-5 ml-2" />
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-gray-400 bg-gray-900"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-4 text-gray-300">
                    drag and drop an image here, or click to select
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-mono transition-colors"
                    >
                      select image
                    </button>

                    {/* Random COCO image button */}
                    <button
                      type="button"
                      onClick={async () => {
                        const cocoImages = [
                          "000000000057.jpg",
                          "000000000063.jpg",
                          "000000000069.jpg",
                          "000000000080.jpg",
                          "000000000090.jpg",
                          "000000000106.jpg",
                          "000000000108.jpg",
                          "000000000128.jpg",
                          "000000000155.jpg",
                          "000000000161.jpg",
                          "000000000171.jpg",
                          "000000000178.jpg",
                          "000000000180.jpg",
                          "000000000183.jpg",
                          "000000000188.jpg",
                          "000000000191.jpg",
                          "000000000202.jpg",
                          "000000000205.jpg",
                          "000000000212.jpg",
                          "000000000229.jpg",
                          "000000000251.jpg",
                          "000000000275.jpg",
                          "000000000276.jpg",
                          "000000000311.jpg",
                          "000000000318.jpg",
                          "000000000345.jpg",
                          "000000000408.jpg",
                        ];
                        const randomFile =
                          cocoImages[
                            Math.floor(Math.random() * cocoImages.length)
                          ];
                        const url = `http://images.cocodataset.org/test2017/${randomFile}`;

                        // fetch image blob
                        const res = await fetch(
                          `${API_URL}/api/proxy-image/?url=${encodeURIComponent(
                            url
                          )}`
                        );
                        const blob = await res.blob();
                        const file = new File([blob], randomFile, {
                          type: blob.type,
                        });
                        handleFile(file);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-mono transition-colors"
                    >
                      random coco image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {(inputType || isLoading) && (
          <div className="max-w-6xl mx-auto">
            <button
              onClick={resetApp}
              className="mb-8 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-mono transition-colors"
            >
              ← home
            </button>

            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-l-transparent mb-4"></div>
                <p className="text-gray-400">
                  {inputType === "text"
                    ? "retrieving images..."
                    : "analyzing image..."}
                </p>
              </div>
            )}

            {/* Text Prompt Results */}
            {inputType === "text" &&
              !isLoading &&
              generatedImages.length > 0 && (
                <>
                  <div className="flex items-center mb-4">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    <h2 className="text-xl font-bold">retrieved images</h2>
                  </div>

                  <div className="columns-1 md:columns-3 gap-4">
                    {generatedImages.map((image) => (
                      <div
                        key={image.id}
                        className="mb-4 break-inside-avoid border border-gray-700 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image.url}
                          alt=":("
                          className="w-full h-auto"
                        />
                        <div className="p-4">
                          <p className="text-sm text-gray-400">
                            score : {image.score.toFixed(3)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            {/* Image Upload Results */}
            {inputType === "image" &&
              !isLoading &&
              uploadedImage &&
              imageAnalysis && (
                <div className="space-y-8">
                  {/* Uploaded and Segmented Images */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Upload className="w-5 h-5 mr-2" />
                      <h2 className="text-xl font-bold">
                        uploaded & segmented images
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={uploadedImage}
                          alt="Uploaded image"
                          className="w-full h-auto"
                        />
                        <div className="p-4">
                          <p className="text-sm text-gray-400 font-mono">
                            original
                          </p>
                        </div>
                      </div>
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={`data:image/png;base64,${imageAnalysis.segmented_image}`}
                          alt="Segmented"
                          className="w-full h-auto"
                        />
                        <div className="p-4">
                          <p className="text-sm text-gray-400 font-mono">
                            segmented
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-bold">captions :)</h2>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-6">
                      {imageAnalysis.captions.map((c, idx) => (
                        <p key={idx} className="text-gray-300 leading-relaxed">
                          {c}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Related Images */}
                  <div>
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-bold">similar images</h2>
                      <ImageIcon className="w-5 h-5 ml-2" />
                    </div>

                    {/* Masonry layout */}
                    <div className="columns-1 md:columns-3 gap-4">
                      {imageAnalysis.similar_images.map((image) => (
                        <div
                          key={image.id}
                          className="mb-4 break-inside-avoid border border-gray-700 rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.url}
                            alt=":("
                            className="w-full h-auto"
                          />
                          <div className="p-4">
                            <p className="text-sm text-gray-400">
                              score: {image.score.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Classes */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Tag className="w-5 h-5 mr-2" />
                      <h2 className="text-xl font-bold">detections</h2>
                    </div>
                    <div className="border border-gray-700 rounded-lg p-6 flex flex-wrap gap-2">
                      {imageAnalysis.detections.map((det, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-800 border border-gray-600 px-3 py-1 rounded text-sm"
                        >
                          {det.class} ({det.confidence.toFixed(3)})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
