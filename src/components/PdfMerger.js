import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Buffer } from "buffer";
import { Button, Box, Typography, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import letterheadImage from "./letterheadd.jpg";

// State variables
const PdfMerger = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  // Unique keys for inputs
  const [inputKeys, setInputKeys] = useState([Date.now()]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState("");

  const handleFileChange = async (event, key) => {
    const file = event.target.files[0];
    if (file) {
      const pdfBytes = await file.arrayBuffer();
      setPdfFiles((prev) => [
        ...prev.filter((pf) => pf.key !== key),
        { key, pdfBytes },
      ]);
    }
  };

  const addInputField = () => {
    setInputKeys((prev) => [...prev, Date.now()]);
  };

  const removeInputField = (key) => {
    setPdfFiles((prev) => prev.filter((pf) => pf.key !== key));
    setInputKeys((prev) => prev.filter((k) => k !== key));
  };

  const fetchLetterheadImage = async () => {
    return fetch(letterheadImage).then((res) => res.arrayBuffer());
  };

  const mergePdfs = async () => {
    try {
      const mergedPdfDoc = await PDFDocument.create();
      const letterheadImageBytes = await fetchLetterheadImage();
      const letterheadImg = await mergedPdfDoc.embedJpg(letterheadImageBytes);

      for (const fileData of pdfFiles) {
        const pdfDoc = await PDFDocument.load(fileData.pdfBytes);
        const numPages = pdfDoc.getPageCount();

        for (let i = 0; i < numPages; i++) {
          const [embeddedPage] = await mergedPdfDoc.embedPages([
            pdfDoc.getPage(i),
          ]);
          const { width, height } = embeddedPage.size();

          const page = mergedPdfDoc.addPage([width, height]);

          const margin = 10;
          page.drawImage(letterheadImg, {
            x: margin,
            y: margin,
            width: width - 2 * margin,
            height: height - 2 * margin,
          });

          const contentMargin = 70;
          page.drawPage(embeddedPage, {
            x: contentMargin,
            y: contentMargin,
            width: width - 2 * contentMargin,
            height: height - 2 * contentMargin,
          });
        }
      }

      const mergedPdfBytes = await mergedPdfDoc.save();
      const mergedPdfDataUri = `data:application/pdf;base64,${Buffer.from(
        mergedPdfBytes
      ).toString("base64")}`;
      setMergedPdfUrl(mergedPdfDataUri);
    } catch (error) {
      console.error("An error occurred while merging PDFs:", error);
    }
  };

  return (
    <div className="container">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Merge PDF files
        </Typography>
        {inputKeys.map((key, index) => (
          <Box
            key={key}
            sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}
          >
            <input
              type="file"
              id={`pdfInput-${key}`}
              accept="application/pdf"
              onChange={(event) => handleFileChange(event, key)}
              style={{ flexGrow: 1, marginRight: 10 }}
            />
            <IconButton onClick={() => removeInputField(key)} color="error">
              <DeleteIcon />
            </IconButton>
            {index === inputKeys.length - 1 && (
              <IconButton onClick={addInputField} color="primary">
                <AddCircleOutlineIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          variant="contained"
          onClick={mergePdfs}
          disabled={pdfFiles.length === 0}
          style={{ marginTop: 20 }}
        >
          Merge PDFs
        </Button>
        {mergedPdfUrl && (
          <iframe
            title="Merged PDF"
            src={mergedPdfUrl}
            style={{ width: "100%", height: "500px", marginTop: 20 }}
            frameBorder="0"
          />
        )}
      </Box>
    </div>
  );
};

export default PdfMerger;
