import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../lib/firebase-config';
import { updateProfile } from 'firebase/auth';
import Image from 'next/image';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (newPhotoURL: string) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onProfileUpdate }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setError(null);
    }
  };

  // Handle drag and drop file selection
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedImage(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  // Handle clicking the drag-and-drop area to open file input dialog
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Open the file dialog
    }
  };

  // Handle image upload to Firebase Storage
  const handleUpload = async () => {
    if (!selectedImage) {
      setError('No image selected');
      return;
    }
    
    setUploading(true);
    setError(null);

    try {
      const storage = getStorage();
      const user = auth.currentUser;
      if (!user) {
        setError('No user logged in');
        return;
      }

      const storageRef = ref(storage, `profile-pictures/${user.uid}/${selectedImage.name}`);
      await uploadBytes(storageRef, selectedImage);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL: downloadURL });

      onProfileUpdate(downloadURL); // Update the profile picture in the parent component
      alert('Profile picture updated successfully!');
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-black">Upload Profile Picture</h2>

        {/* Drag and Drop Area */}
        <div
          className={`border-dashed border-4 rounded-lg p-6 mb-4 cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick} // Open file dialog on click
        >
          {selectedImage ? (
            <div>
              <p className="text-black">Selected Image: {selectedImage.name}</p>
              <Image
                src={URL.createObjectURL(selectedImage)}
                alt="Selected"
                width={500}
                height={300}
                layout="responsive"
              />
            </div>
          ) : (
            <p className="text-black text-center">Drag & drop an image here or click to select</p>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef} // Attach ref to file input
          className="hidden" // Hide input field
          onChange={handleImageChange}
        />

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button 
            className="bg-gray-500 text-white py-2 px-4 rounded mr-4"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            className="bg-blue-500 text-white py-2 px-4 rounded"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
