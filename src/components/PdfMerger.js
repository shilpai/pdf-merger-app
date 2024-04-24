import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Buffer } from "buffer";
import { Button, Box, TextField, Typography, IconButton, CircularProgress } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import letterheadImage from "./letterheadd.jpg";

const PdfMerger = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfUrls, setPdfUrls] = useState([{ key: Date.now(), url: '' }]);
  const [inputKeys, setInputKeys] = useState([Date.now()]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event, key) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5242880) { // 5MB in bytes
        alert('File size should not exceed 5MB.');
        return;
      }

      try {
        const pdfBytes = await file.arrayBuffer();
        setPdfFiles(prev => [
          ...prev.filter(pf => pf.key !== key),
          { key, pdfBytes }
        ]);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to load the PDF. It might be too large or corrupted.");
      }
    }
  };

  const handleUrlChange = (key, event) => {
    const newUrl = event.target.value;
    setPdfUrls(prev => prev.map(item => item.key === key ? { ...item, url: newUrl } : item));
  };

  const addUrlInput = () => {
    setPdfUrls(prev => [...prev, { key: Date.now(), url: '' }]);
  };

  const removeUrlInput = (key) => {
    setPdfUrls(prev => prev.filter(item => item.key !== key));
  };

  const addInputField = () => {
    setInputKeys(prev => [...prev, Date.now()]);
  };

  const removeInputField = (key) => {
    setPdfFiles(prev => prev.filter(pf => pf.key !== key));
    setInputKeys(prev => prev.filter(k => k !== key));
  };

  const fetchLetterheadImage = async () => {
    return fetch(letterheadImage).then(res => res.arrayBuffer());
  };

  const fetchPdfFromUrl = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch the PDF.');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 5242880) throw new Error('File size should not exceed 5MB.');
    return buffer;
  };

  const mergePdfs = async () => {
    setIsLoading(true);
    try {
      const mergedPdfDoc = await PDFDocument.create();
      const letterheadImageBytes = await fetchLetterheadImage();
      const letterheadImg = await mergedPdfDoc.embedJpg(letterheadImageBytes);

      for (const { pdfBytes } of pdfFiles) {
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const numPages = pdfDoc.getPageCount();

        for (let i = 0; i < numPages; i++) {
          const [embeddedPage] = await mergedPdfDoc.embedPages([pdfDoc.getPage(i)]);
          const { width, height } = embeddedPage.size();

          const page = mergedPdfDoc.addPage([width, height]);
          page.drawImage(letterheadImg, {
            x: 10,
            y: 10,
            width: width - 20,
            height: height - 20,
          });

          page.drawPage(embeddedPage, {
            x: 70,
            y: 70,
            width: width - 140,
            height: height - 140,
          });
        }
      }

      for (const { url } of pdfUrls) {
        if (url) {
          try {
            const urlPdfBytes = await fetchPdfFromUrl(url);
            const urlPdfDoc = await PDFDocument.load(urlPdfBytes);
            const urlNumPages = urlPdfDoc.getPageCount();
            for (let j = 0; j < urlNumPages; j++) {
              const [urlEmbeddedPage] = await mergedPdfDoc.embedPages([urlPdfDoc.getPage(j)]);
              const { width, height } = urlEmbeddedPage.size();
              const page = mergedPdfDoc.addPage([width, height]);
              page.drawImage(letterheadImg, {
                x: 10,
                y: 10,
                width: width - 20,
                height: height - 20,
              });

              page.drawPage(urlEmbeddedPage, {
                x: 70,
                y: 70,
                width: width - 140,
                height: height - 140,
              });
            }
          } catch (error) {
            console.error("Error fetching PDF from URL:", error);
            alert(`Error fetching PDF from URL: ${error.message}`);
            continue;
          }
        }
      }

      const mergedPdfBytes = await mergedPdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const mergedPdfDataUri = URL.createObjectURL(blob);
      setMergedPdfUrl(mergedPdfDataUri);
    } catch (error) {
      console.error("An error occurred while merging PDFs:", error);
      alert('An error occurred while merging PDFs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Merge PDF files
        </Typography>
        {pdfUrls.map((item, index) => (
          <Box key={item.key} sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            <TextField
              fullWidth
              label="PDF URL"
              variant="outlined"
              value={item.url}
              onChange={(e) => handleUrlChange(item.key, e)}
              style={{ flexGrow: 1, marginRight: 10 }}
            />
            <IconButton onClick={() => removeUrlInput(item.key)} color="error">
              <DeleteIcon />
            </IconButton>
            {index === pdfUrls.length - 1 && (
              <IconButton onClick={addUrlInput} color="primary">
                <AddCircleOutlineIcon />
              </IconButton>
            )}
          </Box>
        ))}
        {inputKeys.map((key, index) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
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
          disabled={isLoading || (pdfFiles.length === 0 && pdfUrls.every(item => !item.url))}
          style={{ marginTop: 20 }}
        >
          {isLoading ? <CircularProgress size={24} /> : "Merge PDFs"}
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
