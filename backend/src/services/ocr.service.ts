import Tesseract from "tesseract.js";
import fs from 'fs/promises';
import sharp from "sharp";

const { PDFParse } = require('pdf-parse');



interface ExtractedData {
    rawText: string;
    confidence: number;
}

export class OCRService {

    async extractText(filePath: string, mimeType: string): Promise<ExtractedData> {
        try {
            if (mimeType === 'application/pdf') {
                return await this.extractFromPDF(filePath);
            }
            else if (mimeType.startsWith('image/')) {
                return await this.extractFromImage(filePath);
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
        const dataBuffer = await fs.readFile(filePath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();

        return {
            rawText: result.text,
            confidence: 95
        };
    }

    private async extractFromImage(filePath: string): Promise<ExtractedData> {
        const processedPath = `${filePath}_processed.png`;
        await this.preprocessImage(filePath, processedPath);

        const { data } = await Tesseract.recognize(processedPath, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        await fs.unlink(processedPath).catch(() => { });

        return {
            rawText: data.text,
            confidence: data.confidence,
        };
    }

    private async preprocessImage(inputPath: string, outputPath: string): Promise<void> {
        await sharp(inputPath)
            .grayscale()
            .normalize()
            .sharpen()
            .toFile(outputPath);
    }
}