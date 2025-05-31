'use client'
import { ChangeEvent, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
export function AsciiConverter(): React.JSX.Element {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [outputColor, setOutputColor] = useState<string>("color");

	const [converted, setConverted] = useState<boolean>(false);
	const [edgeDetectionEnabled, setEdgeDetectionEnabled] = useState(false);
	const [noOfCharacters, setNoOfCharacters] = useState(100);
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
	// const noOfCharacters = 300;

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

	const clampDimensions = (width: number, height: number) => {

		const MAXIMUM_WIDTH = noOfCharacters;

		// console.log("Font Ratio", getTextFontRatio());
		// console.log("Image width: ", width, " Image Height: ", height);
		// console.log("Canvas Width: ", width, " Canvas Height: ", height);
		// console.log(navigator.userAgent.toLowerCase().indexOf("android"));

		let reducedHeight;
		// Android render in kinda like squares for some reason
		// which is why you can't divide by the font ratio
		if (navigator.userAgent.toLowerCase().indexOf("android") > 0) {
			reducedHeight = Math.floor((height / width) * MAXIMUM_WIDTH);
		} else {
			reducedHeight = Math.floor((height / width) * MAXIMUM_WIDTH / getTextFontRatio());
		}
		// console.log("Width: ", MAXIMUM_WIDTH, " Reduced Height: ", reducedHeight);
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
		if (!canvas) return;
		const context = canvas.getContext('2d');
		if (!context) return;
		const image = document.querySelector("img#uploadedImg") as HTMLImageElement;
		const [width, height] = clampDimensions(image.width, image.height);
		const asciiImage = document.querySelector("pre#ascii") as HTMLPreElement;

		const toGrayScale = (r: number, g: number, b: number): number => 0.21 * r + 0.72 * g + 0.07 * b;

		// Updating and redrawing the canvas based on the settings 

		context.reset();
		canvas.width = width;
		canvas.height = height;
		context.drawImage(image, 0, 0, width, height);

		// Converting the image to grayscale
		setConverted(true);
		context.getContextAttributes().willReadFrequently = true;
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const grayScales: number[] = [];
		for (let i = 0; i < imageData.data.length; i += 4) {
			const r = imageData.data[i];
			const g = imageData.data[i + 1];
			const b = imageData.data[i + 2];
			// alpha is the 4th one, which is why we increment by 4

			const grayScale: number = toGrayScale(r, g, b);

			// Below line is to see the image in grayscale
			// imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = grayScale;
			grayScales.push(grayScale);
		}
		// Below line is to push the image into canvas
		// context.putImageData(imageData, 0, 0);

		// Unicode Character “█” (U+2588)
		const grayRamp = ' .:coPO?@█';
		const rampLength = grayRamp.length;

		// Get the appropriate character for the luminence
		const getCharactersForGrayScale = (grayScale: number): string => grayRamp[Math.ceil((rampLength - 1) * grayScale / 255)];

		// Performing edge detection using sobel	
		const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
		const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

		const edge = new Uint8ClampedArray(canvas.width * canvas.height);
		const edges: string[] = [];
		for (let y = 1; y < canvas.height - 1; y++) {
			for (let x = 1; x < canvas.width - 1; x++) {
				let gx = 0, gy = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const px = x + kx;
						const py = y + ky;
						const val = grayScales[py * canvas.width + px];
						const kernelIdx = (ky + 1) * 3 + (kx + 1);
						gx += val * sobelX[kernelIdx];
						gy += val * sobelY[kernelIdx];
					}
				}
				const magnitude = Math.sqrt(gx * gx + gy * gy);
				// Only takes the brighest edges
				edge[y * canvas.width + x] = magnitude > 255 ? 255 : 0;
				if (magnitude >= 255) {
					// converting the angle to a range of [0,1]
					const angle = (Math.atan2(gy, gx) / Math.PI * 0.5) + 0.5;
					// console.log("Angle", angle);
					let char = '';
					if (angle >= 0.45 && angle < 0.55) {
						// console.log("Angle: ", angle, "Value: '-' ");
						char = '‼';
					}
					else if (angle <= 0.05 && angle > 0.95) {
						// console.log("Angle: ", angle, "Value: '-' ");
						char = '‼';
					}
					else if (angle >= 0.7 && angle < 0.8) {
						// console.log("Angle: ", angle, "Value: '|' ");
						char = '=';
					}
					else if (angle >= 0.2 && angle < 0.3) {
						// console.log("Angle: ", angle, "Value: '|'");
						char = '=';
					}
					else if (angle >= 0.8 && angle < 0.95) {
						// console.log("Angle: ", angle, "Value: '\\'");
						char = '\\';
					}
					else if (angle < 0.2 && angle > 0.05) {
						// console.log("Angle: ", angle, "Value: '/'");
						char = '/';
					}
					else if (angle <= 0.7 && angle > 0.55) {
						// console.log("Angle: ", angle, "Value: '/'");
						char = '/';
					}
					else if (angle > 0.3 && angle < 0.45) {
						// console.log("Angle: ", angle, "Value: '\\'");
						char = '\\';
					}
					edges[y * canvas.width + x] = char;
				} else {
					edges[y * canvas.width + x] = '';
				}
			}
		}

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
				let nextChars = getCharactersForGrayScale(grayScales[i]);
				// let nextChars = edges[i];
				if (edgeDetectionEnabled) {
					if (edges[i] == '‼' || edges[i] == '/' || edges[i] == '\\' || edges[i] == '|' || edges[i] == '=') {
						nextChars = edges[i];
					}
				}
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

	const copyTextAndNotify = () => {
		const asciiText = document.querySelector("pre#ascii") as HTMLPreElement;
		if (asciiText && asciiText.innerText) {
			// console.log(asciiText.innerText.length);
			navigator.clipboard.writeText(asciiText.innerText);
			toast.success("Copied to clipboard!");
		} else {
			toast.error("Unable to copy!");
		}
	}

	const downloadImage = () => {

		const canvas = outputCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		if (!ctx) return;
		const currentPre = preRef.current;
		if (!currentPre) return;

		const characterWidth = (ctx.measureText("█").actualBoundingBoxLeft + ctx.measureText("█").actualBoundingBoxRight);
		const characterHeight = (ctx.measureText("█").actualBoundingBoxAscent + ctx.measureText("█").actualBoundingBoxDescent) + 1;

		canvas.width = noOfCharacters * characterWidth;

		if (navigator.userAgent.toLowerCase().indexOf("android") > 0) {
			canvas.height = currentPre.clientHeight;
		} else {
			canvas.height = canvas.width * (currentPre.clientHeight / currentPre.clientWidth);
		}

		// console.log("Pretag ratio: ", currentPre.clientWidth / currentPre.clientHeight, " Canvas ratio: ", canvas.width / canvas.height);

		const heightScale = canvas.height / (characterHeight * (currentPre.innerText.length / noOfCharacters));
		ctx.setTransform(1, 0, 0, heightScale, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
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
				characterCount++;
			}
			currentChildCount++;
		}

		const link = document.createElement('a');
		link.download = 'ascii-image_' + Date.now().toString() + '.png';
		link.href = canvas.toDataURL();;
		link.click();
		toast.success("Downloading...");
	};

	return (
		<div className="flex flex-col gap-[1.5] p-[2.5] mt-10 justify-center items-center">
			<div>
				<h1 className="text-3xl w-full text-center my-10">ASCII Art Generator</h1>
			</div>
			<div className="flex flex-col p-[0.5] min-w-[16rem] min-h-[6rem] border-2 border-dashed border-gray-500 rounded-md cursor-pointer md:min-w-[32rem] md:max-w-48 justify-center items-center md:w-1/2" onDragOver={handleDragOver} onDrop={handleFileDrop} onClick={handleImageUploadClick}>
				<div>
					{imageFile ? (
						<img id="uploadedImg" className="max-w-48 p-5 rounded-md self-start object-scale-down" src={URL.createObjectURL(imageFile)} alt="Uploaded image" />
					) : (
						<p className="text-center text-md md:text-lg">Click to choose file </p>
					)}
				</div>
				<div>
					<input className="hidden" type="file" ref={fileInputRef} accept="image/*" onChange={updateImage} />
				</div>
			</div>
			{imageFile &&
				<>
					<div className="flex mt-5 flex-col items-center bg-gray-800 p-4 rounded-md">
						<h3 className="text-xl">Settings</h3>
						<div className="flex gap-4 mt-3">
							<div>
								<input type="radio" value="grayscale" name="outputTypeColor" checked={outputColor == "grayscale"} onChange={() => setOutputColor("grayscale")} /> Grayscale
							</div>
							<div>
								<input type="radio" value="color" name="outputTypeColor" checked={outputColor == "color"} onChange={() => setOutputColor("color")} /> Color
							</div>
						</div>
						<div className="mt-3 flex">
							<input type="checkbox" id="edgeDetectionCheckbox" className="p-2" checked={edgeDetectionEnabled} name="edgeDetectionCheckbox" onChange={() => setEdgeDetectionEnabled(!edgeDetectionEnabled)} />
							<label htmlFor="edgeDetectionCheckbox" className="p-1"></label>
							Enable edge detection
						</div>
						<div className="w-full items-center text-center mt-2">
							<label htmlFor="characterCountSlider">No of characters per line <br /> {noOfCharacters}</label>
							<br />
							<input type="range" name="characterCountSlider" className="w-full" min={50} max={300} value={noOfCharacters} list="values"
								onChange={(event) => setNoOfCharacters(parseInt(event.target.value))} id="characterCountSlider" />
							<datalist id="values" className="flex w-full gap-1 place-content-between">
								<option className={noOfCharacters == 50 ? `bg-gray-600 px-1` : `px-1`} value="50" label="50"></option>
								<option className={noOfCharacters == 100 ? `bg-gray-600 px-1` : `px-1`} value="100" label="100"></option>
								<option className={noOfCharacters == 150 ? `bg-gray-600 px-1` : `px-1`} value="150" label="150"></option>
								<option className={noOfCharacters == 200 ? `bg-gray-600 px-1` : `px-1`} value="200" label="200"></option>
								<option className={noOfCharacters == 250 ? `bg-gray-600 px-1` : `px-1`} value="250" label="250"></option>
								<option className={noOfCharacters == 300 ? `bg-gray-600 px-1` : `px-1`} value="300" label="300"></option>
							</datalist>
						</div>
					</div>
				</>
			}
			{
				imageFile &&
				<div className="my-10">
					<button onClick={onButtonClick} className="rounded-xl bg-blue-800 p-4 cursor-pointer hover:bg-blue-600">Convert to ASCII</button>
				</div>
			}
			<div>
				{/* Change the below class to block to see the intermediate picture value */}
				<canvas className="hidden" ref={canvasRef}></canvas>
			</div>
			<div>
				{/* Change the below class to block to see the output canvas value */}
				<canvas className="hidden" ref={outputCanvasRef}></canvas>
			</div>
			<div className="flex gap-4 mb-20">
				<div className="flex flex-col gap-2 items-center">
					<div className="mb-5 h-[300px] w-[300px] overflow-scroll md:h-full md:w-full md:overflow-auto text-nowrap">
						<div className="text-center">
							<pre ref={preRef}
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