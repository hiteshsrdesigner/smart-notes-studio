import * as pdfjsLib from "pdfjs-dist";
// Vite bundles the worker as a URL asset.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractionResult {
  pages: string[];
  fullText: string;
  scanned: boolean;
}

/**
 * Extracts text page-by-page from a typed PDF, grouping text items into lines
 * by their vertical position so paragraph/line order is preserved.
 */
export async function extractPdfText(file: File): Promise<ExtractionResult> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines: Record<number, string[]> = {};
    content.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    });
    const ys = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a);
    pages.push(ys.map((y) => lines[y].join(" ")).join("\n"));
  }

  const fullText = pages.join("\n");
  const scanned = fullText.trim().length < 10;
  return { pages, fullText, scanned };
}
