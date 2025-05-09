'use client'
import React from "react";
import { CustomFilePicker } from "./custom-file-picker";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl w-full text-center mt-10">ASCII Art Generator</h1>
      <CustomFilePicker />
    </div>
  );
}
