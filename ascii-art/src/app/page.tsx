'use client'
import { ChangeEvent, useRef, useState } from "react";
import { Tiny5 } from 'next/font/google';
import React from "react";
import { ToastContainer, toast } from 'react-toastify';

const font = Tiny5({ weight: "400" });

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
        // imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = grayScale;
        grayScales.push(grayScale);
      }
      // context.putImageData(imageData, 0, 0);

      const grayRamp = ' .:coPO?@█';
      const rampLength = grayRamp.length;

      const getCharactersForGrayScale = (grayScale: number): string => grayRamp[Math.ceil((rampLength - 1) * grayScale / 255)];

      const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;
      const asciiCanvasImage = document.querySelector("canvas#asciiCanvas") as HTMLCanvasElement;

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

      const drawCanvasAscii = (grayScales: number[], width: number): void => {
        const ctx = asciiCanvasImage.getContext('2d');
        const charWidth = 11;
        const lineHeight = 16;
        let imageDataCount = 0;
        asciiCanvasImage.width = 720;
        asciiCanvasImage.height = 720;
        if (ctx) {
          ctx.textBaseline = "top";
          ctx.font = "16px ui-monospace"
          let colIndex = 0;
          let rowIndex = 0;
          let rowLength = 90;
          for (let i = 0; i < grayScales.length; i++) {
            if ((i + 1) % width == 0) {
              colIndex = 0;
            }

            ctx.fillStyle = `rgb(
                  ${imageData.data[imageDataCount]}
                  ${imageData.data[imageDataCount + 1]}
                  ${imageData.data[imageDataCount + 2]}
              )`;

            imageDataCount += 4; // image data also contains alpha values
            // console.log("Character: ", getCharactersForGrayScale(grayScales[i]), " Color: ", ctx.fillStyle);
            ctx.fillText(getCharactersForGrayScale(grayScales[i]), colIndex * charWidth, rowIndex * lineHeight);

            colIndex++;
            rowIndex = i / rowLength;

          }
        }
      };
      drawCanvasAscii(grayScales, canvas.width);
    }
  }

  const copyTextAndNotify = () => {
    const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;
    if (asciiImage && asciiImage.textContent) {
      console.log(asciiImage.textContent.length);
      navigator.clipboard.writeText(asciiImage.textContent);
      toast.success("Copied to clipboard!");
    } else {
      toast.error("Unable to copy!");
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
        <canvas className="hidden" ref={canvasRef}></canvas>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <div><h1 className="text-xl font-bold">Text Version</h1> </div>
          <div>
            <pre className={`leading-[1] tracking-tighter`} id="ascii"></pre>
          </div>
          <div className="">
            <button className="rounded-xl bg-blue-800 hover:bg-blue-600 p-4" onClick={copyTextAndNotify}>Copy ascii text to clipboard</button>
            <ToastContainer />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div><h1 className="text-xl font-bold"> Image Version</h1></div>
          <div>
            <canvas id="asciiCanvas"></canvas>
          </div>
          <div className="">
            <button className="rounded-xl bg-blue-800 hover:bg-blue-600 p-4" >Copy ascii image to clipboard</button>
            <ToastContainer />
          </div>
        </div>
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
