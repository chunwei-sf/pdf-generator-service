const express = require('express');
const puppeteer = require('puppeteer');
const htmlToDocx = require('html-to-docx');

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;

// Health Check
app.get('/', (req, res) => {
    res.status(200).send('PDF Generator Service is online and healthy!');
});

// Define API endpoint at the path /convert
app.post('/convert', async (req, res) => {
    // Check if HTML content exists in req body
    if (!req.body.html) {
        return res.status(400).send({ error: 'HTML content is missing in the request body.' });
    }

    let browser;
    try {
        // Launch a headless browser instance.
        // The '--no-sandbox' flag is crucial for running in container env
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set the page content to the HTML from req
        await page.setContent(req.body.html, { waitUntil: 'networkidle0' });

        // Generate the PDF buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="report.pdf"',
            'Content-Length': pdfBuffer.length
        });
        res.end(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send({ error: 'Failed to generate PDF.' });
    } finally {
        // Always close browser instance
        if (browser) {
            await browser.close();
        }
    }
});

app.post('/convert-to-word', async (req, res) => {
    // Check if HTML content exists in req body
    if (!req.body.html) {
        return res.status(400).send({ error: 'HTML content is missing in the request body.' });
    }

    try {
        // Convert the HTML from the request body into a DOCX buffer
        const docxBuffer = await htmlToDocx(req.body.html, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        });

        // Set the correct headers for a .docx file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="report.docx"');
        
        // Send the buffer as the response
        res.send(docxBuffer);

    } catch (error) {
        console.error('Error generating DOCX:', error);
        res.status(500).send({ error: 'Failed to generate Word document.' });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`PDF Generator service listening on port ${PORT}`);
});