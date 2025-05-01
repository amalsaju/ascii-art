'use client'
import { ChangeEvent, useRef, useState } from "react";
import React from "react";

export function CustomFilePicker({ accept = "image/*" }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const updateImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          console.log("Result: ", result);
          const image = new Image();
          image.onload = () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            if (canvas && context) {
              console.log("They are not null");
              canvas.width = image.width;
              canvas.height = image.height;
              context.drawImage(image, 0, 0);
            }
          }
          image.src = result;
        }
      }
      reader.readAsDataURL(file);
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
    }
  }

  const onButtonClick = () => {
    console.log('Button Clicked!');

    const canvas = canvasRef.current;
    const context = canvasRef.current?.getContext('2d');
    const toGrayScale = (r: number, g: number, b: number): number => 0.21 * r + 0.72 * g + 0.07 * b;
    if (canvas && context) {

      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
      let grayScales: number[]= [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        // alpha is the 4th one, which is why we increment by 4

        const grayScale: number = toGrayScale(r, g, b);
        imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = grayScale;
        grayScales.push(grayScale);
      }
      // context.putImageData(imageData, 0, 0);

      const grayRamp = ' .:coPO?@■';
      const rampLength = grayRamp.length;

      // const getCharactersForGrayScale = grayScale => 


    }

  }

  return (
    <div className="flex flex-col gap-[1.5] p-[2.5] mt-10 justify-center items-center">
      <div className="flex flex-col p-[0.5] min-h-24 border-2 border-dashed border-gray-500 rounded-md flex cursor-pointer h-fit min-w-[32rem] justify-center items-center w-1/2" onDragOver={handleDragOver} onDrop={handleFileDrop} onClick={handleImageUploadClick}>
        <div>
          {imageFile ? (
            <img className="w-full p-5 rounded-md self-start object-cover" src={URL.createObjectURL(imageFile)} alt="Uploaded image" />
          ) : (
            <p className="text-center">Drag and Drop image here <br /> or <br /> Click to choose file </p>
          )}
        </div>
        <div>
          <input className="hidden" type="file" ref={fileInputRef} accept={accept} onChange={updateImage} />
        </div>
      </div>
      <div className="my-10">
        <button onClick={onButtonClick} className="rounded-xl bg-blue-800 p-4 cursor-pointer hover:bg-blue-600">Convert to ASCII</button>
      </div>
      <div>
        <canvas className="flex bg-gray-200" ref={canvasRef}></canvas>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl w-full text-center mt-10">ASCII Art Generator</h1>
      <CustomFilePicker />
    </div>
  );
}
