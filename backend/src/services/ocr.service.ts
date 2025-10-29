import Tesseract from "tesseract.js";
import fs from 'fs/promises'
import pdfParse from 'pdf-parse'
import sharp from "sharp";


interface ExtractedData {
    rawText: string;
    confidence: number;
}

export class OCRService {

    /**
   * Main method - extracts text from PDF or image
   */

    async extractText(filePath: string, mimeType: string): Promise<ExtractedData> {
        try {
            if (mimeType === 'application/pdf') {
                return await this.extractFromPDF(filePath);

            }
            else if (mimeType.startsWith('image/')) {
                return await this.extractFromImage(filePath)

            }
            else {
                throw new Error(`Unsupported file type: ${mimeType}`);
            }
        } catch (error) {
            console.error('OCR extraction error:', error);
            throw error;
        }
    }

    private async extractFromPDF(filePath: string): Promise<ExtractedData> {
        const pdfParse = require("pdf-parse");
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return {
            rawText: data.text,
            confidence: 95
        }
    }

    private async extractFromImage(filePath: string): Promise<ExtractedData> {
        const processedPath = `${filePath}_processed.png`;
        await this.preprocessImage(filePath, processedPath);

        const { data } = await Tesseract.recognize(processedPath, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress:${Math.round(m.progress * 100)}%`)
                }
            }
        })
        await fs.unlink(processedPath).catch(() => { })
        return {
            rawText: data.text,
            confidence: data.confidence,
        };
    }

    /**
 * Preprocess image for better OCR accuracy
 */
    private async preprocessImage(inputPath: string, outputPath: string): Promise<void> {
        await sharp(inputPath)
            .grayscale()
            .normalize()
            .sharpen()
            .toFile(outputPath);
    }

}