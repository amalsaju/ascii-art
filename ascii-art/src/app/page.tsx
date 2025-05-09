'use client'
import { ChangeEvent, useRef, useState } from "react";
import { Tiny5 } from 'next/font/google';
import React from "react";
import { ToastContainer, toast } from 'react-toastify';

export function CustomFilePicker({ accept = "image/*" }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [outputColor, setOutputColor] = useState<string>("color");

  const [converted, setConverted] = useState<boolean>(false);

  const [textFontSize, setTextFontSize] = useState<number>(8);
  const [textLineHeight, setTextLineHeight] = useState<number>(textFontSize * 1.2);
  const [textLetterSpacing, setTextLetterSpacing] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getTextFontWidth = (): number => {
    const pre = document.createElement('pre');
    pre.style.display = 'inline';
    pre.textContent = ' ';

    document.body.appendChild(pre);
    const { width, height } = pre.getBoundingClientRect();
    document.body.removeChild(pre);

    return width;
  };

  const getTextFontHeight = (): number => {
    const pre = document.createElement('pre');
    pre.style.display = 'inline';
    pre.textContent = ' ';

    document.body.appendChild(pre);
    const { width, height } = pre.getBoundingClientRect();
    document.body.removeChild(pre);

    return height;
  }

  const getTextFontRatio = () => {
    return getTextFontHeight() / getTextFontWidth();
  }

  const updateImage = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const image = new Image();
          const MAXIMUM_WIDTH = 150;
          const clampDimensions = (width: number, height: number) => {
            // MAXIMUM_HEIGHT = MAXIMUM_WIDTH * height / width;
            console.log("Font Ratio", getTextFontRatio());
            console.log("Image width: ", width, " Image Height: ", height);
            console.log("Canvas Width: ", width, " Canvas Height: ", height);
            const reducedHeight = Math.floor((height / width) * MAXIMUM_WIDTH / getTextFontRatio());
            console.log("Width: ", MAXIMUM_WIDTH, " Reduced Height: ", reducedHeight);
            return [MAXIMUM_WIDTH, reducedHeight];
          }
          image.onload = () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            setConverted(false);
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
    const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;
    const toGrayScale = (r: number, g: number, b: number): number => 0.21 * r + 0.72 * g + 0.07 * b;

    if (canvas && context) {
      context.getContextAttributes().willReadFrequently = true;
      setConverted(true);
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

      asciiImage.innerHTML = "";

      const drawAscii = (preTag: HTMLPreElement, grayScales: number[], width: number): void => {
        let imageDataCount = 0;
        for (let i = 0; i < grayScales.length; i++) {
          let nextChars = getCharactersForGrayScale(grayScales[i]);
          const span = document.createElement('span');
          span.textContent = nextChars;
          if (outputColor == "color") {

            span.style.color = `rgb(
                  ${imageData.data[imageDataCount]}
                  ${imageData.data[imageDataCount + 1]}
                  ${imageData.data[imageDataCount + 2]}
              )`;;
            imageDataCount += 4;
          } else {
            span.style.color = `rgb(
                  ${grayScales[i]}
                  ${grayScales[i]}
                  ${grayScales[i]}
              )`;;
          }
          preTag.appendChild(span);
          if ((i + 1) % width === 0) {
            const lineBreak = document.createElement('br');
            preTag.appendChild(lineBreak);
          }
        }
      };

      if (asciiImage) {
        drawAscii(asciiImage, grayScales, canvas.width);
      }

    }
  }

  const copyTextAndNotify = () => {
    const asciiText = document.querySelector("pre#ascii") as HTMLPreElement;
    if (asciiText && asciiText.innerText) {
      console.log(asciiText.innerText.length);
      navigator.clipboard.writeText(asciiText.innerText);
      toast.success("Copied to clipboard!");
    } else {
      toast.error("Unable to copy!");
    }
  }

  const downloadImage = () => {
    const asciiImage = document.querySelector("canvas#asciiCanvas") as HTMLCanvasElement;
    const image = asciiImage.toDataURL('image/*');
    const link = document.createElement('a');

    if (typeof link.download === 'string') {
      link.href = image;
      link.download = 'ascii_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(image);
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
      {imageFile &&
        <div className="flex gap-4">
          <div>
            <input type="radio" value="grayscale" name="outputTypeColor" checked={outputColor == "grayscale"} onChange={() => setOutputColor("grayscale")} /> Grayscale
          </div>
          <div>
            <input type="radio" value="color" name="outputTypeColor" checked={outputColor == "color"} onChange={() => setOutputColor("color")} /> Color
          </div>
        </div>
      }
      {
        imageFile &&
        <div className="my-10">
          <button onClick={onButtonClick} className="rounded-xl bg-blue-800 p-4 cursor-pointer hover:bg-blue-600">Convert to ASCII</button>
        </div>
      }
      <div>
        <canvas className="hidden" ref={canvasRef}></canvas>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <div>
            <pre
              style={{ fontSize: `${textFontSize}px`, lineHeight: `${textLineHeight}px`, letterSpacing: `${textLetterSpacing}px` }}
              id="ascii"></pre>
          </div>
          {converted &&
            <div className="">
              <button className="rounded-xl bg-blue-800 hover:bg-blue-600 p-4" onClick={copyTextAndNotify}>Copy ascii text to clipboard</button>
              <ToastContainer />
            </div>}
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
