"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Loader, Link, File, Video, Image, Youtube } from 'lucide-react';
import styles from './UploadPage.css'; // Make sure this CSS file exists

type UploadType = 'url' | 'file' | 'mp4' | 'youtube' | 'png';

const UploadAlgebra: React.FC = () => {
  const [uploadType, setUploadType] = useState<UploadType>('url');
  const [input, setInput] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('true/false');
  const [logs, setLogs] = useState<string[]>([]);

  const handleUploadTypeChange = (type: UploadType) => {
    setUploadType(type);
    setInput('');
    setFile(null);
    setError('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleQuestionCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setQuestionCount(parseInt(event.target.value));
  };

  const handleDifficultyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(event.target.value);
  };

  const handleQuestionTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuestionType(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Placeholder for submit functionality
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLogs(['Processing started', 'Analyzing content', 'Generating questions', 'Process completed']);
    }, 2000);
  };

  const renderInputField = () => {
    switch (uploadType) {
      case 'url':
        return (
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter a URL"
            className="w-full border border-gray-300 p-2 rounded"
          />
        );
      case 'file':
      case 'mp4':
      case 'png':
        return (
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept={uploadType === 'file' ? ".pdf,.docx,.txt" : uploadType === 'mp4' ? ".mp4" : ".png"}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-white border border-gray-300 rounded py-2 px-4 inline-flex items-center w-full"
            >
              <span className="mr-2">
                {uploadType === 'file' ? <File size={18} /> : uploadType === 'mp4' ? <Video size={18} /> : <Image size={18} />}
              </span>
              <span className="text-gray-700">
                {file ? file.name : `Choose ${uploadType.toUpperCase()} file`}
              </span>
            </label>
          </div>
        );
      case 'youtube':
        return (
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Enter YouTube video URL"
            className="w-full border border-gray-300 p-2 rounded"
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl p-8 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">Generate Algebra Questions!</h1>
        <p className="text-center text-gray-600 mb-6">Choose an input method to generate algebra questions.</p>
        <div className="flex justify-center mb-4 flex-wrap">
          <button
            onClick={() => handleUploadTypeChange('url')}
            className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <Link className="mr-2" size={18} />
            URL
          </button>
          <button
            onClick={() => handleUploadTypeChange('file')}
            className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <File className="mr-2" size={18} />
            File
          </button>
          <button
            onClick={() => handleUploadTypeChange('mp4')}
            className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'mp4' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <Video className="mr-2" size={18} />
            MP4
          </button>
          <button
            onClick={() => handleUploadTypeChange('youtube')}
            className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'youtube' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <Youtube className="mr-2" size={18} />
            YouTube
          </button>
          <button
            onClick={() => handleUploadTypeChange('png')}
            className={`m-1 px-4 py-2 rounded flex items-center ${uploadType === 'png' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <Image className="mr-2" size={18} />
            PNG
          </button>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {renderInputField()}
          <div className="flex justify-between">
            <label className="w-1/3">
              Question Count:
              <select value={questionCount} onChange={handleQuestionCountChange} className="ml-2 border border-gray-300 rounded">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </label>
            <label className="w-1/3">
              Difficulty:
              <select value={difficulty} onChange={handleDifficultyChange} className="ml-2 border border-gray-300 rounded">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <label className="w-1/3">
              Question Type:
              <select value={selectedQuestionType} onChange={handleQuestionTypeChange} className="ml-2 border border-gray-300 rounded">
                <option value="true/false">True/False</option>
                <option value="short answer">Short Answer</option>
                <option value="multiple choice">Multiple Choice</option>
                <option value="essay">Essay</option>
              </select>
            </label>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            disabled={isLoading || (!input && !file)}
          >
            {isLoading ? 'Processing...' : 'Generate Algebra Questions'}
          </button>
          {isLoading && (
            <div className="mt-4">
              <div className="flex items-center justify-center mb-2">
                <Loader className="animate-spin mr-2" />
                <span>Processing...</span>
              </div>
              <div className="mt-4 max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <p key={index} className="text-sm text-gray-600">{log}</p>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadAlgebra;
