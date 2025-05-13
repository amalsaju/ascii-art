'use client'
import { ChangeEvent, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
export function AsciiConverter(): React.JSX.Element {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [outputColor, setOutputColor] = useState<string>("color");

	const [converted, setConverted] = useState<boolean>(false);

	// Use this for the next version for custom values 
	// const [textFontSize, setTextFontSize] = useState<number>(8);
	// const [textLineHeight, setTextLineHeight] = useState<number>(textFontSize * 1.2);
	// const [textLetterSpacing, setTextLetterSpacing] = useState<number>(0);
	// const [noOfCharacters, setNoOfCharacters] = useState<number>(50);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const preRef = useRef<HTMLPreElement>(null);
	const outputCanvasRef = useRef<HTMLCanvasElement>(null);

	const textFontSize = 8;
	const textLineHeight = textFontSize * 1.2;
	const textLetterSpacing = 0;
	const noOfCharacters = 100;

	const handleImageUploadClick = () => {
		fileInputRef.current?.click();
	};

	const getTextFontWidth = (): number => {
		const pre = document.createElement('pre');
		pre.style.display = 'inline';
		pre.textContent = ' ';

		document.body.appendChild(pre);
		const width = pre.getBoundingClientRect().width;
		document.body.removeChild(pre);

		return width;
	};

	const getTextFontHeight = (): number => {
		const pre = document.createElement('pre');
		pre.style.display = 'inline';
		pre.textContent = ' ';

		document.body.appendChild(pre);
		const height = pre.getBoundingClientRect().height;
		document.body.removeChild(pre);

		return height;
	}

	const getTextFontRatio = () => {
		return getTextFontHeight() / getTextFontWidth();
	}

	const MAXIMUM_WIDTH = noOfCharacters; // This is essentially the number of characters wide
	const clampDimensions = (width: number, height: number) => {
		// MAXIMUM_HEIGHT = MAXIMUM_WIDTH * height / width;
		console.log("Font Ratio", getTextFontRatio());
		console.log("Image width: ", width, " Image Height: ", height);
		console.log("Canvas Width: ", width, " Canvas Height: ", height);
		console.log(navigator.userAgent.toLowerCase().indexOf("android"));
		let reducedHeight;
		if (navigator.userAgent.toLowerCase().indexOf("android") > 0) {
			reducedHeight = Math.floor((height / width) * MAXIMUM_WIDTH);
		} else {
			reducedHeight = Math.floor((height / width) * MAXIMUM_WIDTH / getTextFontRatio());
		}
		console.log("Width: ", MAXIMUM_WIDTH, " Reduced Height: ", reducedHeight);
		return [MAXIMUM_WIDTH, reducedHeight];
	}
	const updateImage = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;
			asciiImage.innerHTML = "";
			const file = event.target.files[0];
			setImageFile(file);
			const reader = new FileReader();

			reader.onload = (event: ProgressEvent<FileReader>) => {
				const result = event.target?.result;
				if (typeof result === 'string') {
					const image = new Image();

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
			const grayScales: number[] = [];
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

			// Unicode Character “█” (U+2588)
			const grayRamp = ' .:coPO?@█';
			const rampLength = grayRamp.length;

			const getCharactersForGrayScale = (grayScale: number): string => grayRamp[Math.ceil((rampLength - 1) * grayScale / 255)];

			for (let i = 0; i < grayRamp.length; i++) {
				const span = document.createElement('span');
				span.textContent = grayRamp[i];
				asciiImage.appendChild(span);
				// console.log("Width of :", grayRamp[i], " is : ", span.getBoundingClientRect().width);
				asciiImage.removeChild(span);
			}

			const getCharacterWidth = (character: string): number => {
				const span = document.createElement('span');
				span.textContent = character;
				asciiImage.appendChild(span);
				const width = span.getBoundingClientRect().width;
				asciiImage.removeChild(span);
				return width;
			}

			// The width of this specific character is different on android
			// And hence we need to accomodate for it
			const characterWidth = getCharacterWidth("█");

			// Clear the pre tag	
			asciiImage.innerHTML = "";

			const drawAscii = (preTag: HTMLPreElement, grayScales: number[], width: number): void => {
				let imageDataCount = 0;
				for (let i = 0; i < grayScales.length; i++) {
					const nextChars = getCharactersForGrayScale(grayScales[i]);
					const span = document.createElement('span');
					span.textContent = nextChars;
					if (characterWidth == 8 && nextChars != "█") {
						span.style = "letter-spacing: 3.2px;"
					}
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
					// console.log("Width of : ", nextChars, " : ", span.getBoundingClientRect().width);
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

		const canvas = outputCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const currentPre = preRef.current;
		if (!currentPre) return;

		const characterWidth = (ctx.measureText("█").actualBoundingBoxLeft + ctx.measureText("█").actualBoundingBoxRight);
		const characterHeight = (ctx.measureText("█").actualBoundingBoxAscent + ctx.measureText("█").actualBoundingBoxDescent) + 1;

		canvas.width = noOfCharacters * characterWidth;
		canvas.height = canvas.width * (currentPre.clientHeight / currentPre.clientWidth);

		// console.log("Pretag ratio: ", currentPre.clientWidth / currentPre.clientHeight, " Canvas ratio: ", canvas.width / canvas.height);

		const heightScale = canvas.height / (characterHeight * (currentPre.innerText.length / noOfCharacters));
		ctx.setTransform(1, 0, 0, heightScale, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = "black";
		ctx.fillRect(0,0, canvas.width, canvas.height);
		// console.log("Canvas Height: ", canvas.height, " Width: ", canvas.width);

		let currentChildCount = 0;
		let characterCount = 0;
		while (currentChildCount < currentPre.children.length) {

			// console.log("Current Node:", currentPre.children[currentChildCount].nodeName);
			if (currentPre.children[currentChildCount].nodeName.toLowerCase() === "span") {

				const node = currentPre.children[currentChildCount] as HTMLSpanElement;
				ctx.font = `${textFontSize}`;
				ctx.fillStyle = node.style.color;
				ctx.textBaseline = 'top';
				ctx.fillText(node.textContent || "", (characterCount % noOfCharacters) * characterWidth, (Math.floor(characterCount / noOfCharacters) * characterHeight));
				// console.log("Color", ctx.fillStyle, " Fill Text: ", node.textContent, " Pos x: ", (characterCount % noOfCharacters) * characterWidth, " Pos Y: ", (Math.floor(characterCount / noOfCharacters) * characterHeight));

				characterCount++;
			} else {
				// This is the br element

			}
			currentChildCount++;
		}

		const link = document.createElement('a');
		link.download = 'ascii-image.png';
		link.href = canvas.toDataURL();;
		link.click();
	};

	return (
		<div className="flex flex-col gap-[1.5] p-[2.5] mt-10 justify-center items-center">
			<div>
				<h1 className="text-3xl w-full text-center my-10">ASCII Art Generator</h1>
			</div>
			<div className="flex flex-col p-[0.5] min-w-[16rem] min-h-[6rem] border-2 border-dashed border-gray-500 rounded-md flex cursor-pointer md:min-w-[32rem] md:max-w-48 justify-center items-center md:w-1/2" onDragOver={handleDragOver} onDrop={handleFileDrop} onClick={handleImageUploadClick}>
				<div>
					{imageFile ? (
						<img className="max-w-48 p-5 rounded-md self-start object-scale-down" src={URL.createObjectURL(imageFile)} alt="Uploaded image" />
					) : (
						<p className="text-center text-md md:text-lg">Click to choose file </p>
					)}
				</div>
				<div>
					<input className="hidden" type="file" ref={fileInputRef} accept="image/*" onChange={updateImage} />
				</div>
			</div>
			{imageFile &&
				<div className="flex gap-4 mt-3">
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
			<div>
				<canvas className="hidden" ref={outputCanvasRef}></canvas>
			</div>
			<div className="flex gap-4 mb-20">
				<div className="flex flex-col gap-2 items-center">
					<div className="mb-5 h-[300px] w-[300px] overflow-scroll md:h-full md:w-full md:overflow-auto text-nowrap">
						<div className="flex">
							<pre ref={preRef} className="items-center"
								style={{ fontSize: `${textFontSize}px`, lineHeight: `${textLineHeight}px`, letterSpacing: `${textLetterSpacing}px` }}
								id="ascii"></pre>
						</div>
					</div>
					{converted &&
						<div className="flex flex-row gap-2 mx-4">
							<div className="">
								<button className="rounded-xl bg-blue-800 hover:bg-blue-600 p-2 md:p-4" onClick={downloadImage}>Download as image</button>
							</div>
							<div className="">
								<button className="rounded-xl bg-blue-800 hover:bg-blue-600 p-2 md:p-4" onClick={copyTextAndNotify}>Copy to clipboard</button>
								<ToastContainer autoClose={2000} />
							</div>
						</div>}
				</div>
			</div>
		</div>
	)
}