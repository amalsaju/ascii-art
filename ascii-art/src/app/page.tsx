'use client'
import { ChangeEvent, useRef, useState } from "react";
import { Tiny5 } from 'next/font/google';
import React from "react";

const font = Tiny5({ weight: "400"});

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
          const image = new Image();
          const MAXIMUM_WIDTH = 80;
          const MAXIMUM_HEIGHT = MAXIMUM_WIDTH * 9 / 16;
          const clampDimensions = (width: number, height: number) => {
            console.log("Width: ", width, " Height: ", height);
            if (height > MAXIMUM_HEIGHT) {
              const reducedWidth = Math.floor(width * MAXIMUM_HEIGHT / height);
              console.log("Width after reduction: ", width, " Max Height: ", height);
              return [reducedWidth, MAXIMUM_HEIGHT];
            }
            if (width > MAXIMUM_WIDTH) {
              const reducedHeight = Math.floor(height * MAXIMUM_WIDTH / width);
              console.log("Max Width: ", width, " Height after reduction: ", height);
              return [MAXIMUM_WIDTH, reducedHeight];
            }
            return [width, height];
          }
          image.onload = () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            const [width, height] = clampDimensions(image.width, image.height);
            if (canvas && context) {
              canvas.width = width;
              canvas.height = height;
              context.drawImage(image, 0, 0, width, height);
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

    const canvas = canvasRef.current;
    const context = canvasRef.current?.getContext('2d');
    const toGrayScale = (r: number, g: number, b: number): number => 0.21 * r + 0.72 * g + 0.07 * b;

    if (canvas && context) {

      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
      let grayScales: number[] = [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        // alpha is the 4th one, which is why we increment by 4

        const grayScale: number = toGrayScale(r, g, b);
        imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = grayScale;
        grayScales.push(grayScale);
      }
      // context.putImageData(imageData, 0, 0);

      const grayRamp = ' .:coPO?@■';
      const rampLength = grayRamp.length;

      const getCharactersForGrayScale = (grayScale: number): string => grayRamp[Math.ceil((rampLength - 1) * grayScale / 255)];

      const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;

      const drawAscii = (grayScales: number[], width: number): void => {
        const ascii = grayScales.reduce((asciiImage, grayScale, index) => {
          let nextChars = getCharactersForGrayScale(grayScale);

          if ((index + 1) % width === 0) {
            nextChars += '\n';
          }
          return asciiImage + nextChars;
        }, '');

        if (asciiImage) {
          asciiImage.textContent = ascii;
        }
      };

      drawAscii(grayScales, canvas.width);
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
        <canvas className="flex" ref={canvasRef}></canvas>
      </div>
      <div>
        <pre className={`leading-[0.55] tracking-tighter`} id="ascii"></pre>
        {/* <pre className="dotgothic16-regular" id="ascii"></pre> */}
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
